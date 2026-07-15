import { Router } from 'express';
import { getActiveSessions, revokeSession, revokeAllOtherSessions } from './sessions.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, getActiveSessions);
router.post('/revoke-all-others', authenticate, revokeAllOtherSessions);
router.delete('/:sessionId', authenticate, revokeSession);

export default router;
