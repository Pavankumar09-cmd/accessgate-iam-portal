"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const rateLimit_middleware_1 = require("../../middleware/rateLimit.middleware");
const router = (0, express_1.Router)();
// Apply auth rate limiting to registration and logins
router.post('/register', rateLimit_middleware_1.authLimiter, auth_controller_1.register);
router.post('/login', rateLimit_middleware_1.authLimiter, auth_controller_1.login);
router.post('/refresh', auth_controller_1.refresh);
router.post('/logout', auth_controller_1.logout);
router.post('/forgot-password', rateLimit_middleware_1.authLimiter, auth_controller_1.forgotPassword);
router.post('/reset-password', rateLimit_middleware_1.authLimiter, auth_controller_1.resetPassword);
exports.default = router;
