/**
 * WebWaka Core Registry
 * Module registry and platform skeleton for WebWaka modular architecture
 */
export * from './types';
export { validateManifest, isValidModuleId, isValidSemver, isValidCapabilityId, extractModuleClass } from './validator';
export { ModuleRegistry, registry } from './registry';
