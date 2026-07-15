"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const users_routes_1 = __importDefault(require("./modules/users/users.routes"));
const roles_routes_1 = __importDefault(require("./modules/roles/roles.routes"));
const permissions_routes_1 = __importDefault(require("./modules/permissions/permissions.routes"));
const audit_routes_1 = __importDefault(require("./modules/audit/audit.routes"));
const sessions_routes_1 = __importDefault(require("./modules/sessions/sessions.routes"));
const error_middleware_1 = require("./middleware/error.middleware");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(express_1.default.json());
// API Version 1 endpoints mount
app.use('/api/v1/auth', auth_routes_1.default);
app.use('/api/v1/users', users_routes_1.default);
app.use('/api/v1/roles', roles_routes_1.default);
app.use('/api/v1/permissions', permissions_routes_1.default);
app.use('/api/v1/audit', audit_routes_1.default);
app.use('/api/v1/sessions', sessions_routes_1.default);
// Health check heartbeat
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ONLINE',
        timestamp: new Date().toISOString(),
        node: 'US-EAST-01',
    });
});
// Centralized error interceptor
app.use(error_middleware_1.errorHandler);
exports.default = app;
