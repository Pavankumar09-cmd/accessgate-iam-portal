import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import Session from '../../models/Session';
import { logAudit } from '../../utils/audit';

export const getActiveSessions = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const ip = req.ip || '127.0.0.1';

    const sessions = await Session.find({
      userId,
      revoked: false,
      expiresAt: { $gt: new Date() },
    }).sort({ updatedAt: -1 });

    res.status(200).json(sessions);
  } catch (error) {
    next(error);
  }
};

export const revokeSession = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const { sessionId } = req.params;
    const ip = req.ip || '127.0.0.1';

    const session = await Session.findOne({ _id: sessionId, userId });

    if (!session) {
      return res.status(404).json({ error: 'SESSION_NOT_FOUND', message: 'Active session not found.' });
    }

    session.revoked = true;
    await session.save();

    await logAudit({
      actorId: userId,
      actorEmail: req.user?.email || 'unknown@corp.com',
      action: 'session:revoke',
      targetType: 'Session',
      targetId: sessionId,
      status: 'GRANTED',
      metadata: { device: session.device, sessionIp: session.ip },
      ip,
    });

    res.status(200).json({ message: 'Session revoked successfully.' });
  } catch (error) {
    next(error);
  }
};

export const revokeAllOtherSessions = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const ip = req.ip || '127.0.0.1';
    
    // We keep the current session if possible. To identify it, we'd need to match hashes.
    // However, if we don't have the refresh token in the body, we can query other sessions.
    // Let's revoke all sessions other than the current request's active refresh token if provided,
    // or simply revoke ALL sessions and force a re-login.
    // A clean way: the user sends their current sessionId, or we revoke all other sessions.
    const { currentSessionId } = req.body;

    const query: any = { userId, revoked: false };
    if (currentSessionId) {
      query._id = { $ne: currentSessionId };
    }

    const result = await Session.updateMany(query, { revoked: true });

    await logAudit({
      actorId: userId,
      actorEmail: req.user?.email || 'unknown@corp.com',
      action: 'session:revoke_all_others',
      targetType: 'Session',
      targetId: userId?.toString() || 'N/A',
      status: 'GRANTED',
      metadata: { count: result.modifiedCount },
      ip,
    });

    res.status(200).json({ message: `Successfully terminated ${result.modifiedCount} other sessions.` });
  } catch (error) {
    next(error);
  }
};
