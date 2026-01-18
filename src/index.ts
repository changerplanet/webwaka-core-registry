/**
 * WebWaka Core Registry
 * Module registry and platform skeleton for WebWaka modular architecture
 */

// Export all types
export * from './types';

// Export validator functions
export {
  validateManifest,
  isValidModuleId,
  isValidSemver,
  isValidCapabilityId,
  extractModuleClass
} from './validator';

// Export registry
export { ModuleRegistry, registry } from './registry';
