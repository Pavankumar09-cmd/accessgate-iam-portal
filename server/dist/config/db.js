"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/accessgate';
        const conn = await mongoose_1.default.connect(mongoUri);
        console.log(`[DATABASE] Connected to MongoDB: ${conn.connection.host}`);
        return conn;
    }
    catch (error) {
        console.error('[DATABASE] Connection failed:', error);
        process.exit(1);
    }
};
exports.connectDB = connectDB;
