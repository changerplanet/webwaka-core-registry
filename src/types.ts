/**
 * WebWaka Module Registry Types
 * Defines the core types for module manifests and registry operations
 */

/** Module classification types */
export type ModuleClass = 'core' | 'suite' | 'industry' | 'ext' | 'infra';

/** Maintainer role types */
export type MaintainerRole = 'owner' | 'maintainer' | 'contributor';

/** Capability definition */
export interface Capability {
  /** Globally unique capability identifier */
  id: string;
  /** Human-readable capability name */
  name: string;
  /** Description of what this capability provides */
  description: string;
  /** Capability API version (major.minor) */
  version?: string;
}

/** Dependency definition */
export interface Dependency {
  /** ID of the required module */
  moduleId: string;
  /** Semver version range */
  version?: string;
  /** Specific capabilities required from this dependency */
  capabilities?: string[];
  /** Whether this dependency is optional */
  optional?: boolean;
}

/** Maintainer information */
export interface Maintainer {
  /** Maintainer name */
  name: string;
  /** Maintainer email */
  email: string;
  /** Role of this maintainer */
  role?: MaintainerRole;
}

/** Repository information */
export interface Repository {
  /** Repository type */
  type: 'git';
  /** Repository URL */
  url: string;
}

/** Module metadata */
export interface ModuleMetadata {
  /** List of module maintainers */
  maintainers: Maintainer[];
  /** SPDX license identifier */
  license: string;
  /** Source repository information */
  repository?: Repository;
  /** Keywords for discovery */
  keywords?: string[];
  /** Module homepage URL */
  homepage?: string;
  /** Documentation URL */
  documentation?: string;
}

/** Complete module manifest */
export interface ModuleManifest {
  /** Unique module identifier following WebWaka naming convention */
  moduleId: string;
  /** Human-readable module name */
  name: string;
  /** Semantic version (semver 2.0.0) */
  version: string;
  /** Module classification */
  class: ModuleClass;
  /** Brief description of the module's purpose */
  description: string;
  /** List of capabilities this module provides */
  capabilities: Capability[];
  /** List of module dependencies */
  dependencies: Dependency[];
  /** Module metadata */
  metadata: ModuleMetadata;
}

/** Registered module with internal tracking */
export interface RegisteredModule extends ModuleManifest {
  /** Registration timestamp */
  registeredAt: string;
  /** Whether the module is currently active */
  active: boolean;
}

/** Tenant module state */
export interface TenantModuleState {
  /** Module ID */
  moduleId: string;
  /** Whether enabled for this tenant */
  enabled: boolean;
  /** When the module was enabled */
  enabledAt?: string;
  /** When the module was disabled */
  disabledAt?: string;
}

/** Validation result */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** List of validation errors */
  errors: ValidationError[];
}

/** Validation error */
export interface ValidationError {
  /** Error code */
  code: string;
  /** Error message */
  message: string;
  /** Path to the invalid property */
  path?: string;
  /** Additional context */
  context?: Record<string, unknown>;
}

/** Capability resolution result */
export interface CapabilityResolution {
  /** The capability ID that was resolved */
  capabilityId: string;
  /** The module providing this capability */
  moduleId: string;
  /** The capability definition */
  capability: Capability;
}

/** Module enable/disable result */
export interface ModuleOperationResult {
  /** Whether the operation succeeded */
  success: boolean;
  /** Operation type */
  operation: 'enable' | 'disable';
  /** Module ID */
  moduleId: string;
  /** Tenant ID */
  tenantId: string;
  /** Error message if failed */
  error?: string;
  /** Affected dependencies if any */
  affectedDependencies?: string[];
}
