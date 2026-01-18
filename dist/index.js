"use strict";
/**
 * WebWaka Core Registry
 * Module registry and platform skeleton for WebWaka modular architecture
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registry = exports.ModuleRegistry = exports.extractModuleClass = exports.isValidCapabilityId = exports.isValidSemver = exports.isValidModuleId = exports.validateManifest = void 0;
// Export all types
__exportStar(require("./types"), exports);
// Export validator functions
var validator_1 = require("./validator");
Object.defineProperty(exports, "validateManifest", { enumerable: true, get: function () { return validator_1.validateManifest; } });
Object.defineProperty(exports, "isValidModuleId", { enumerable: true, get: function () { return validator_1.isValidModuleId; } });
Object.defineProperty(exports, "isValidSemver", { enumerable: true, get: function () { return validator_1.isValidSemver; } });
Object.defineProperty(exports, "isValidCapabilityId", { enumerable: true, get: function () { return validator_1.isValidCapabilityId; } });
Object.defineProperty(exports, "extractModuleClass", { enumerable: true, get: function () { return validator_1.extractModuleClass; } });
// Export registry
var registry_1 = require("./registry");
Object.defineProperty(exports, "ModuleRegistry", { enumerable: true, get: function () { return registry_1.ModuleRegistry; } });
Object.defineProperty(exports, "registry", { enumerable: true, get: function () { return registry_1.registry; } });
