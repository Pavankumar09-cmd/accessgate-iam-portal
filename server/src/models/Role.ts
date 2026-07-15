import { Schema, model, Document, Types } from 'mongoose';

export interface IRole extends Document {
  name: string;
  description: string;
  permissions: Types.ObjectId[];
  isSystemRole: boolean;
}

const RoleSchema = new Schema<IRole>({
  name: { type: String, required: true, unique: true, index: true },
  description: { type: String, required: true },
  permissions: [{ type: Schema.Types.ObjectId, ref: 'Permission' }],
  isSystemRole: { type: Boolean, default: false },
});

export default model<IRole>('Role', RoleSchema);
