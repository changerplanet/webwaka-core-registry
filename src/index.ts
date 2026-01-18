/**
 * WebWaka Core Registry
 * 
 * Public API exports for the module registry system.
 */

// Main registry class
export { ModuleRegistry, RegistryError, RegistryConfig } from './registry';

// Core types
export {
  ModuleManifest,
  RegisteredModule,
  ValidationResult,
  ValidationError,
  CapabilityResolution,
  TenantModuleState,
  Capability,
  ModuleDependency,
  ModuleMetadata,
  ModuleClass,
  RegistryStorage
} from './types';

// Validation
export { ManifestValidator } from './validator';

// Capability resolution
export { CapabilityResolver, CapabilityResolutionError } from './capability-resolver';

// Tenant control
export { TenantControl, TenantControlError } from './tenant-control';

// Storage implementations
export { InMemoryStorage } from './storage';
