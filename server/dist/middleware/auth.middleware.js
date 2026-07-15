"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jwt_1 = require("../utils/jwt");
const User_1 = __importDefault(require("../models/User"));
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Authentication token is required.' });
        }
        const token = authHeader.split(' ')[1];
        let payload;
        try {
            payload = (0, jwt_1.verifyAccessToken)(token);
        }
        catch (err) {
            return res.status(401).json({ error: 'INVALID_TOKEN', message: 'Token is invalid or expired.' });
        }
        const user = await User_1.default.findById(payload.userId).populate({
            path: 'roles',
            populate: { path: 'permissions' },
        });
        if (!user) {
            return res.status(401).json({ error: 'USER_NOT_FOUND', message: 'User does not exist.' });
        }
        if (user.status === 'inactive') {
            return res.status(403).json({ error: 'ACCOUNT_DEACTIVATED', message: 'This account is deactivated.' });
        }
        req.user = user;
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.authenticate = authenticate;
