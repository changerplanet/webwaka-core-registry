/**
 * Tenant Module Enable/Disable Tests
 */

import { ModuleRegistry } from '../src/registry';
import { ModuleManifest } from '../src/types';

describe('Tenant Module Operations', () => {
  let registry: ModuleRegistry;
  const TENANT_ID = 'tenant-001';

  const coreModule: ModuleManifest = {
    moduleId: 'webwaka-core-base',
    name: 'Base Core',
    version: '1.0.0',
    class: 'core',
    description: 'Base core module for tenant testing',
    capabilities: [
      { id: 'base-cap', name: 'Base Capability', description: 'Base capability for testing' }
    ],
    dependencies: [],
    metadata: {
      maintainers: [{ name: 'Team', email: 'team@webwaka.io' }],
      license: 'MIT'
    }
  };

  const dependentModule: ModuleManifest = {
    moduleId: 'webwaka-suite-dependent',
    name: 'Dependent Suite',
    version: '1.0.0',
    class: 'suite',
    description: 'Suite that depends on core base',
    capabilities: [
      { id: 'dep-cap', name: 'Dependent Capability', description: 'Depends on base module' }
    ],
    dependencies: [
      { moduleId: 'webwaka-core-base' }
    ],
    metadata: {
      maintainers: [{ name: 'Team', email: 'team@webwaka.io' }],
      license: 'MIT'
    }
  };

  beforeEach(() => {
    registry = new ModuleRegistry();
    registry.registerModule(coreModule);
    registry.registerModule(dependentModule);
  });

  describe('enableModule', () => {
    it('should enable a module for a tenant', () => {
      const result = registry.enableModule(TENANT_ID, 'webwaka-core-base');
      expect(result.success).toBe(true);
      expect(result.operation).toBe('enable');
      expect(result.moduleId).toBe('webwaka-core-base');
      expect(result.tenantId).toBe(TENANT_ID);
    });

    it('should fail for non-existent module', () => {
      const result = registry.enableModule(TENANT_ID, 'non-existent');
      expect(result.success).toBe(false);
      expect(result.error).toContain('not registered');
    });

    it('should fail when dependencies are not enabled', () => {
      const result = registry.enableModule(TENANT_ID, 'webwaka-suite-dependent');
      expect(result.success).toBe(false);
      expect(result.error).toContain('dependencies are not enabled');
      expect(result.affectedDependencies).toContain('webwaka-core-base');
    });

    it('should succeed when dependencies are enabled first', () => {
      registry.enableModule(TENANT_ID, 'webwaka-core-base');
      const result = registry.enableModule(TENANT_ID, 'webwaka-suite-dependent');
      expect(result.success).toBe(true);
    });

    it('should be idempotent', () => {
      registry.enableModule(TENANT_ID, 'webwaka-core-base');
      const result = registry.enableModule(TENANT_ID, 'webwaka-core-base');
      expect(result.success).toBe(true);
    });
  });

  describe('disableModule', () => {
    beforeEach(() => {
      registry.enableModule(TENANT_ID, 'webwaka-core-base');
      registry.enableModule(TENANT_ID, 'webwaka-suite-dependent');
    });

    it('should disable a module with no dependents', () => {
      const result = registry.disableModule(TENANT_ID, 'webwaka-suite-dependent');
      expect(result.success).toBe(true);
      expect(result.operation).toBe('disable');
    });

    it('should fail when other modules depend on it', () => {
      const result = registry.disableModule(TENANT_ID, 'webwaka-core-base');
      expect(result.success).toBe(false);
      expect(result.error).toContain('other enabled modules depend on this');
      expect(result.affectedDependencies).toContain('webwaka-suite-dependent');
    });

    it('should succeed after disabling dependents', () => {
      registry.disableModule(TENANT_ID, 'webwaka-suite-dependent');
      const result = registry.disableModule(TENANT_ID, 'webwaka-core-base');
      expect(result.success).toBe(true);
    });

    it('should fail for non-existent module', () => {
      const result = registry.disableModule(TENANT_ID, 'non-existent');
      expect(result.success).toBe(false);
      expect(result.error).toContain('not registered');
    });

    it('should be idempotent', () => {
      registry.disableModule(TENANT_ID, 'webwaka-suite-dependent');
      const result = registry.disableModule(TENANT_ID, 'webwaka-suite-dependent');
      expect(result.success).toBe(true);
    });
  });

  describe('getEnabledModules', () => {
    it('should return empty array for tenant with no enabled modules', () => {
      expect(registry.getEnabledModules('new-tenant')).toEqual([]);
    });

    it('should return all enabled modules for tenant', () => {
      registry.enableModule(TENANT_ID, 'webwaka-core-base');
      registry.enableModule(TENANT_ID, 'webwaka-suite-dependent');
      
      const enabled = registry.getEnabledModules(TENANT_ID);
      expect(enabled).toHaveLength(2);
      expect(enabled).toContain('webwaka-core-base');
      expect(enabled).toContain('webwaka-suite-dependent');
    });

    it('should not include disabled modules', () => {
      registry.enableModule(TENANT_ID, 'webwaka-core-base');
      registry.enableModule(TENANT_ID, 'webwaka-suite-dependent');
      registry.disableModule(TENANT_ID, 'webwaka-suite-dependent');
      
      const enabled = registry.getEnabledModules(TENANT_ID);
      expect(enabled).toHaveLength(1);
      expect(enabled).toContain('webwaka-core-base');
    });
  });

  describe('isModuleEnabled', () => {
    it('should return false for non-enabled module', () => {
      expect(registry.isModuleEnabled(TENANT_ID, 'webwaka-core-base')).toBe(false);
    });

    it('should return true for enabled module', () => {
      registry.enableModule(TENANT_ID, 'webwaka-core-base');
      expect(registry.isModuleEnabled(TENANT_ID, 'webwaka-core-base')).toBe(true);
    });

    it('should return false after disabling', () => {
      registry.enableModule(TENANT_ID, 'webwaka-core-base');
      registry.disableModule(TENANT_ID, 'webwaka-core-base');
      expect(registry.isModuleEnabled(TENANT_ID, 'webwaka-core-base')).toBe(false);
    });
  });

  describe('getTenantModuleState', () => {
    it('should return undefined for non-existent state', () => {
      expect(registry.getTenantModuleState(TENANT_ID, 'webwaka-core-base')).toBeUndefined();
    });

    it('should return state after enable', () => {
      registry.enableModule(TENANT_ID, 'webwaka-core-base');
      const state = registry.getTenantModuleState(TENANT_ID, 'webwaka-core-base');
      expect(state).toBeDefined();
      expect(state?.enabled).toBe(true);
      expect(state?.enabledAt).toBeDefined();
    });

    it('should update state after disable', () => {
      registry.enableModule(TENANT_ID, 'webwaka-core-base');
      registry.disableModule(TENANT_ID, 'webwaka-core-base');
      const state = registry.getTenantModuleState(TENANT_ID, 'webwaka-core-base');
      expect(state).toBeDefined();
      expect(state?.enabled).toBe(false);
      expect(state?.disabledAt).toBeDefined();
    });
  });

  describe('tenant isolation', () => {
    const TENANT_2 = 'tenant-002';

    it('should maintain separate state per tenant', () => {
      registry.enableModule(TENANT_ID, 'webwaka-core-base');
      
      expect(registry.isModuleEnabled(TENANT_ID, 'webwaka-core-base')).toBe(true);
      expect(registry.isModuleEnabled(TENANT_2, 'webwaka-core-base')).toBe(false);
    });

    it('should allow same module enabled for different tenants', () => {
      registry.enableModule(TENANT_ID, 'webwaka-core-base');
      registry.enableModule(TENANT_2, 'webwaka-core-base');
      
      expect(registry.isModuleEnabled(TENANT_ID, 'webwaka-core-base')).toBe(true);
      expect(registry.isModuleEnabled(TENANT_2, 'webwaka-core-base')).toBe(true);
    });

    it('should allow disabling for one tenant without affecting others', () => {
      registry.enableModule(TENANT_ID, 'webwaka-core-base');
      registry.enableModule(TENANT_2, 'webwaka-core-base');
      registry.disableModule(TENANT_ID, 'webwaka-core-base');
      
      expect(registry.isModuleEnabled(TENANT_ID, 'webwaka-core-base')).toBe(false);
      expect(registry.isModuleEnabled(TENANT_2, 'webwaka-core-base')).toBe(true);
    });
  });
});
