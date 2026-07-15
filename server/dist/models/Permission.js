"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const PermissionSchema = new mongoose_1.Schema({
    key: { type: String, required: true, unique: true, index: true },
    description: { type: String, required: true },
    category: { type: String, required: true, index: true },
});
exports.default = (0, mongoose_1.model)('Permission', PermissionSchema);
