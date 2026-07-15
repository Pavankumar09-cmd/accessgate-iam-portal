"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAudit = void 0;
const AuditLog_1 = __importDefault(require("../models/AuditLog"));
const mongoose_1 = require("mongoose");
const logAudit = async (params) => {
    try {
        const actorObjectId = params.actorId ? new mongoose_1.Types.ObjectId(params.actorId) : undefined;
        await AuditLog_1.default.create({
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
    }
    catch (err) {
        console.error('[SYSTEM AUDIT FAILED TO WRITE]', err);
    }
};
exports.logAudit = logAudit;
