import { Schema, model, Document, Types } from 'mongoose';

export interface IAuditLog extends Document {
  actorId?: Types.ObjectId;
  actorEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  status: 'GRANTED' | 'DENIED' | 'INFO';
  metadata?: Record<string, any>;
  ip: string;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
  actorId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  actorEmail: { type: String, required: true, index: true },
  action: { type: String, required: true, index: true },
  targetType: { type: String, required: true },
  targetId: { type: String, required: true },
  status: { type: String, enum: ['GRANTED', 'DENIED', 'INFO'], required: true, index: true },
  metadata: { type: Schema.Types.Mixed },
  ip: { type: String, required: true },
  timestamp: { type: Date, default: Date.now, index: true },
});

export default model<IAuditLog>('AuditLog', AuditLogSchema);
