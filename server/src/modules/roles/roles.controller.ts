import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import Role from '../../models/Role';
import User from '../../models/User';
import Permission from '../../models/Permission';
import { roleCreateSchema } from '../../utils/validator';
import { logAudit } from '../../utils/audit';

export const getRoles = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const roles = await Role.find().populate('permissions');
    res.status(200).json(roles);
  } catch (error) {
    next(error);
  }
};

export const getRoleById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const role = await Role.findById(id).populate('permissions');
    if (!role) {
      return res.status(404).json({ error: 'ROLE_NOT_FOUND', message: 'Role not found.' });
    }
    res.status(200).json(role);
  } catch (error) {
    next(error);
  }
};

export const createRole = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const validatedData = roleCreateSchema.parse(req.body);
    const { name, description, permissions } = validatedData;
    const ip = req.ip || '127.0.0.1';

    const existingRole = await Role.findOne({ name });
    if (existingRole) {
      return res.status(400).json({ error: 'ROLE_EXISTS', message: 'Role name already exists.' });
    }

    // Verify all permissions exist
    const permissionsDocs = await Permission.find({ _id: { $in: permissions } });
    if (permissionsDocs.length !== permissions.length) {
      return res.status(400).json({ error: 'INVALID_PERMISSIONS', message: 'One or more permission IDs are invalid.' });
    }

    const role = await Role.create({
      name,
      description,
      permissions,
      isSystemRole: false,
    });

    await logAudit({
      actorId: req.user?._id,
      actorEmail: req.user?.email || 'system',
      action: 'role:create',
      targetType: 'Role',
      targetId: role._id.toString(),
      status: 'GRANTED',
      metadata: { name: role.name, permissions: permissionsDocs.map(p => p.key) },
      ip,
    });

    const returnedRole = await Role.findById(role._id).populate('permissions');
    res.status(201).json(returnedRole);
  } catch (error) {
    next(error);
  }
};

export const updateRole = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const validatedData = roleCreateSchema.partial().parse(req.body);
    const ip = req.ip || '127.0.0.1';

    const role = await Role.findById(id);
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
      const existing = await Role.findOne({ name: validatedData.name });
      if (existing && existing._id.toString() !== id) {
        return res.status(400).json({ error: 'ROLE_EXISTS', message: 'Role name already exists.' });
      }
      role.name = validatedData.name;
    }

    if (validatedData.description) {
      role.description = validatedData.description;
    }

    if (validatedData.permissions) {
      const permissionsDocs = await Permission.find({ _id: { $in: validatedData.permissions } });
      if (permissionsDocs.length !== validatedData.permissions.length) {
        return res.status(400).json({ error: 'INVALID_PERMISSIONS', message: 'One or more permission IDs are invalid.' });
      }
      role.permissions = validatedData.permissions as any[];
    }

    await role.save();

    await logAudit({
      actorId: req.user?._id,
      actorEmail: req.user?.email || 'system',
      action: 'role:update',
      targetType: 'Role',
      targetId: role._id.toString(),
      status: 'GRANTED',
      metadata: { before: oldState, after: { name: role.name, description: role.description, permissions: role.permissions } },
      ip,
    });

    const updatedRole = await Role.findById(role._id).populate('permissions');
    res.status(200).json(updatedRole);
  } catch (error) {
    next(error);
  }
};

export const deleteRole = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const ip = req.ip || '127.0.0.1';

    const role = await Role.findById(id);
    if (!role) {
      return res.status(404).json({ error: 'ROLE_NOT_FOUND', message: 'Role not found.' });
    }

    // 1. Prevent deletion of System Roles
    if (role.isSystemRole) {
      await logAudit({
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
    const userWithRole = await User.findOne({ roles: id });
    if (userWithRole) {
      await logAudit({
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

    await Role.findByIdAndDelete(id);

    await logAudit({
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
  } catch (error) {
    next(error);
  }
};
