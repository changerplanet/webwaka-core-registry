/**
 * Hello Module Lifecycle Test
 * 
 * HARD STOP CONDITION TEST:
 * A fake "hello module" must be validated, registered, enabled for a tenant, 
 * and disabled safely without breaking dependency rules.
 */

import { ModuleRegistry } from '../src/registry';
import { ModuleManifest } from '../src/types';

describe('Hello Module Lifecycle', () => {
  let registry: ModuleRegistry;
  const TENANT_ID = 'hello-tenant';

  // The canonical "Hello Module" for testing
  const helloModule: ModuleManifest = {
    moduleId: 'webwaka-core-hello',
    name: 'Hello Module',
    version: '1.0.0',
    class: 'core',
    description: 'A test hello module for lifecycle validation',
    capabilities: [
      {
        id: 'hello-greeting',
        name: 'Greeting Service',
        description: 'Provides greeting functionality for all users',
        version: '1.0'
      },
      {
        id: 'hello-farewell',
        name: 'Farewell Service',
        description: 'Provides farewell functionality for all users',
        version: '1.0'
      }
    ],
    dependencies: [],
    metadata: {
      maintainers: [
        {
          name: 'Hello Team',
          email: 'hello@webwaka.io',
          role: 'owner'
        }
      ],
      license: 'MIT',
      repository: {
        type: 'git',
        url: 'https://github.com/webwaka/hello-module'
      },
      keywords: ['hello', 'greeting', 'test']
    }
  };

  // A module that depends on hello
  const dependentOnHello: ModuleManifest = {
    moduleId: 'webwaka-ext-hello-fancy',
    name: 'Fancy Hello Extension',
    version: '1.0.0',
    class: 'ext',
    description: 'Fancy extension that enhances hello greetings',
    capabilities: [
      {
        id: 'fancy-greeting',
        name: 'Fancy Greeting',
        description: 'Provides fancy greeting animations'
      }
    ],
    dependencies: [
      {
        moduleId: 'webwaka-core-hello',
        capabilities: ['hello-greeting']
      }
    ],
    metadata: {
      maintainers: [{ name: 'Fancy Team', email: 'fancy@webwaka.io' }],
      license: 'MIT'
    }
  };

  beforeEach(() => {
    registry = new ModuleRegistry();
  });

  describe('HARD STOP CONDITION: Hello Module Full Lifecycle', () => {
    it('should complete full lifecycle: validate → register → enable → disable', () => {
      console.log('\n🧪 HELLO MODULE LIFECYCLE TEST\n');

      // STEP 1: VALIDATE
      console.log('Step 1: Validating Hello Module...');
      const validation = registry.validateManifest(helloModule);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      console.log('✅ Validation passed\n');

      // STEP 2: REGISTER
      console.log('Step 2: Registering Hello Module...');
      const registration = registry.registerModule(helloModule);
      expect(registration.valid).toBe(true);
      expect(registration.errors).toHaveLength(0);
      
      const registeredModule = registry.getModule('webwaka-core-hello');
      expect(registeredModule).toBeDefined();
      expect(registeredModule?.moduleId).toBe('webwaka-core-hello');
      expect(registeredModule?.registeredAt).toBeDefined();
      console.log('✅ Registration successful\n');

      // Verify capabilities are indexed
      const greetingCap = registry.resolveCapability('hello-greeting');
      expect(greetingCap).toBeDefined();
      expect(greetingCap?.moduleId).toBe('webwaka-core-hello');
      console.log('✅ Capabilities indexed correctly\n');

      // STEP 3: ENABLE FOR TENANT
      console.log('Step 3: Enabling Hello Module for tenant...');
      const enableResult = registry.enableModule(TENANT_ID, 'webwaka-core-hello');
      expect(enableResult.success).toBe(true);
      expect(enableResult.operation).toBe('enable');
      expect(registry.isModuleEnabled(TENANT_ID, 'webwaka-core-hello')).toBe(true);
      console.log('✅ Module enabled for tenant\n');

      // STEP 4: DISABLE SAFELY
      console.log('Step 4: Disabling Hello Module safely...');
      const disableResult = registry.disableModule(TENANT_ID, 'webwaka-core-hello');
      expect(disableResult.success).toBe(true);
      expect(disableResult.operation).toBe('disable');
      expect(registry.isModuleEnabled(TENANT_ID, 'webwaka-core-hello')).toBe(false);
      console.log('✅ Module disabled safely\n');

      console.log('🎉 HELLO MODULE LIFECYCLE TEST COMPLETE!\n');
    });

    it('should prevent disable when dependent modules are enabled', () => {
      console.log('\n🧪 DEPENDENCY PROTECTION TEST\n');

      // Register both modules
      registry.registerModule(helloModule);
      registry.registerModule(dependentOnHello);

      // Enable hello module
      registry.enableModule(TENANT_ID, 'webwaka-core-hello');
      expect(registry.isModuleEnabled(TENANT_ID, 'webwaka-core-hello')).toBe(true);

      // Enable dependent module
      registry.enableModule(TENANT_ID, 'webwaka-ext-hello-fancy');
      expect(registry.isModuleEnabled(TENANT_ID, 'webwaka-ext-hello-fancy')).toBe(true);

      // Try to disable hello module - should FAIL
      console.log('Attempting to disable hello module with dependent enabled...');
      const disableResult = registry.disableModule(TENANT_ID, 'webwaka-core-hello');
      expect(disableResult.success).toBe(false);
      expect(disableResult.error).toContain('other enabled modules depend on this');
      expect(disableResult.affectedDependencies).toContain('webwaka-ext-hello-fancy');
      console.log('✅ Correctly prevented disable - dependency rules enforced\n');

      // Now disable dependent first, then hello
      console.log('Disabling dependent first, then hello...');
      const disableDependent = registry.disableModule(TENANT_ID, 'webwaka-ext-hello-fancy');
      expect(disableDependent.success).toBe(true);

      const disableHello = registry.disableModule(TENANT_ID, 'webwaka-core-hello');
      expect(disableHello.success).toBe(true);
      console.log('✅ Proper disable order succeeded\n');

      console.log('🎉 DEPENDENCY PROTECTION TEST COMPLETE!\n');
    });

    it('should ensure capabilities are globally unique', () => {
      console.log('\n🧪 CAPABILITY UNIQUENESS TEST\n');

      // Register hello module
      registry.registerModule(helloModule);

      // Try to register another module with same capability
      const duplicateCapModule: ModuleManifest = {
        moduleId: 'webwaka-core-duplicate',
        name: 'Duplicate Capability Module',
        version: '1.0.0',
        class: 'core',
        description: 'Module trying to register duplicate capability',
        capabilities: [
          {
            id: 'hello-greeting', // Same as hello module!
            name: 'Duplicate Greeting',
            description: 'This should fail due to duplicate'
          }
        ],
        dependencies: [],
        metadata: {
          maintainers: [{ name: 'Team', email: 'team@test.io' }],
          license: 'MIT'
        }
      };

      const result = registry.registerModule(duplicateCapModule);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'CAPABILITY_CONFLICT')).toBe(true);
      console.log('✅ Duplicate capability correctly rejected\n');

      console.log('🎉 CAPABILITY UNIQUENESS TEST COMPLETE!\n');
    });

    it('should enforce dependency order during registration', () => {
      console.log('\n🧪 DEPENDENCY ORDER TEST\n');

      // Try to register dependent before hello
      console.log('Attempting to register dependent before its dependency...');
      const result = registry.registerModule(dependentOnHello);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'MISSING_DEPENDENCY')).toBe(true);
      console.log('✅ Correctly rejected - dependency not registered\n');

      // Now register in correct order
      console.log('Registering in correct order...');
      const helloResult = registry.registerModule(helloModule);
      expect(helloResult.valid).toBe(true);

      const depResult = registry.registerModule(dependentOnHello);
      expect(depResult.valid).toBe(true);
      console.log('✅ Correct order succeeded\n');

      console.log('🎉 DEPENDENCY ORDER TEST COMPLETE!\n');
    });

    it('should maintain tenant isolation', () => {
      console.log('\n🧪 TENANT ISOLATION TEST\n');

      registry.registerModule(helloModule);

      const TENANT_A = 'tenant-alpha';
      const TENANT_B = 'tenant-beta';

      // Enable for tenant A
      registry.enableModule(TENANT_A, 'webwaka-core-hello');
      expect(registry.isModuleEnabled(TENANT_A, 'webwaka-core-hello')).toBe(true);
      expect(registry.isModuleEnabled(TENANT_B, 'webwaka-core-hello')).toBe(false);
      console.log('✅ Tenant A enabled, Tenant B unaffected\n');

      // Enable for tenant B
      registry.enableModule(TENANT_B, 'webwaka-core-hello');
      expect(registry.isModuleEnabled(TENANT_A, 'webwaka-core-hello')).toBe(true);
      expect(registry.isModuleEnabled(TENANT_B, 'webwaka-core-hello')).toBe(true);
      console.log('✅ Both tenants enabled independently\n');

      // Disable for tenant A, B should remain
      registry.disableModule(TENANT_A, 'webwaka-core-hello');
      expect(registry.isModuleEnabled(TENANT_A, 'webwaka-core-hello')).toBe(false);
      expect(registry.isModuleEnabled(TENANT_B, 'webwaka-core-hello')).toBe(true);
      console.log('✅ Tenant A disabled, Tenant B unaffected\n');

      console.log('🎉 TENANT ISOLATION TEST COMPLETE!\n');
    });
  });
});
