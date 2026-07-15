import { Router } from 'express';
import { getRoles, getRoleById, createRole, updateRole, deleteRole } from './roles.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/permissions.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getRoles); // Allow authenticated users to list roles (e.g. for User Management select fields)
router.get('/:id', getRoleById);
router.post('/', requirePermission('roles:manage'), createRole);
router.put('/:id', requirePermission('roles:manage'), updateRole);
router.delete('/:id', requirePermission('roles:manage'), deleteRole);

export default router;
