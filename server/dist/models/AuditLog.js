"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const AuditLogSchema = new mongoose_1.Schema({
    actorId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', index: true },
    actorEmail: { type: String, required: true, index: true },
    action: { type: String, required: true, index: true },
    targetType: { type: String, required: true },
    targetId: { type: String, required: true },
    status: { type: String, enum: ['GRANTED', 'DENIED', 'INFO'], required: true, index: true },
    metadata: { type: mongoose_1.Schema.Types.Mixed },
    ip: { type: String, required: true },
    timestamp: { type: Date, default: Date.now, index: true },
});
exports.default = (0, mongoose_1.model)('AuditLog', AuditLogSchema);
