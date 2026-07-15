"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const SessionSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    refreshTokenHash: { type: String, required: true, unique: true },
    device: { type: String, required: true },
    ip: { type: String, required: true },
    revoked: { type: Boolean, default: false, index: true },
    expiresAt: { type: Date, required: true, index: true },
}, {
    timestamps: true,
});
exports.default = (0, mongoose_1.model)('Session', SessionSchema);
