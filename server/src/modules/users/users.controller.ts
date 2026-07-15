import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import User from '../../models/User';
import Role from '../../models/Role';
import Session from '../../models/Session';
import bcrypt from 'bcrypt';
import { userCreateSchema, userUpdateSchema } from '../../utils/validator';
import { logAudit } from '../../utils/audit';

export const getUsers = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { search, role, status } = req.query;
    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (status) {
      query.status = status;
    }

    if (role) {
      // Find role ID by name or direct ID match
      const roleObj = await Role.findOne({ name: role });
      if (roleObj) {
        query.roles = roleObj._id;
      }
    }

    const users = await User.find(query)
      .select('-passwordHash')
      .populate('roles')
      .sort({ createdAt: -1 });

    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-passwordHash').populate('roles');
    if (!user) {
      return res.status(404).json({ error: 'USER_NOT_FOUND', message: 'User not found.' });
    }
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const validatedData = userCreateSchema.parse(req.body);
    const { name, email, password, roles } = validatedData;
    const ip = req.ip || '127.0.0.1';

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'EMAIL_EXISTS', message: 'Email address is already in use.' });
    }

    // Verify all role IDs exist
    const roleDocs = await Role.find({ _id: { $in: roles } });
    if (roleDocs.length !== roles.length) {
      return res.status(400).json({ error: 'INVALID_ROLES', message: 'One or more role IDs are invalid.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      passwordHash,
      roles,
      status: 'active',
    });

    await logAudit({
      actorId: req.user?._id,
      actorEmail: req.user?.email || 'system',
      action: 'user:create',
      targetType: 'User',
      targetId: user._id.toString(),
      status: 'GRANTED',
      metadata: { name: user.name, email: user.email, roles: roleDocs.map(r => r.name) },
      ip,
    });

    const returnedUser = await User.findById(user._id).select('-passwordHash').populate('roles');
    res.status(201).json(returnedUser);
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const validatedData = userUpdateSchema.parse(req.body);
    const ip = req.ip || '127.0.0.1';

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'USER_NOT_FOUND', message: 'User not found.' });
    }

    // Capture old states for Audit Log diffing
    const oldState = {
      name: user.name,
      email: user.email,
      roles: [...user.roles],
      status: user.status,
    };

    if (validatedData.name) user.name = validatedData.name;
    if (validatedData.email && validatedData.email !== user.email) {
      const existingUser = await User.findOne({ email: validatedData.email });
      if (existingUser) {
        return res.status(400).json({ error: 'EMAIL_EXISTS', message: 'Email address is already in use.' });
      }
      user.email = validatedData.email;
    }

    if (validatedData.password) {
      user.passwordHash = await bcrypt.hash(validatedData.password, 10);
      // Revoke sessions when password is reset/changed by admin
      await Session.updateMany({ userId: user._id }, { revoked: true });
    }

    if (validatedData.roles) {
      const roleDocs = await Role.find({ _id: { $in: validatedData.roles } });
      if (roleDocs.length !== validatedData.roles.length) {
        return res.status(400).json({ error: 'INVALID_ROLES', message: 'One or more role IDs are invalid.' });
      }
      user.roles = validatedData.roles as any[];
    }

    if (validatedData.status) {
      // If status changed to inactive, revoke active refresh sessions
      if (validatedData.status === 'inactive' && user.status === 'active') {
        await Session.updateMany({ userId: user._id }, { revoked: true });
      }
      user.status = validatedData.status;
    }

    await user.save();

    await logAudit({
      actorId: req.user?._id,
      actorEmail: req.user?.email || 'system',
      action: 'user:update',
      targetType: 'User',
      targetId: user._id.toString(),
      status: 'GRANTED',
      metadata: {
        before: oldState,
        after: {
          name: user.name,
          email: user.email,
          roles: user.roles,
          status: user.status,
        },
      },
      ip,
    });

    const updatedUser = await User.findById(user._id).select('-passwordHash').populate('roles');
    res.status(200).json(updatedUser);
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const ip = req.ip || '127.0.0.1';

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'USER_NOT_FOUND', message: 'User not found.' });
    }

    // Do not delete oneself
    if (user._id.toString() === req.user?._id.toString()) {
      return res.status(400).json({ error: 'SELF_DELETION_DENIED', message: 'You cannot delete your own account.' });
    }

    // Revoke sessions
    await Session.updateMany({ userId: user._id }, { revoked: true });
    
    // Hard delete
    await User.findByIdAndDelete(id);

    await logAudit({
      actorId: req.user?._id,
      actorEmail: req.user?.email || 'system',
      action: 'user:delete',
      targetType: 'User',
      targetId: id,
      status: 'GRANTED',
      metadata: { name: user.name, email: user.email },
      ip,
    });

    res.status(200).json({ message: 'User deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    next(error);
  }
};

