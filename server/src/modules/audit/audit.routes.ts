import { Router } from 'express';
import { getAuditLogs, getStats } from './audit.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/permissions.middleware';

const router = Router();

router.get('/stats', authenticate, getStats);
router.get('/', authenticate, requirePermission('audit:read'), getAuditLogs);

export default router;
