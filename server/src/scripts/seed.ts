import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from '../config/db';
import Permission from '../models/Permission';
import Role from '../models/Role';

dotenv.config();

const corePermissions = [
  // Users management permissions
  { key: 'users:read', description: 'View user list, states, and clearance profiles.', category: 'users' },
  { key: 'users:write', description: 'Create, update, deactivate, or delete user credentials.', category: 'users' },
  
  // Roles management
  { key: 'roles:manage', description: 'Create custom roles, adjust permission binds, delete roles.', category: 'roles' },
  
  // Audit system access
  { key: 'audit:read', description: 'View the system audit log database.', category: 'audit' },
  
  // Active session tracking
  { key: 'session:manage', description: 'Revoke active security sessions and refresh tokens.', category: 'sessions' },
];

const seed = async () => {
  try {
    await connectDB();

    console.log('[SEED] Clearing existing permissions and roles...');
    await Permission.deleteMany({});
    // We only delete system roles, or all roles to bootstrap fresh
    await Role.deleteMany({});

    console.log('[SEED] Inserting core permissions...');
    const insertedPermissions = await Permission.insertMany(corePermissions);
    console.log(`[SEED] Created ${insertedPermissions.length} permissions.`);

    // Map permissions by key for easy lookup
    const permMap: Record<string, mongoose.Types.ObjectId> = {};
    insertedPermissions.forEach(p => {
      permMap[p.key] = p._id as mongoose.Types.ObjectId;
    });

    console.log('[SEED] Creating standard security roles...');

    // 1. Super Admin: has all permissions
    const superAdmin = await Role.create({
      name: 'Super Admin',
      description: 'System master authorization. Inherits all security access gates.',
      permissions: Object.values(permMap),
      isSystemRole: true,
    });

    // 2. Admin: has users:read, users:write, session:manage
    const admin = await Role.create({
      name: 'Admin',
      description: 'Administrative clearance to manage user lists, statuses, and terminate sessions.',
      permissions: [
        permMap['users:read'],
        permMap['users:write'],
        permMap['session:manage'],
      ],
      isSystemRole: true,
    });

    // 3. Auditor: has audit:read
    const auditor = await Role.create({
      name: 'Auditor',
      description: 'Read-only access to immutable system audit trail logs.',
      permissions: [
        permMap['audit:read'],
      ],
      isSystemRole: true,
    });

    // 4. User: default role with no elevated permissions
    const user = await Role.create({
      name: 'User',
      description: 'Standard client clearance. View own active sessions and profile credentials.',
      permissions: [],
      isSystemRole: true,
    });

    console.log('[SEED] System roles successfully provisioned:');
    console.log(` - ${superAdmin.name} (${superAdmin.permissions.length} perms)`);
    console.log(` - ${admin.name} (${admin.permissions.length} perms)`);
    console.log(` - ${auditor.name} (${auditor.permissions.length} perms)`);
    console.log(` - ${user.name} (${user.permissions.length} perms)`);

    console.log('[SEED] Seed sequence completed successfully.');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('[SEED] Error running seed script:', error);
    process.exit(1);
  }
};

seed();
