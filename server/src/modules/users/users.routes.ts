import { Router } from 'express';
import { getUsers, getUserById, createUser, updateUser, deleteUser, getMe } from './users.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/permissions.middleware';

const router = Router();

router.use(authenticate);

router.get('/me', getMe);
router.get('/', requirePermission('users:read'), getUsers);
router.get('/:id', requirePermission('users:read'), getUserById);
router.post('/', requirePermission('users:write'), createUser);
router.put('/:id', requirePermission('users:write'), updateUser);
router.delete('/:id', requirePermission('users:write'), deleteUser);

export default router;
