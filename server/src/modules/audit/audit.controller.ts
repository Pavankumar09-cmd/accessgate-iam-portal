import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import AuditLog from '../../models/AuditLog';

export const getAuditLogs = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { actor, action, status, targetType, limit } = req.query;
    const query: any = {};

    if (actor) {
      query.actorEmail = { $regex: actor, $options: 'i' };
    }

    if (action) {
      query.action = { $regex: action, $options: 'i' };
    }

    if (status) {
      query.status = status;
    }

    if (targetType) {
      query.targetType = targetType;
    }

    const logLimit = limit ? parseInt(limit as string, 10) : 100;

    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .limit(logLimit);

    res.status(200).json(logs);
  } catch (error) {
    next(error);
  }
};

export const getStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const User = require('../../models/User').default;
    const Role = require('../../models/Role').default;
    const Session = require('../../models/Session').default;

    const activeUsers = await User.countDocuments({ status: 'active' });
    const totalRoles = await Role.countDocuments();
    const activeSessions = await Session.countDocuments({
      revoked: false,
      expiresAt: { $gt: new Date() },
    });

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const failedLogins = await AuditLog.countDocuments({
      action: 'auth:login',
      status: 'DENIED',
      timestamp: { $gt: oneDayAgo },
    });

    res.status(200).json({
      activeUsers,
      totalRoles,
      activeSessions,
      failedLogins,
    });
  } catch (error) {
    next(error);
  }
};

