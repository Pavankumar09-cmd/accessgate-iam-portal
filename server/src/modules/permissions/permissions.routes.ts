import { Router } from 'express';
import { getPermissions } from './permissions.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, getPermissions);

export default router;
