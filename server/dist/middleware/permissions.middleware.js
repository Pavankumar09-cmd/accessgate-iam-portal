"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePermission = void 0;
const audit_1 = require("../utils/audit");
const requirePermission = (requiredPermission) => {
    return async (req, res, next) => {
        try {
            const user = req.user;
            const ip = req.ip || '127.0.0.1';
            if (!user) {
                return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Authentication required.' });
            }
            // Resolve user's permissions from their populated roles
            const resolvedPermissions = [];
            const userRoles = [];
            if (user.roles && user.roles.length > 0) {
                for (const roleObj of user.roles) {
                    userRoles.push(roleObj.name);
                    if (roleObj.permissions && roleObj.permissions.length > 0) {
                        for (const permObj of roleObj.permissions) {
                            resolvedPermissions.push(permObj.key);
                        }
                    }
                }
            }
            const isSuperAdmin = userRoles.includes('Super Admin');
            const hasPermission = isSuperAdmin || resolvedPermissions.includes(requiredPermission);
            if (!hasPermission) {
                // Log unauthorized attempt in Audit Log
                await (0, audit_1.logAudit)({
                    actorId: user._id.toString(),
                    actorEmail: user.email,
                    action: req.method + ':' + req.originalUrl,
                    targetType: 'Permission',
                    targetId: requiredPermission,
                    status: 'DENIED',
                    metadata: {
                        reason: 'Insufficient clearance permissions',
                        requiredPermission,
                        userRoles,
                        userPermissionsCount: resolvedPermissions.length,
                    },
                    ip,
                });
                return res.status(403).json({
                    error: 'ACCESS_DENIED',
                    message: `Access denied. Clearance key '${requiredPermission}' is required.`,
                });
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.requirePermission = requirePermission;
