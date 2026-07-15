import { Schema, model, Document, Types } from 'mongoose';

export interface ISession extends Document {
  userId: Types.ObjectId;
  refreshTokenHash: string;
  device: string;
  ip: string;
  revoked: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema = new Schema<ISession>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  refreshTokenHash: { type: String, required: true, unique: true },
  device: { type: String, required: true },
  ip: { type: String, required: true },
  revoked: { type: Boolean, default: false, index: true },
  expiresAt: { type: Date, required: true, index: true },
}, {
  timestamps: true,
});

export default model<ISession>('Session', SessionSchema);
