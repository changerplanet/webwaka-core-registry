/**
 * WebWaka Core Registry - Main Registry Engine
 * 
 * Central module registry providing:
 * - Module validation and registration
 * - Capability resolution
 * - Tenant-based module enablement
 * - Dependency management
 */

import {
  ModuleManifest,
  RegisteredModule,
  ValidationResult,
  CapabilityResolution,
  TenantModuleState,
  RegistryStorage
} from './types';
import { ManifestValidator, validator as defaultValidator } from './validator';
import { CapabilityResolver, CapabilityResolutionError, capabilityResolver as defaultCapabilityResolver } from './capability-resolver';
import { TenantControl, TenantControlError } from './tenant-control';
import { InMemoryStorage } from './storage';

/**
 * Error thrown when registry operations fail
 */
export class RegistryError extends Error {
  constructor(
    message: string,
    public readonly code: 'VALIDATION_FAILED' | 'ALREADY_REGISTERED' | 'NOT_FOUND' | 'DEPENDENCY_MISSING' | 'CAPABILITY_CONFLICT' | 'CIRCULAR_DEPENDENCY'
  ) {
    super(message);
    this.name = 'RegistryError';
  }
}

/**
 * Configuration options for ModuleRegistry
 */
export interface RegistryConfig {
  /** Custom storage implementation */
  storage?: RegistryStorage;
  /** Custom validator instance */
  validator?: ManifestValidator;
  /** Custom capability resolver */
  capabilityResolver?: CapabilityResolver;
}

/**
 * ModuleRegistry - The canonical module registry for WebWaka
 * 
 * This is the single source of truth for:
 * - What modules exist
 * - What capabilities they expose
 * - What dependencies they require
 * - Whether a module can be enabled/disabled per tenant
 */
export class ModuleRegistry {
  private storage: RegistryStorage;
  private validator: ManifestValidator;
  private capabilityResolver: CapabilityResolver;
  private tenantControl: TenantControl;

  constructor(config: RegistryConfig = {}) {
    this.storage = config.storage ?? new InMemoryStorage();
    this.validator = config.validator ?? defaultValidator;
    this.capabilityResolver = config.capabilityResolver ?? new CapabilityResolver();
    
    this.tenantControl = new TenantControl(
      this.storage,
      (moduleId) => this.storage.getModule(moduleId),
      () => this.storage.getAllModules()
    );
  }

  // ============================================================
  // CORE FUNCTIONS (as specified)
  // ============================================================

  /**
   * Validate a module manifest against schema and business rules
   */
  validateManifest(manifest: unknown): ValidationResult {
    return this.validator.validate(manifest);
  }

  /**
   * Register a module in the registry
   * @throws RegistryError if validation fails, already registered, or capability conflict
   */
  async registerModule(manifest: ModuleManifest): Promise<RegisteredModule> {
    // Step 1: Validate manifest
    const validation = this.validateManifest(manifest);
    if (!validation.valid) {
      throw new RegistryError(
        `Manifest validation failed: ${validation.errors.map(e => e.message).join('; ')}`,
        'VALIDATION_FAILED'
      );
    }

    // Step 2: Check if already registered
    const existing = await this.storage.getModule(manifest.moduleId);
    if (existing) {
      throw new RegistryError(
        `Module "${manifest.moduleId}" is already registered`,
        'ALREADY_REGISTERED'
      );
    }

    // Step 3: Check for capability conflicts
    const conflicts = this.capabilityResolver.checkForDuplicates(manifest.capabilities);
    if (conflicts.length > 0) {
      throw new RegistryError(
        `Capability conflict: ${conflicts.join(', ')} already registered by another module`,
        'CAPABILITY_CONFLICT'
      );
    }

    // Step 4: Validate dependencies exist (if they reference registered modules)
    // Note: Dependencies are validated at registration time only for format,
    // actual module existence is checked at enable time
    for (const dep of manifest.dependencies) {
      if (!ManifestValidator.isValidModuleId(dep.moduleId)) {
        throw new RegistryError(
          `Invalid dependency moduleId format: ${dep.moduleId}`,
          'VALIDATION_FAILED'
        );
      }
    }

    // Step 5: Check for circular dependencies
    const circularCheck = await this.checkCircularDependencies(manifest);
    if (circularCheck.hasCircular) {
      throw new RegistryError(
        `Circular dependency detected: ${circularCheck.path.join(' -> ')}`,
        'CIRCULAR_DEPENDENCY'
      );
    }

    // Step 6: Create registered module
    const registeredModule: RegisteredModule = {
      ...manifest,
      registeredAt: new Date()
    };

    // Step 7: Register capabilities
    this.capabilityResolver.registerCapabilities(registeredModule);

    // Step 8: Persist module
    await this.storage.saveModule(registeredModule);

    return registeredModule;
  }

