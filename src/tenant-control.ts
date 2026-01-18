/**
 * WebWaka Core Registry - Tenant Control
 * 
 * Manages module enablement per tenant with dependency safety enforcement.
 */

import {
  TenantModuleState,
  RegisteredModule,
  RegistryStorage
} from './types';

/**
 * Error thrown when tenant operations fail
 */
export class TenantControlError extends Error {
  constructor(
    message: string,
    public readonly code: 'DEPENDENCY_MISSING' | 'DEPENDENT_EXISTS' | 'MODULE_NOT_FOUND' | 'ALREADY_ENABLED' | 'ALREADY_DISABLED',
    public readonly details?: { moduleId: string; tenantId: string; relatedModules?: string[] }
  ) {
    super(message);
    this.name = 'TenantControlError';
  }
}

/**
 * TenantControl manages module enablement per tenant
 */
export class TenantControl {
  constructor(
    private storage: RegistryStorage,
    private getModule: (moduleId: string) => Promise<RegisteredModule | null>,
    private getAllModules: () => Promise<RegisteredModule[]>
  ) {}

  /**
   * Enable a module for a tenant
   * Enforces: Cannot enable without dependencies enabled
   */
  async enableModule(tenantId: string, moduleId: string): Promise<TenantModuleState> {
    // Check if module exists
    const module = await this.getModule(moduleId);
    if (!module) {
      throw new TenantControlError(
        `Module "${moduleId}" is not registered`,
        'MODULE_NOT_FOUND',
        { moduleId, tenantId }
      );
    }

    // Check current state
    const currentState = await this.storage.getTenantState(tenantId, moduleId);
    if (currentState?.enabled) {
      throw new TenantControlError(
        `Module "${moduleId}" is already enabled for tenant "${tenantId}"`,
        'ALREADY_ENABLED',
        { moduleId, tenantId }
      );
    }

    // Check dependencies are enabled
    const missingDeps: string[] = [];
    for (const dep of module.dependencies) {
      if (dep.optional) continue;
      
      const depState = await this.storage.getTenantState(tenantId, dep.moduleId);
      if (!depState?.enabled) {
        missingDeps.push(dep.moduleId);
      }
    }

    if (missingDeps.length > 0) {
      throw new TenantControlError(
        `Cannot enable "${moduleId}": required dependencies not enabled: ${missingDeps.join(', ')}`,
        'DEPENDENCY_MISSING',
        { moduleId, tenantId, relatedModules: missingDeps }
      );
    }

    // Enable the module
    const newState: TenantModuleState = {
      tenantId,
      moduleId,
      enabled: true,
      updatedAt: new Date()
    };
    await this.storage.saveTenantState(newState);
    return newState;
  }

  /**
   * Disable a module for a tenant
   * Enforces: Cannot disable if dependents exist (and are enabled)
   */
  async disableModule(tenantId: string, moduleId: string): Promise<TenantModuleState> {
    // Check if module exists
    const module = await this.getModule(moduleId);
    if (!module) {
      throw new TenantControlError(
        `Module "${moduleId}" is not registered`,
        'MODULE_NOT_FOUND',
        { moduleId, tenantId }
      );
    }

    // Check current state
    const currentState = await this.storage.getTenantState(tenantId, moduleId);
    if (!currentState?.enabled) {
      throw new TenantControlError(
        `Module "${moduleId}" is already disabled for tenant "${tenantId}"`,
        'ALREADY_DISABLED',
        { moduleId, tenantId }
      );
    }

    // Check for enabled dependents
    const allModules = await this.getAllModules();
    const enabledDependents: string[] = [];

    for (const otherModule of allModules) {
      if (otherModule.moduleId === moduleId) continue;
      
      // Check if this module depends on the one being disabled
      const dependsOnTarget = otherModule.dependencies.some(
        dep => dep.moduleId === moduleId && !dep.optional
      );

      if (dependsOnTarget) {
        const otherState = await this.storage.getTenantState(tenantId, otherModule.moduleId);
        if (otherState?.enabled) {
          enabledDependents.push(otherModule.moduleId);
        }
      }
    }

    if (enabledDependents.length > 0) {
      throw new TenantControlError(
        `Cannot disable "${moduleId}": enabled modules depend on it: ${enabledDependents.join(', ')}`,
        'DEPENDENT_EXISTS',
        { moduleId, tenantId, relatedModules: enabledDependents }
      );
    }

    // Disable the module
    const newState: TenantModuleState = {
      tenantId,
      moduleId,
      enabled: false,
      updatedAt: new Date()
    };
    await this.storage.saveTenantState(newState);
    return newState;
  }

  /**
   * Check if a module is enabled for a tenant
   */
  async isEnabled(tenantId: string, moduleId: string): Promise<boolean> {
    const state = await this.storage.getTenantState(tenantId, moduleId);
    return state?.enabled ?? false;
  }

  /**
   * Get all enabled modules for a tenant
   */
  async getEnabledModules(tenantId: string): Promise<string[]> {
    const states = await this.storage.getTenantStates(tenantId);
    return states.filter(s => s.enabled).map(s => s.moduleId);
  }

  /**
   * Get module state for a tenant
   */
  async getModuleState(tenantId: string, moduleId: string): Promise<TenantModuleState | null> {
    return this.storage.getTenantState(tenantId, moduleId);
  }

  /**
   * Get all module states for a tenant
   */
  async getAllModuleStates(tenantId: string): Promise<TenantModuleState[]> {
    return this.storage.getTenantStates(tenantId);
  }

  /**
   * Check if module can be enabled (validates dependencies)
   */
  async canEnable(tenantId: string, moduleId: string): Promise<{ canEnable: boolean; missingDeps: string[] }> {
    const module = await this.getModule(moduleId);
    if (!module) {
      return { canEnable: false, missingDeps: [] };
    }

    const missingDeps: string[] = [];
    for (const dep of module.dependencies) {
      if (dep.optional) continue;
      const depState = await this.storage.getTenantState(tenantId, dep.moduleId);
      if (!depState?.enabled) {
        missingDeps.push(dep.moduleId);
      }
    }

    return { canEnable: missingDeps.length === 0, missingDeps };
  }

  /**
   * Check if module can be disabled (validates no enabled dependents)
   */
  async canDisable(tenantId: string, moduleId: string): Promise<{ canDisable: boolean; enabledDependents: string[] }> {
    const module = await this.getModule(moduleId);
    if (!module) {
      return { canDisable: false, enabledDependents: [] };
    }

    const allModules = await this.getAllModules();
    const enabledDependents: string[] = [];

    for (const otherModule of allModules) {
      if (otherModule.moduleId === moduleId) continue;
      
      const dependsOnTarget = otherModule.dependencies.some(
        dep => dep.moduleId === moduleId && !dep.optional
      );

      if (dependsOnTarget) {
        const otherState = await this.storage.getTenantState(tenantId, otherModule.moduleId);
        if (otherState?.enabled) {
          enabledDependents.push(otherModule.moduleId);
        }
      }
    }

    return { canDisable: enabledDependents.length === 0, enabledDependents };
  }
}
