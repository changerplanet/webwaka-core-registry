/**
 * WebWaka Core Registry - In-Memory Storage
 * 
 * Reference implementation of RegistryStorage for development and testing.
 * Production implementations should persist to a database.
 */

import {
  RegisteredModule,
  TenantModuleState,
  RegistryStorage
} from './types';

/**
 * In-memory storage implementation
 * 
 * Provides a simple Map-based storage for modules and tenant states.
 * Suitable for testing and single-instance deployments.
 */
export class InMemoryStorage implements RegistryStorage {
  private modules: Map<string, RegisteredModule> = new Map();
  private tenantStates: Map<string, TenantModuleState> = new Map();

  /**
   * Generate composite key for tenant state lookup
   */
  private getTenantStateKey(tenantId: string, moduleId: string): string {
    return `${tenantId}:${moduleId}`;
  }

  async saveModule(module: RegisteredModule): Promise<void> {
    this.modules.set(module.moduleId, { ...module });
  }

  async getModule(moduleId: string): Promise<RegisteredModule | null> {
    const module = this.modules.get(moduleId);
    return module ? { ...module } : null;
  }

  async getAllModules(): Promise<RegisteredModule[]> {
    return Array.from(this.modules.values()).map(m => ({ ...m }));
  }

  async deleteModule(moduleId: string): Promise<boolean> {
    return this.modules.delete(moduleId);
  }

  async saveTenantState(state: TenantModuleState): Promise<void> {
    const key = this.getTenantStateKey(state.tenantId, state.moduleId);
    this.tenantStates.set(key, { ...state });
  }

  async getTenantState(tenantId: string, moduleId: string): Promise<TenantModuleState | null> {
    const key = this.getTenantStateKey(tenantId, moduleId);
    const state = this.tenantStates.get(key);
    return state ? { ...state } : null;
  }

  async getTenantStates(tenantId: string): Promise<TenantModuleState[]> {
    const states: TenantModuleState[] = [];
    for (const [key, state] of this.tenantStates.entries()) {
      if (key.startsWith(`${tenantId}:`)) {
        states.push({ ...state });
      }
    }
    return states;
  }

  /**
   * Clear all storage (useful for testing)
   */
  clear(): void {
    this.modules.clear();
    this.tenantStates.clear();
  }
}