  /**
   * List all registered modules
   */
  async listModules(): Promise<RegisteredModule[]> {
    return this.storage.getAllModules();
  }

  /**
   * Get a module by ID
   */
  async getModule(moduleId: string): Promise<RegisteredModule | null> {
    return this.storage.getModule(moduleId);
  }

  /**
   * Resolve a capability to its owning module
   * @throws CapabilityResolutionError if not found or duplicate
   */
  resolveCapability(capabilityId: string): CapabilityResolution {
    return this.capabilityResolver.resolve(capabilityId);
  }

  // ============================================================
  // TENANT CONTROL FUNCTIONS (as specified)
  // ============================================================

  /**
   * Enable a module for a tenant
   * Enforces: Cannot enable without dependencies enabled
   */
  async enableModule(tenantId: string, moduleId: string): Promise<TenantModuleState> {
    return this.tenantControl.enableModule(tenantId, moduleId);
  }

  /**
   * Disable a module for a tenant
   * Enforces: Cannot disable if dependents exist
   */
  async disableModule(tenantId: string, moduleId: string): Promise<TenantModuleState> {
    return this.tenantControl.disableModule(tenantId, moduleId);
  }

  /**
   * Check if a module is enabled for a tenant
   */
  async isModuleEnabled(tenantId: string, moduleId: string): Promise<boolean> {
    return this.tenantControl.isEnabled(tenantId, moduleId);
  }

  /**
   * Get all enabled modules for a tenant
   */
  async getEnabledModules(tenantId: string): Promise<string[]> {
    return this.tenantControl.getEnabledModules(tenantId);
  }

  // ============================================================
  // ADDITIONAL UTILITY FUNCTIONS
  // ============================================================

  /**
   * Unregister a module (for testing/maintenance)
   */
  async unregisterModule(moduleId: string): Promise<boolean> {
    const module = await this.storage.getModule(moduleId);
    if (!module) {
      return false;
    }

    // Remove capabilities
    this.capabilityResolver.unregisterCapabilities(moduleId);

    // Remove from storage
    return this.storage.deleteModule(moduleId);
  }

  /**
   * Check for circular dependencies
   */
  private async checkCircularDependencies(
    manifest: ModuleManifest,
    visited: Set<string> = new Set(),
    path: string[] = []
  ): Promise<{ hasCircular: boolean; path: string[] }> {
    const currentPath = [...path, manifest.moduleId];

    if (visited.has(manifest.moduleId)) {
      return { hasCircular: true, path: currentPath };
    }

    visited.add(manifest.moduleId);

    for (const dep of manifest.dependencies) {
      const depModule = await this.storage.getModule(dep.moduleId);
      if (depModule) {
        const result = await this.checkCircularDependencies(depModule, new Set(visited), currentPath);
        if (result.hasCircular) {
          return result;
        }
      }
    }

    return { hasCircular: false, path: [] };
  }

  /**
   * Check if a capability is registered
   */
  hasCapability(capabilityId: string): boolean {
    return this.capabilityResolver.hasCapability(capabilityId);
  }

  /**
   * Get all registered capabilities
   */
  getAllCapabilities(): Map<string, string> {
    return this.capabilityResolver.getAllCapabilities();
  }

  /**
   * Get dependency graph for a module
   */
  async getDependencyGraph(moduleId: string): Promise<{ moduleId: string; dependencies: string[] }[]> {
    const graph: { moduleId: string; dependencies: string[] }[] = [];
    const visited = new Set<string>();

    const traverse = async (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);

      const module = await this.storage.getModule(id);
      if (!module) return;

      graph.push({
        moduleId: id,
        dependencies: module.dependencies.map(d => d.moduleId)
      });

      for (const dep of module.dependencies) {
        await traverse(dep.moduleId);
      }
    };

    await traverse(moduleId);
    return graph;
  }
}

// Export all types and utilities
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

export { ManifestValidator } from './validator';
export { CapabilityResolver, CapabilityResolutionError } from './capability-resolver';
export { TenantControl, TenantControlError } from './tenant-control';
export { InMemoryStorage } from './storage';
