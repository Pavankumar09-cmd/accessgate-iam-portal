import AuditLog from '../models/AuditLog';
import { Types } from 'mongoose';

interface AuditParams {
  actorId?: Types.ObjectId | string;
  actorEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  status: 'GRANTED' | 'DENIED' | 'INFO';
  metadata?: Record<string, any>;
  ip: string;
}

export const logAudit = async (params: AuditParams) => {
  try {
    const actorObjectId = params.actorId ? new Types.ObjectId(params.actorId) : undefined;
    await AuditLog.create({
      actorId: actorObjectId,
      actorEmail: params.actorEmail,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      status: params.status,
      metadata: params.metadata,
      ip: params.ip,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error('[SYSTEM AUDIT FAILED TO WRITE]', err);
  }
};
