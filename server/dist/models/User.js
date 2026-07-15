"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const UserSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    roles: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Role' }],
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
    lastLogin: { type: Date },
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },
}, {
    timestamps: true,
});
exports.default = (0, mongoose_1.model)('User', UserSchema);
