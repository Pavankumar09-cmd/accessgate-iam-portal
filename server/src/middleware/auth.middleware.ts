import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import User, { IUser } from '../models/User';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Authentication token is required.' });
    }

    const token = authHeader.split(' ')[1];
    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch (err) {
      return res.status(401).json({ error: 'INVALID_TOKEN', message: 'Token is invalid or expired.' });
    }

    const user = await User.findById(payload.userId).populate({
      path: 'roles',
      populate: { path: 'permissions' },
    });

    if (!user) {
      return res.status(401).json({ error: 'USER_NOT_FOUND', message: 'User does not exist.' });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({ error: 'ACCOUNT_DEACTIVATED', message: 'This account is deactivated.' });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
