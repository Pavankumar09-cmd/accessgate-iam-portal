"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const zod_1 = require("zod");
const errorHandler = (err, req, res, next) => {
    // Log error on server console
    console.error('[SERVER EXCEPTION]', err);
    const isProduction = process.env.NODE_ENV === 'production';
    // Handle Zod Validation Errors
    if (err instanceof zod_1.ZodError) {
        return res.status(400).json({
            error: 'VALIDATION_FAILED',
            message: 'One or more fields failed validation checks.',
            details: err.errors.map(e => ({
                field: e.path.join('.'),
                message: e.message,
            })),
        });
    }
    // Handle Mongoose cast/validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'BAD_REQUEST',
            message: err.message,
        });
    }
    if (err.name === 'CastError') {
        return res.status(400).json({
            error: 'BAD_REQUEST',
            message: `Invalid format for field: ${err.path}`,
        });
    }
    // Handle JWT errors specifically
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            error: 'INVALID_TOKEN',
            message: 'Token verification failed.',
        });
    }
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            error: 'TOKEN_EXPIRED',
            message: 'Your authentication token has expired.',
        });
    }
    // Default Centralized Error Response
    const statusCode = err.status || 500;
    res.status(statusCode).json({
        error: err.code || 'INTERNAL_SERVER_ERROR',
        message: err.message || 'An unexpected error occurred inside the gate control.',
        ...(isProduction ? {} : { stack: err.stack }),
    });
};
exports.errorHandler = errorHandler;
