import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import Permission from '../../models/Permission';

export const getPermissions = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const permissions = await Permission.find().sort({ category: 1, key: 1 });
    res.status(200).json(permissions);
  } catch (error) {
    next(error);
  }
};
