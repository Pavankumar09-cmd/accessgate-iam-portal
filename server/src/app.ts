import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import rolesRoutes from './modules/roles/roles.routes';
import permissionsRoutes from './modules/permissions/permissions.routes';
import auditRoutes from './modules/audit/audit.routes';
import sessionsRoutes from './modules/sessions/sessions.routes';
import { errorHandler } from './middleware/error.middleware';

dotenv.config();

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());

// API Version 1 endpoints mount
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/roles', rolesRoutes);
app.use('/api/v1/permissions', permissionsRoutes);
app.use('/api/v1/audit', auditRoutes);
app.use('/api/v1/sessions', sessionsRoutes);

// Health check heartbeat
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ONLINE',
    timestamp: new Date().toISOString(),
    node: 'US-EAST-01',
  });
});

// Centralized error interceptor
app.use(errorHandler);

export default app;
