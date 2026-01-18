/**
 * WebWaka Core Registry - Type Definitions
 * 
 * Core types for the module registry and capability system.
 */

/**
 * Module classification types
 */
export type ModuleClass = 'core' | 'suite' | 'industry' | 'ext' | 'infra';

/**
 * Capability definition within a module
 */
export interface Capability {
  /** Globally unique capability ID (format: namespace:name) */
  id: string;
  /** Human-readable capability name */
  name: string;
  /** Detailed description */
  description: string;
  /** Optional version (defaults to module version) */
  version?: string;
}

/**
 * Module dependency specification
 */
export interface ModuleDependency {
  /** The moduleId of the required dependency */
  moduleId: string;
  /** Semver range for version compatibility */
  versionRange?: string;
  /** Whether this dependency is optional */
  optional?: boolean;
}

/**
 * Module metadata for documentation and discovery
 */
export interface ModuleMetadata {
  /** Human-readable module name */
  name: string;
  /** Detailed module description */
  description: string;
  /** Module author or team */
  author: string;
  /** SPDX license identifier */
  license: string;
  /** Repository URL */
  repository?: string;
  /** Project homepage URL */
  homepage?: string;
  /** Search keywords */
  keywords?: string[];
}

/**
 * Complete module manifest definition
 */
export interface ModuleManifest {
  /** Unique module identifier - MUST match repository name */
  moduleId: string;
  /** Module classification - MUST match repository prefix */
  class: ModuleClass;
  /** Semantic version */
  version: string;
  /** Capabilities provided by this module */
  capabilities: Capability[];
  /** Module dependencies */
  dependencies: ModuleDependency[];
  /** Module metadata */
  metadata: ModuleMetadata;
}

/**
 * Registered module with additional runtime state
 */
export interface RegisteredModule extends ModuleManifest {
  /** Registration timestamp */
  registeredAt: Date;
}

/**
 * Tenant-specific module enablement state
 */
export interface TenantModuleState {
  /** Tenant identifier */
  tenantId: string;
  /** Module identifier */
  moduleId: string;
  /** Whether the module is enabled for this tenant */
  enabled: boolean;
  /** When the state was last changed */
  updatedAt: Date;
}

/**
 * Validation result from manifest validation
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** List of validation errors */
  errors: ValidationError[];
}

/**
 * Individual validation error
 */
export interface ValidationError {
  /** JSON path to the error */
  path: string;
  /** Error message */
  message: string;
  /** Error code for programmatic handling */
  code: string;
}

/**
 * Capability resolution result
 */
export interface CapabilityResolution {
  /** The resolved capability */
  capability: Capability;
  /** The owning module */
  module: RegisteredModule;
}

/**
 * Storage interface for persistence abstraction
 */
export interface RegistryStorage {
  /** Store a module */
  saveModule(module: RegisteredModule): Promise<void>;
  /** Get a module by ID */
  getModule(moduleId: string): Promise<RegisteredModule | null>;
  /** Get all modules */
  getAllModules(): Promise<RegisteredModule[]>;
  /** Delete a module */
  deleteModule(moduleId: string): Promise<boolean>;
  
  /** Store tenant module state */
  saveTenantState(state: TenantModuleState): Promise<void>;
  /** Get tenant module state */
  getTenantState(tenantId: string, moduleId: string): Promise<TenantModuleState | null>;
  /** Get all states for a tenant */
  getTenantStates(tenantId: string): Promise<TenantModuleState[]>;
}
