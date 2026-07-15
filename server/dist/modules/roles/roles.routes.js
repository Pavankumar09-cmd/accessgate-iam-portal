"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const roles_controller_1 = require("./roles.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const permissions_middleware_1 = require("../../middleware/permissions.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.get('/', roles_controller_1.getRoles); // Allow authenticated users to list roles (e.g. for User Management select fields)
router.get('/:id', roles_controller_1.getRoleById);
router.post('/', (0, permissions_middleware_1.requirePermission)('roles:manage'), roles_controller_1.createRole);
router.put('/:id', (0, permissions_middleware_1.requirePermission)('roles:manage'), roles_controller_1.updateRole);
router.delete('/:id', (0, permissions_middleware_1.requirePermission)('roles:manage'), roles_controller_1.deleteRole);
exports.default = router;
