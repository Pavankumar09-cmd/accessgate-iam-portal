"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.revokeAllOtherSessions = exports.revokeSession = exports.getActiveSessions = void 0;
const Session_1 = __importDefault(require("../../models/Session"));
const audit_1 = require("../../utils/audit");
const getActiveSessions = async (req, res, next) => {
    try {
        const userId = req.user?._id;
        const ip = req.ip || '127.0.0.1';
        const sessions = await Session_1.default.find({
            userId,
            revoked: false,
            expiresAt: { $gt: new Date() },
        }).sort({ updatedAt: -1 });
        res.status(200).json(sessions);
    }
    catch (error) {
        next(error);
    }
};
exports.getActiveSessions = getActiveSessions;
const revokeSession = async (req, res, next) => {
    try {
        const userId = req.user?._id;
        const { sessionId } = req.params;
        const ip = req.ip || '127.0.0.1';
        const session = await Session_1.default.findOne({ _id: sessionId, userId });
        if (!session) {
            return res.status(404).json({ error: 'SESSION_NOT_FOUND', message: 'Active session not found.' });
        }
        session.revoked = true;
        await session.save();
        await (0, audit_1.logAudit)({
            actorId: userId,
            actorEmail: req.user?.email || 'unknown@corp.com',
            action: 'session:revoke',
            targetType: 'Session',
            targetId: sessionId,
            status: 'GRANTED',
            metadata: { device: session.device, sessionIp: session.ip },
            ip,
        });
        res.status(200).json({ message: 'Session revoked successfully.' });
    }
    catch (error) {
        next(error);
    }
};
exports.revokeSession = revokeSession;
const revokeAllOtherSessions = async (req, res, next) => {
    try {
        const userId = req.user?._id;
        const ip = req.ip || '127.0.0.1';
        // We keep the current session if possible. To identify it, we'd need to match hashes.
        // However, if we don't have the refresh token in the body, we can query other sessions.
        // Let's revoke all sessions other than the current request's active refresh token if provided,
        // or simply revoke ALL sessions and force a re-login.
        // A clean way: the user sends their current sessionId, or we revoke all other sessions.
        const { currentSessionId } = req.body;
        const query = { userId, revoked: false };
        if (currentSessionId) {
            query._id = { $ne: currentSessionId };
        }
        const result = await Session_1.default.updateMany(query, { revoked: true });
        await (0, audit_1.logAudit)({
            actorId: userId,
            actorEmail: req.user?.email || 'unknown@corp.com',
            action: 'session:revoke_all_others',
            targetType: 'Session',
            targetId: userId?.toString() || 'N/A',
            status: 'GRANTED',
            metadata: { count: result.modifiedCount },
            ip,
        });
        res.status(200).json({ message: `Successfully terminated ${result.modifiedCount} other sessions.` });
    }
    catch (error) {
        next(error);
    }
};
exports.revokeAllOtherSessions = revokeAllOtherSessions;
