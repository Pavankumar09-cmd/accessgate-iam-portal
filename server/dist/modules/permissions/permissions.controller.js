"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPermissions = void 0;
const Permission_1 = __importDefault(require("../../models/Permission"));
const getPermissions = async (req, res, next) => {
    try {
        const permissions = await Permission_1.default.find().sort({ category: 1, key: 1 });
        res.status(200).json(permissions);
    }
    catch (error) {
        next(error);
    }
};
exports.getPermissions = getPermissions;
