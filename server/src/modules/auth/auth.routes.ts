import { Router } from 'express';
import { register, login, refresh, logout, forgotPassword, resetPassword } from './auth.controller';
import { authLimiter } from '../../middleware/rateLimit.middleware';

const router = Router();

// Apply auth rate limiting to registration and logins
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

export default router;
