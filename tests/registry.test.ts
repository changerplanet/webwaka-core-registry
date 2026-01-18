/**
 * WebWaka Core Registry - Comprehensive Test Suite
 * 
 * Tests all requirements from Phase 2 - Step 01:
 * - Invalid manifests are rejected
 * - Valid manifests are registered
 * - Duplicate capabilities are rejected
 * - Dependency enforcement works
 * - Tenant enable/disable rules are enforced
 * - Hello module demonstration
 */

import {
  ModuleRegistry,
  RegistryError,
  ModuleManifest,
  CapabilityResolutionError,
  TenantControlError
} from '../src';

describe('WebWaka Core Registry', () => {
  let registry: ModuleRegistry;

  beforeEach(() => {
    registry = new ModuleRegistry();
  });

  // ============================================================
  // MANIFEST VALIDATION TESTS
  // ============================================================

  describe('Manifest Validation', () => {
    it('should reject manifest missing required fields', () => {
      const invalidManifest = {
        moduleId: 'webwaka-core-test'
        // Missing: class, version, capabilities, dependencies, metadata
      };

      const result = registry.validateManifest(invalidManifest);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject manifest with invalid moduleId format', () => {
      const invalidManifest: ModuleManifest = {
        moduleId: 'invalid-module-name', // Missing webwaka- prefix
        class: 'core',
        version: '1.0.0',
        capabilities: [],
        dependencies: [],
        metadata: {
          name: 'Test Module',
          description: 'A test module',
          author: 'Test',
          license: 'MIT'
        }
      };

      const result = registry.validateManifest(invalidManifest);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.path.includes('moduleId'))).toBe(true);
    });

    it('should reject manifest with class/prefix mismatch', () => {
      const invalidManifest: ModuleManifest = {
        moduleId: 'webwaka-suite-test', // Prefix says 'suite'
        class: 'core', // But class says 'core'
        version: '1.0.0',
        capabilities: [],
        dependencies: [],
        metadata: {
          name: 'Test Module',
          description: 'A test module',
          author: 'Test',
          license: 'MIT'
        }
      };

      const result = registry.validateManifest(invalidManifest);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'CLASS_PREFIX_MISMATCH')).toBe(true);
    });

    it('should reject manifest with invalid semver', () => {
      const invalidManifest: ModuleManifest = {
        moduleId: 'webwaka-core-test',
        class: 'core',
        version: 'not-a-version',
        capabilities: [],
        dependencies: [],
        metadata: {
          name: 'Test Module',
          description: 'A test module',
          author: 'Test',
          license: 'MIT'
        }
      };

      const result = registry.validateManifest(invalidManifest);
      expect(result.valid).toBe(false);
    });

    it('should reject manifest with invalid capability ID format', () => {
      const invalidManifest: ModuleManifest = {
        moduleId: 'webwaka-core-test',
        class: 'core',
        version: '1.0.0',
        capabilities: [{
          id: 'InvalidCapabilityFormat', // Should be namespace:name
          name: 'Test Capability',
          description: 'A test capability'
        }],
        dependencies: [],
        metadata: {
          name: 'Test Module',
          description: 'A test module',
          author: 'Test',
          license: 'MIT'
        }
      };

      const result = registry.validateManifest(invalidManifest);
      expect(result.valid).toBe(false);
    });

    it('should accept valid manifest', () => {
      const validManifest: ModuleManifest = {
        moduleId: 'webwaka-core-test',
        class: 'core',
        version: '1.0.0',
        capabilities: [{
          id: 'test:capability',
          name: 'Test Capability',
          description: 'A test capability'
        }],
        dependencies: [],
        metadata: {
          name: 'Test Module',
          description: 'A test module',
          author: 'Test',
          license: 'MIT'
        }
      };

      const result = registry.validateManifest(validManifest);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject manifest with self-dependency', () => {
      const invalidManifest: ModuleManifest = {
        moduleId: 'webwaka-core-test',
        class: 'core',
        version: '1.0.0',
        capabilities: [],
        dependencies: [{
          moduleId: 'webwaka-core-test' // Self-reference
        }],
        metadata: {
          name: 'Test Module',
          description: 'A test module',
          author: 'Test',
          license: 'MIT'
        }
      };

      const result = registry.validateManifest(invalidManifest);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'SELF_DEPENDENCY')).toBe(true);
    });

    it('should reject manifest with duplicate capabilities', () => {
      const invalidManifest: ModuleManifest = {
        moduleId: 'webwaka-core-test',
        class: 'core',
        version: '1.0.0',
        capabilities: [
          { id: 'test:cap', name: 'Cap 1', description: 'First' },
          { id: 'test:cap', name: 'Cap 2', description: 'Duplicate' }
        ],
        dependencies: [],
        metadata: {
          name: 'Test Module',
          description: 'A test module',
          author: 'Test',
          license: 'MIT'
        }
      };

      const result = registry.validateManifest(invalidManifest);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'DUPLICATE_CAPABILITY')).toBe(true);
    });
  });

  // ============================================================
  // MODULE REGISTRATION TESTS
  // ============================================================

  describe('Module Registration', () => {
    const validModule: ModuleManifest = {
      moduleId: 'webwaka-core-test',
      class: 'core',
      version: '1.0.0',
      capabilities: [{
        id: 'test:feature',
        name: 'Test Feature',
        description: 'A test feature'
      }],
      dependencies: [],
      metadata: {
        name: 'Test Module',
        description: 'A test module',
        author: 'Test Team',
        license: 'MIT'
      }
    };

    it('should register a valid module', async () => {
      const registered = await registry.registerModule(validModule);

      expect(registered.moduleId).toBe(validModule.moduleId);
      expect(registered.registeredAt).toBeInstanceOf(Date);

      const retrieved = await registry.getModule(validModule.moduleId);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.moduleId).toBe(validModule.moduleId);
    });

    it('should list registered modules', async () => {
      await registry.registerModule(validModule);

      const modules = await registry.listModules();
      expect(modules).toHaveLength(1);
      expect(modules[0].moduleId).toBe(validModule.moduleId);
    });

    it('should reject duplicate module registration', async () => {
      await registry.registerModule(validModule);

      await expect(registry.registerModule(validModule))
        .rejects.toThrow(RegistryError);
    });

    it('should reject invalid manifest during registration', async () => {
      const invalidModule = {
        moduleId: 'invalid',
        class: 'core'
      } as ModuleManifest;

      await expect(registry.registerModule(invalidModule))
        .rejects.toThrow(RegistryError);
    });
  });

  // ============================================================
  // CAPABILITY RESOLUTION TESTS
  // ============================================================

  describe('Capability Resolution', () => {
    it('should resolve registered capability to owning module', async () => {
      const module: ModuleManifest = {
        moduleId: 'webwaka-core-auth',
        class: 'core',
        version: '1.0.0',
        capabilities: [{
          id: 'auth:login',
          name: 'Login',
          description: 'User login capability'
        }],
        dependencies: [],
        metadata: {
          name: 'Auth Module',
          description: 'Authentication module',
          author: 'Test',
          license: 'MIT'
        }
      };

      await registry.registerModule(module);

      const resolution = registry.resolveCapability('auth:login');
      expect(resolution.capability.id).toBe('auth:login');
      expect(resolution.module.moduleId).toBe('webwaka-core-auth');
    });

    it('should fail on unregistered capability', async () => {
      expect(() => registry.resolveCapability('unknown:capability'))
        .toThrow(CapabilityResolutionError);
    });

    it('should fail on invalid capability format', async () => {
      expect(() => registry.resolveCapability('InvalidFormat'))
        .toThrow(CapabilityResolutionError);
    });

    it('should reject duplicate capabilities across modules', async () => {
      const module1: ModuleManifest = {
        moduleId: 'webwaka-core-first',
        class: 'core',
        version: '1.0.0',
        capabilities: [{
          id: 'shared:feature',
          name: 'Shared Feature',
          description: 'A shared feature'
        }],
        dependencies: [],
        metadata: { name: 'First', description: 'First module', author: 'Test', license: 'MIT' }
      };

      const module2: ModuleManifest = {
        moduleId: 'webwaka-core-second',
        class: 'core',
        version: '1.0.0',
        capabilities: [{
          id: 'shared:feature', // Duplicate!
          name: 'Shared Feature',
          description: 'Same capability ID'
        }],
        dependencies: [],
        metadata: { name: 'Second', description: 'Second module', author: 'Test', license: 'MIT' }
      };

      await registry.registerModule(module1);

      await expect(registry.registerModule(module2))
        .rejects.toThrow(RegistryError);
    });
  });

  // ============================================================
  // DEPENDENCY ENFORCEMENT TESTS
  // ============================================================

  describe('Dependency Enforcement', () => {
    const baseModule: ModuleManifest = {
      moduleId: 'webwaka-core-base',
      class: 'core',
      version: '1.0.0',
      capabilities: [{ id: 'base:core', name: 'Base', description: 'Base functionality' }],
      dependencies: [],
      metadata: { name: 'Base', description: 'Base module', author: 'Test', license: 'MIT' }
    };

    const dependentModule: ModuleManifest = {
      moduleId: 'webwaka-suite-dependent',
      class: 'suite',
      version: '1.0.0',
      capabilities: [{ id: 'dep:feature', name: 'Feature', description: 'Dependent feature' }],
      dependencies: [{ moduleId: 'webwaka-core-base' }],
      metadata: { name: 'Dependent', description: 'Dependent module', author: 'Test', license: 'MIT' }
    };

    it('should allow registration of module with unregistered dependencies', async () => {
      // Dependencies are checked at enable time, not registration
      await registry.registerModule(dependentModule);
      const registered = await registry.getModule('webwaka-suite-dependent');
      expect(registered).not.toBeNull();
    });

    it('should prevent enabling module without enabled dependencies', async () => {
      await registry.registerModule(baseModule);
      await registry.registerModule(dependentModule);

      // Try to enable dependent without enabling base first
      await expect(registry.enableModule('tenant-1', 'webwaka-suite-dependent'))
        .rejects.toThrow(TenantControlError);
    });

    it('should allow enabling when dependencies are satisfied', async () => {
      await registry.registerModule(baseModule);
      await registry.registerModule(dependentModule);

      // Enable base first
      await registry.enableModule('tenant-1', 'webwaka-core-base');

      // Now enable dependent
      const state = await registry.enableModule('tenant-1', 'webwaka-suite-dependent');
      expect(state.enabled).toBe(true);
    });
  });

  // ============================================================
  // TENANT ENABLE/DISABLE TESTS
  // ============================================================

  describe('Tenant Enable/Disable', () => {
    const moduleA: ModuleManifest = {
      moduleId: 'webwaka-core-a',
      class: 'core',
      version: '1.0.0',
      capabilities: [{ id: 'a:feature', name: 'A Feature', description: 'Feature A' }],
      dependencies: [],
      metadata: { name: 'Module A', description: 'Module A', author: 'Test', license: 'MIT' }
    };

    const moduleB: ModuleManifest = {
      moduleId: 'webwaka-core-b',
      class: 'core',
      version: '1.0.0',
      capabilities: [{ id: 'b:feature', name: 'B Feature', description: 'Feature B' }],
      dependencies: [{ moduleId: 'webwaka-core-a' }], // B depends on A
      metadata: { name: 'Module B', description: 'Module B', author: 'Test', license: 'MIT' }
    };

    beforeEach(async () => {
      await registry.registerModule(moduleA);
      await registry.registerModule(moduleB);
    });

    it('should enable module for tenant', async () => {
      const state = await registry.enableModule('tenant-1', 'webwaka-core-a');

      expect(state.tenantId).toBe('tenant-1');
      expect(state.moduleId).toBe('webwaka-core-a');
      expect(state.enabled).toBe(true);
    });

    it('should prevent double enable', async () => {
      await registry.enableModule('tenant-1', 'webwaka-core-a');

      await expect(registry.enableModule('tenant-1', 'webwaka-core-a'))
        .rejects.toThrow(TenantControlError);
    });

    it('should disable module for tenant', async () => {
      await registry.enableModule('tenant-1', 'webwaka-core-a');
      const state = await registry.disableModule('tenant-1', 'webwaka-core-a');

      expect(state.enabled).toBe(false);
    });

    it('should prevent disabling when dependents are enabled', async () => {
      // Enable both A and B
      await registry.enableModule('tenant-1', 'webwaka-core-a');
      await registry.enableModule('tenant-1', 'webwaka-core-b');

      // Try to disable A (B depends on it)
      await expect(registry.disableModule('tenant-1', 'webwaka-core-a'))
        .rejects.toThrow(TenantControlError);
    });

    it('should allow disabling after dependents are disabled', async () => {
      // Enable both
      await registry.enableModule('tenant-1', 'webwaka-core-a');
      await registry.enableModule('tenant-1', 'webwaka-core-b');

      // Disable B first
      await registry.disableModule('tenant-1', 'webwaka-core-b');

      // Now disable A
      const state = await registry.disableModule('tenant-1', 'webwaka-core-a');
      expect(state.enabled).toBe(false);
    });

    it('should isolate tenant states', async () => {
      await registry.enableModule('tenant-1', 'webwaka-core-a');

      // Different tenant should not be affected
      const enabled = await registry.isModuleEnabled('tenant-2', 'webwaka-core-a');
      expect(enabled).toBe(false);
    });

    it('should list enabled modules for tenant', async () => {
      await registry.enableModule('tenant-1', 'webwaka-core-a');
      await registry.enableModule('tenant-1', 'webwaka-core-b');

      const enabled = await registry.getEnabledModules('tenant-1');
      expect(enabled).toContain('webwaka-core-a');
      expect(enabled).toContain('webwaka-core-b');
    });
  });

  // ============================================================
  // HARD STOP CONDITION: HELLO MODULE DEMONSTRATION
  // ============================================================

  describe('Hello Module Demonstration (HARD STOP CONDITION)', () => {
    const helloModule: ModuleManifest = {
      moduleId: 'webwaka-ext-hello',
      class: 'ext',
      version: '1.0.0',
      capabilities: [{
        id: 'hello:greet',
        name: 'Greet',
        description: 'Provides greeting functionality'
      }],
      dependencies: [],
      metadata: {
        name: 'Hello Module',
        description: 'A simple hello world module for demonstration',
        author: 'WebWaka Team',
        license: 'MIT'
      }
    };

    it('STEP 1: Hello module can be VALIDATED', () => {
      const result = registry.validateManifest(helloModule);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      console.log('✓ Hello module VALIDATED successfully');
    });

    it('STEP 2: Hello module can be REGISTERED', async () => {
      const registered = await registry.registerModule(helloModule);

      expect(registered.moduleId).toBe('webwaka-ext-hello');
      expect(registered.registeredAt).toBeInstanceOf(Date);

      const retrieved = await registry.getModule('webwaka-ext-hello');
      expect(retrieved).not.toBeNull();
      console.log('✓ Hello module REGISTERED successfully');
    });

    it('STEP 3: Hello module can be ENABLED for a tenant', async () => {
      await registry.registerModule(helloModule);

      const state = await registry.enableModule('demo-tenant', 'webwaka-ext-hello');

      expect(state.tenantId).toBe('demo-tenant');
      expect(state.moduleId).toBe('webwaka-ext-hello');
      expect(state.enabled).toBe(true);

      const isEnabled = await registry.isModuleEnabled('demo-tenant', 'webwaka-ext-hello');
      expect(isEnabled).toBe(true);
      console.log('✓ Hello module ENABLED for tenant successfully');
    });

    it('STEP 4: Hello module can be DISABLED safely', async () => {
      await registry.registerModule(helloModule);
      await registry.enableModule('demo-tenant', 'webwaka-ext-hello');

      const state = await registry.disableModule('demo-tenant', 'webwaka-ext-hello');

      expect(state.enabled).toBe(false);

      const isEnabled = await registry.isModuleEnabled('demo-tenant', 'webwaka-ext-hello');
      expect(isEnabled).toBe(false);
      console.log('✓ Hello module DISABLED safely');
    });

    it('COMPLETE: Hello module full lifecycle demonstration', async () => {
      // 1. Validate
      const validation = registry.validateManifest(helloModule);
      expect(validation.valid).toBe(true);

      // 2. Register
      const registered = await registry.registerModule(helloModule);
      expect(registered.moduleId).toBe('webwaka-ext-hello');

      // 3. Enable
      const enableState = await registry.enableModule('lifecycle-tenant', 'webwaka-ext-hello');
      expect(enableState.enabled).toBe(true);

      // Verify capability is resolvable
      const capability = registry.resolveCapability('hello:greet');
      expect(capability.module.moduleId).toBe('webwaka-ext-hello');

      // 4. Disable
      const disableState = await registry.disableModule('lifecycle-tenant', 'webwaka-ext-hello');
      expect(disableState.enabled).toBe(false);

      console.log('');
      console.log('========================================');
      console.log('HARD STOP CONDITION SATISFIED');
      console.log('Hello module lifecycle complete:');
      console.log('  ✓ Validated');
      console.log('  ✓ Registered');
      console.log('  ✓ Enabled for tenant');
      console.log('  ✓ Disabled safely');
      console.log('========================================');
    });
  });

  // ============================================================
  // ADDITIONAL EDGE CASES
  // ============================================================

  describe('Edge Cases', () => {
    it('should handle optional dependencies', async () => {
      const moduleWithOptionalDep: ModuleManifest = {
        moduleId: 'webwaka-core-optional',
        class: 'core',
        version: '1.0.0',
        capabilities: [],
        dependencies: [{
          moduleId: 'webwaka-core-nonexistent',
          optional: true
        }],
        metadata: { name: 'Optional', description: 'Has optional dep', author: 'Test', license: 'MIT' }
      };

      await registry.registerModule(moduleWithOptionalDep);

      // Should be able to enable even without optional dependency
      const state = await registry.enableModule('tenant-1', 'webwaka-core-optional');
      expect(state.enabled).toBe(true);
    });

    it('should handle module unregistration', async () => {
      const module: ModuleManifest = {
        moduleId: 'webwaka-core-removable',
        class: 'core',
        version: '1.0.0',
        capabilities: [{ id: 'remove:cap', name: 'Removable', description: 'Will be removed' }],
        dependencies: [],
        metadata: { name: 'Removable', description: 'Removable module', author: 'Test', license: 'MIT' }
      };

      await registry.registerModule(module);
      expect(registry.hasCapability('remove:cap')).toBe(true);

      await registry.unregisterModule('webwaka-core-removable');

      const retrieved = await registry.getModule('webwaka-core-removable');
      expect(retrieved).toBeNull();
      expect(registry.hasCapability('remove:cap')).toBe(false);
    });

    it('should support all module classes', async () => {
      const classes = ['core', 'suite', 'industry', 'ext', 'infra'] as const;

      for (const cls of classes) {
        const module: ModuleManifest = {
          moduleId: `webwaka-${cls}-test`,
          class: cls,
          version: '1.0.0',
          capabilities: [],
          dependencies: [],
          metadata: { name: `${cls} test`, description: `Testing ${cls}`, author: 'Test', license: 'MIT' }
        };

        const validation = registry.validateManifest(module);
        expect(validation.valid).toBe(true);
      }
    });
  });
});
