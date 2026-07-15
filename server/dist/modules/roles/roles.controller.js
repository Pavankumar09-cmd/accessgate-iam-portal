"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRole = exports.updateRole = exports.createRole = exports.getRoleById = exports.getRoles = void 0;
const Role_1 = __importDefault(require("../../models/Role"));
const User_1 = __importDefault(require("../../models/User"));
const Permission_1 = __importDefault(require("../../models/Permission"));
const validator_1 = require("../../utils/validator");
const audit_1 = require("../../utils/audit");
const getRoles = async (req, res, next) => {
    try {
        const roles = await Role_1.default.find().populate('permissions');
        res.status(200).json(roles);
    }
    catch (error) {
        next(error);
    }
};
exports.getRoles = getRoles;
const getRoleById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const role = await Role_1.default.findById(id).populate('permissions');
        if (!role) {
            return res.status(404).json({ error: 'ROLE_NOT_FOUND', message: 'Role not found.' });
        }
        res.status(200).json(role);
    }
    catch (error) {
        next(error);
    }
};
exports.getRoleById = getRoleById;
const createRole = async (req, res, next) => {
    try {
        const validatedData = validator_1.roleCreateSchema.parse(req.body);
        const { name, description, permissions } = validatedData;
        const ip = req.ip || '127.0.0.1';
        const existingRole = await Role_1.default.findOne({ name });
        if (existingRole) {
            return res.status(400).json({ error: 'ROLE_EXISTS', message: 'Role name already exists.' });
        }
        // Verify all permissions exist
        const permissionsDocs = await Permission_1.default.find({ _id: { $in: permissions } });
        if (permissionsDocs.length !== permissions.length) {
            return res.status(400).json({ error: 'INVALID_PERMISSIONS', message: 'One or more permission IDs are invalid.' });
        }
        const role = await Role_1.default.create({
            name,
            description,
            permissions,
            isSystemRole: false,
        });
        await (0, audit_1.logAudit)({
            actorId: req.user?._id,
            actorEmail: req.user?.email || 'system',
            action: 'role:create',
            targetType: 'Role',
            targetId: role._id.toString(),
            status: 'GRANTED',
            metadata: { name: role.name, permissions: permissionsDocs.map(p => p.key) },
            ip,
        });
        const returnedRole = await Role_1.default.findById(role._id).populate('permissions');
        res.status(201).json(returnedRole);
    }
    catch (error) {
        next(error);
    }
};
exports.createRole = createRole;
const updateRole = async (req, res, next) => {
    try {
        const { id } = req.params;
        const validatedData = validator_1.roleCreateSchema.partial().parse(req.body);
        const ip = req.ip || '127.0.0.1';
        const role = await Role_1.default.findById(id);
        if (!role) {
            return res.status(404).json({ error: 'ROLE_NOT_FOUND', message: 'Role not found.' });
        }
        // System roles have name-change protections
        if (role.isSystemRole && validatedData.name && validatedData.name !== role.name) {
            return res.status(400).json({ error: 'SYSTEM_ROLE_RENAME_DENIED', message: 'System role names are read-only.' });
        }
        const oldState = {
            name: role.name,
            description: role.description,
            permissions: [...role.permissions],
        };
        if (validatedData.name) {
            const existing = await Role_1.default.findOne({ name: validatedData.name });
            if (existing && existing._id.toString() !== id) {
                return res.status(400).json({ error: 'ROLE_EXISTS', message: 'Role name already exists.' });
            }
            role.name = validatedData.name;
        }
        if (validatedData.description) {
            role.description = validatedData.description;
        }
        if (validatedData.permissions) {
            const permissionsDocs = await Permission_1.default.find({ _id: { $in: validatedData.permissions } });
            if (permissionsDocs.length !== validatedData.permissions.length) {
                return res.status(400).json({ error: 'INVALID_PERMISSIONS', message: 'One or more permission IDs are invalid.' });
            }
            role.permissions = validatedData.permissions;
        }
        await role.save();
        await (0, audit_1.logAudit)({
            actorId: req.user?._id,
            actorEmail: req.user?.email || 'system',
            action: 'role:update',
            targetType: 'Role',
            targetId: role._id.toString(),
            status: 'GRANTED',
            metadata: { before: oldState, after: { name: role.name, description: role.description, permissions: role.permissions } },
            ip,
        });
        const updatedRole = await Role_1.default.findById(role._id).populate('permissions');
        res.status(200).json(updatedRole);
    }
    catch (error) {
        next(error);
    }
};
exports.updateRole = updateRole;
const deleteRole = async (req, res, next) => {
    try {
        const { id } = req.params;
        const ip = req.ip || '127.0.0.1';
        const role = await Role_1.default.findById(id);
        if (!role) {
            return res.status(404).json({ error: 'ROLE_NOT_FOUND', message: 'Role not found.' });
        }
        // 1. Prevent deletion of System Roles
        if (role.isSystemRole) {
            await (0, audit_1.logAudit)({
                actorId: req.user?._id,
                actorEmail: req.user?.email || 'system',
                action: 'role:delete',
                targetType: 'Role',
                targetId: id,
                status: 'DENIED',
                metadata: { reason: 'System role deletion blocked', roleName: role.name },
                ip,
            });
            return res.status(400).json({ error: 'SYSTEM_ROLE_PROTECTED', message: 'System roles cannot be deleted.' });
        }
        // 2. Prevent deletion of a role that is in use
        const userWithRole = await User_1.default.findOne({ roles: id });
        if (userWithRole) {
            await (0, audit_1.logAudit)({
                actorId: req.user?._id,
                actorEmail: req.user?.email || 'system',
                action: 'role:delete',
                targetType: 'Role',
                targetId: id,
                status: 'DENIED',
                metadata: { reason: 'Role is in use', roleName: role.name, sampleUser: userWithRole.email },
                ip,
            });
            return res.status(400).json({
                error: 'ROLE_IN_USE',
                message: `Role is assigned to one or more users (e.g. ${userWithRole.email}) and cannot be deleted.`,
            });
        }
        await Role_1.default.findByIdAndDelete(id);
        await (0, audit_1.logAudit)({
            actorId: req.user?._id,
            actorEmail: req.user?.email || 'system',
            action: 'role:delete',
            targetType: 'Role',
            targetId: id,
            status: 'GRANTED',
            metadata: { name: role.name },
            ip,
        });
        res.status(200).json({ message: 'Role deleted successfully.' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteRole = deleteRole;
