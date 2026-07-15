import { Schema, model, Document } from 'mongoose';

export interface IPermission extends Document {
  key: string;
  description: string;
  category: string;
}

const PermissionSchema = new Schema<IPermission>({
  key: { type: String, required: true, unique: true, index: true },
  description: { type: String, required: true },
  category: { type: String, required: true, index: true },
});

export default model<IPermission>('Permission', PermissionSchema);
