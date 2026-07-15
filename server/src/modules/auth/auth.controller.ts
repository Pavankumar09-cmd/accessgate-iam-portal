import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import User from '../../models/User';
import Role from '../../models/Role';
import Session from '../../models/Session';
import { generateAccessToken, generateRefreshToken, hashToken, verifyRefreshToken } from '../../utils/jwt';
import { logAudit } from '../../utils/audit';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../../utils/validator';
import crypto from 'crypto';

const REFRESH_COOKIE_NAME = 'accessgate_refresh';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const { name, email, password } = validatedData;
    const ip = req.ip || '127.0.0.1';

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      await logAudit({
        actorEmail: email,
        action: 'auth:register',
        targetType: 'User',
        targetId: 'N/A',
        status: 'DENIED',
        metadata: { reason: 'Email already registered' },
        ip,
      });
      return res.status(400).json({ error: 'EMAIL_EXISTS', message: 'Email address already in use.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    // Find default role (User). If no users exist, assign Super Admin to the first registered user.
    const userCount = await User.countDocuments();
    let userRole = await Role.findOne({ name: 'User' });
    
    if (userCount === 0) {
      userRole = await Role.findOne({ name: 'Super Admin' });
    }

    const rolesList = userRole ? [userRole._id] : [];

    const user = await User.create({
      name,
      email,
      passwordHash,
      roles: rolesList,
      status: 'active',
    });

    await logAudit({
      actorId: user._id.toString(),
      actorEmail: user.email,
      action: 'auth:register',
      targetType: 'User',
      targetId: user._id.toString(),
      status: 'GRANTED',
      metadata: { roles: userRole ? [userRole.name] : [] },
      ip,
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        status: user.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const { email, password } = validatedData;
    const ip = req.ip || '127.0.0.1';
    const device = req.headers['user-agent'] || 'Unknown Device';

    const user = await User.findOne({ email }).populate('roles');
    if (!user) {
      await logAudit({
        actorEmail: email,
        action: 'auth:login',
        targetType: 'User',
        targetId: 'N/A',
        status: 'DENIED',
        metadata: { reason: 'User not found' },
        ip,
      });
      return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' });
    }

    if (user.status === 'inactive') {
      await logAudit({
        actorId: user._id.toString(),
        actorEmail: user.email,
        action: 'auth:login',
        targetType: 'User',
        targetId: user._id.toString(),
        status: 'DENIED',
        metadata: { reason: 'Account deactivated' },
        ip,
      });
      return res.status(403).json({ error: 'ACCOUNT_DEACTIVATED', message: 'This account has been deactivated.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      await logAudit({
        actorId: user._id.toString(),
        actorEmail: user.email,
        action: 'auth:login',
        targetType: 'User',
        targetId: user._id.toString(),
        status: 'DENIED',
        metadata: { reason: 'Incorrect password' },
        ip,
      });
      return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' });
    }

    const tokenPayload = { userId: user._id.toString(), email: user.email };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Save refresh token session in database
    const hashed = hashToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await Session.create({
      userId: user._id,
      refreshTokenHash: hashed,
      device,
      ip,
      expiresAt,
    });

    user.lastLogin = new Date();
    await user.save();

    await logAudit({
      actorId: user._id.toString(),
      actorEmail: user.email,
      action: 'auth:login',
      targetType: 'User',
      targetId: user._id.toString(),
      status: 'GRANTED',
      metadata: { device, ip },
      ip,
    });

    // Set refresh token in httpOnly cookie
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        roles: user.roles,
        status: user.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawCookies = req.headers.cookie;
    let refreshToken = '';
    
    if (rawCookies) {
      const match = rawCookies.split(';').map(c => c.trim()).find(c => c.startsWith(`${REFRESH_COOKIE_NAME}=`));
      if (match) {
        refreshToken = match.split('=')[1];
      }
    }

    const ip = req.ip || '127.0.0.1';
    const device = req.headers['user-agent'] || 'Unknown Device';

    if (!refreshToken) {
      return res.status(401).json({ error: 'NO_TOKEN', message: 'No refresh token provided.' });
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (err) {
      return res.status(401).json({ error: 'INVALID_TOKEN', message: 'Invalid or expired refresh token.' });
    }

    const oldHash = hashToken(refreshToken);
    const session = await Session.findOne({ refreshTokenHash: oldHash });

    if (!session || session.revoked || session.expiresAt < new Date()) {
      // Security breach warning: if session is not found or revoked, this is a token reuse!
      if (session && session.revoked) {
        // Revoke all sessions for this compromised user
        await Session.updateMany({ userId: session.userId }, { revoked: true });
        await logAudit({
          actorEmail: payload.email,
          action: 'auth:refresh_reuse_detected',
          targetType: 'Session',
          targetId: session._id.toString(),
          status: 'DENIED',
          metadata: { reason: 'Refresh token reuse detected. Revoking all sessions.' },
          ip,
        });
      }
      return res.status(401).json({ error: 'REVOKED_TOKEN', message: 'Token is revoked or expired.' });
    }

    // Rotate token
    const tokenPayload = { userId: payload.userId, email: payload.email };
    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);
    const newHash = hashToken(newRefreshToken);

    // Update existing session with rotated hash and updated expiresAt
    session.refreshTokenHash = newHash;
    session.ip = ip;
    session.device = device;
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);
    session.expiresAt = newExpiresAt;
    await session.save();

    // Set new cookie
    res.cookie(REFRESH_COOKIE_NAME, newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ accessToken: newAccessToken });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawCookies = req.headers.cookie;
    let refreshToken = '';
    
    if (rawCookies) {
      const match = rawCookies.split(';').map(c => c.trim()).find(c => c.startsWith(`${REFRESH_COOKIE_NAME}=`));
      if (match) {
        refreshToken = match.split('=')[1];
      }
    }

    const ip = req.ip || '127.0.0.1';

    if (refreshToken) {
      const hashed = hashToken(refreshToken);
      const session = await Session.findOne({ refreshTokenHash: hashed });
      
      if (session) {
        session.revoked = true;
        await session.save();

        const user = await User.findById(session.userId);
        await logAudit({
          actorId: session.userId,
          actorEmail: user ? user.email : 'unknown@corp.com',
          action: 'auth:logout',
          targetType: 'Session',
          targetId: session._id.toString(),
          status: 'GRANTED',
          metadata: { reason: 'User initiated logout' },
          ip,
        });
      }
    }

    res.clearCookie(REFRESH_COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = forgotPasswordSchema.parse(req.body);
    const { email } = validatedData;
    const ip = req.ip || '127.0.0.1';

    const user = await User.findOne({ email });
    if (!user) {
      // Secure: Do not leak whether the user exists or not, but audit the attempt.
      await logAudit({
        actorEmail: email,
        action: 'auth:forgot_password',
        targetType: 'User',
        targetId: 'N/A',
        status: 'DENIED',
        metadata: { reason: 'User email not found for reset request' },
        ip,
      });
      return res.status(200).json({ message: 'If the email exists, a password reset link has been dispatched.' });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour expiry
    await user.save();

    await logAudit({
      actorId: user._id.toString(),
      actorEmail: user.email,
      action: 'auth:forgot_password',
      targetType: 'User',
      targetId: user._id.toString(),
      status: 'GRANTED',
      metadata: { msg: 'Reset link generated' },
      ip,
    });

    // Offline Mode logging for email reset links
    console.log('\n==================================================');
    console.log('[MAIL MOCK] PASSWORD RESET LINK DISPATCHED:');
    console.log(`To: ${email}`);
    console.log(`Link: http://localhost:5173/reset-password?token=${token}`);
    console.log('==================================================\n');

    res.status(200).json({ message: 'If the email exists, a password reset link has been dispatched.' });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = resetPasswordSchema.parse(req.body);
    const { token, password } = validatedData;
    const ip = req.ip || '127.0.0.1';

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      await logAudit({
        actorEmail: 'unknown',
        action: 'auth:reset_password',
        targetType: 'User',
        targetId: 'N/A',
        status: 'DENIED',
        metadata: { reason: 'Invalid or expired password reset token' },
        ip,
      });
      return res.status(400).json({ error: 'INVALID_TOKEN', message: 'Token is invalid or has expired.' });
    }

    user.passwordHash = await bcrypt.hash(password, 10);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Revoke all existing sessions for safety upon password change
    await Session.updateMany({ userId: user._id }, { revoked: true });

    await logAudit({
      actorId: user._id.toString(),
      actorEmail: user.email,
      action: 'auth:reset_password',
      targetType: 'User',
      targetId: user._id.toString(),
      status: 'GRANTED',
      metadata: { msg: 'Password reset successful. Sessions cleared.' },
      ip,
    });

    res.status(200).json({ message: 'Password has been reset successfully. Please log in with your new password.' });
  } catch (error) {
    next(error);
  }
};
