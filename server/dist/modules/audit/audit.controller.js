"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStats = exports.getAuditLogs = void 0;
const AuditLog_1 = __importDefault(require("../../models/AuditLog"));
const getAuditLogs = async (req, res, next) => {
    try {
        const { actor, action, status, targetType, limit } = req.query;
        const query = {};
        if (actor) {
            query.actorEmail = { $regex: actor, $options: 'i' };
        }
        if (action) {
            query.action = { $regex: action, $options: 'i' };
        }
        if (status) {
            query.status = status;
        }
        if (targetType) {
            query.targetType = targetType;
        }
        const logLimit = limit ? parseInt(limit, 10) : 100;
        const logs = await AuditLog_1.default.find(query)
            .sort({ timestamp: -1 })
            .limit(logLimit);
        res.status(200).json(logs);
    }
    catch (error) {
        next(error);
    }
};
exports.getAuditLogs = getAuditLogs;
const getStats = async (req, res, next) => {
    try {
        const User = require('../../models/User').default;
        const Role = require('../../models/Role').default;
        const Session = require('../../models/Session').default;
        const activeUsers = await User.countDocuments({ status: 'active' });
        const totalRoles = await Role.countDocuments();
        const activeSessions = await Session.countDocuments({
            revoked: false,
            expiresAt: { $gt: new Date() },
        });
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const failedLogins = await AuditLog_1.default.countDocuments({
            action: 'auth:login',
            status: 'DENIED',
            timestamp: { $gt: oneDayAgo },
        });
        res.status(200).json({
            activeUsers,
            totalRoles,
            activeSessions,
            failedLogins,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getStats = getStats;
