/**
 * Module Registry Tests
 */

import { ModuleRegistry } from '../src/registry';
import { ModuleManifest } from '../src/types';

describe('ModuleRegistry', () => {
  let registry: ModuleRegistry;

  // Test fixtures
  const coreModule: ModuleManifest = {
    moduleId: 'webwaka-core-foundation',
    name: 'Foundation',
    version: '1.0.0',
    class: 'core',
    description: 'Core foundation module providing base capabilities',
    capabilities: [
      {
        id: 'user-auth',
        name: 'User Authentication',
        description: 'Provides user authentication and authorization',
        version: '1.0'
      },
      {
        id: 'data-store',
        name: 'Data Store',
        description: 'Provides data persistence capabilities',
        version: '1.0'
      }
    ],
    dependencies: [],
    metadata: {
      maintainers: [{ name: 'Team', email: 'team@webwaka.io' }],
      license: 'MIT'
    }
  };

  const suiteModule: ModuleManifest = {
    moduleId: 'webwaka-suite-crm',
    name: 'CRM Suite',
    version: '2.0.0',
    class: 'suite',
    description: 'Customer relationship management suite',
    capabilities: [
      {
        id: 'contact-management',
        name: 'Contact Management',
        description: 'Provides contact and lead management',
        version: '2.0'
      }
    ],
    dependencies: [
      {
        moduleId: 'webwaka-core-foundation',
        version: '^1.0.0',
        capabilities: ['user-auth', 'data-store']
      }
    ],
    metadata: {
      maintainers: [{ name: 'CRM Team', email: 'crm@webwaka.io' }],
      license: 'MIT'
    }
  };

  const extModule: ModuleManifest = {
    moduleId: 'webwaka-ext-analytics',
    name: 'Analytics Extension',
    version: '1.0.0',
    class: 'ext',
    description: 'Analytics and reporting extension',
    capabilities: [
      {
        id: 'crm-analytics',
        name: 'CRM Analytics',
        description: 'Provides analytics for CRM data',
        version: '1.0'
      }
    ],
    dependencies: [
      {
        moduleId: 'webwaka-suite-crm',
        capabilities: ['contact-management']
      }
    ],
    metadata: {
      maintainers: [{ name: 'Analytics Team', email: 'analytics@webwaka.io' }],
      license: 'MIT'
    }
  };

  beforeEach(() => {
    registry = new ModuleRegistry();
  });

  describe('registerModule', () => {
    it('should register a valid module', () => {
      const result = registry.registerModule(coreModule);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject duplicate module registration', () => {
      registry.registerModule(coreModule);
      const result = registry.registerModule(coreModule);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'MODULE_ALREADY_REGISTERED')).toBe(true);
    });

    it('should reject module with missing dependency', () => {
      const result = registry.registerModule(suiteModule);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'MISSING_DEPENDENCY')).toBe(true);
    });

    it('should accept module when dependency is registered', () => {
      registry.registerModule(coreModule);
      const result = registry.registerModule(suiteModule);
      expect(result.valid).toBe(true);
    });

    it('should reject module with missing required capability', () => {
      // Register a module without the required capability
      const minimalCore: ModuleManifest = {
        ...coreModule,
        capabilities: [] // No capabilities
      };
      registry.registerModule(minimalCore);
      
      const result = registry.registerModule(suiteModule);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'MISSING_REQUIRED_CAPABILITY')).toBe(true);
    });

    it('should reject duplicate capability across modules', () => {
      registry.registerModule(coreModule);
      
      const duplicateCap: ModuleManifest = {
        ...suiteModule,
        dependencies: [],
        capabilities: [
          {
            id: 'user-auth', // Already exists in coreModule
            name: 'User Auth Duplicate',
            description: 'Duplicate capability for testing'
          }
        ]
      };
      
      const result = registry.registerModule(duplicateCap);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'CAPABILITY_CONFLICT')).toBe(true);
    });
  });

  describe('listModules', () => {
    it('should return empty array when no modules registered', () => {
      expect(registry.listModules()).toEqual([]);
    });

    it('should return all registered modules', () => {
      registry.registerModule(coreModule);
      registry.registerModule(suiteModule);
      
      const modules = registry.listModules();
      expect(modules).toHaveLength(2);
      expect(modules.map(m => m.moduleId)).toContain('webwaka-core-foundation');
      expect(modules.map(m => m.moduleId)).toContain('webwaka-suite-crm');
    });
  });

  describe('getModule', () => {
    it('should return undefined for non-existent module', () => {
      expect(registry.getModule('non-existent')).toBeUndefined();
    });

    it('should return the registered module', () => {
      registry.registerModule(coreModule);
      const module = registry.getModule('webwaka-core-foundation');
      expect(module).toBeDefined();
      expect(module?.moduleId).toBe('webwaka-core-foundation');
      expect(module?.registeredAt).toBeDefined();
    });
  });

  describe('resolveCapability', () => {
    it('should return undefined for non-existent capability', () => {
      expect(registry.resolveCapability('non-existent')).toBeUndefined();
    });

    it('should resolve capability to correct module', () => {
      registry.registerModule(coreModule);
      
      const resolution = registry.resolveCapability('user-auth');
      expect(resolution).toBeDefined();
      expect(resolution?.moduleId).toBe('webwaka-core-foundation');
      expect(resolution?.capabilityId).toBe('user-auth');
      expect(resolution?.capability.name).toBe('User Authentication');
    });
  });

  describe('listCapabilities', () => {
    it('should return all registered capabilities', () => {
      registry.registerModule(coreModule);
      registry.registerModule(suiteModule);
      
      const capabilities = registry.listCapabilities();
      expect(capabilities).toHaveLength(3);
      expect(capabilities.map(c => c.capabilityId)).toContain('user-auth');
      expect(capabilities.map(c => c.capabilityId)).toContain('data-store');
      expect(capabilities.map(c => c.capabilityId)).toContain('contact-management');
    });
  });

  describe('getDependents', () => {
    it('should return empty array for module with no dependents', () => {
      registry.registerModule(coreModule);
      registry.registerModule(suiteModule);
      
      expect(registry.getDependents('webwaka-suite-crm')).toEqual([]);
    });

    it('should return modules that depend on a given module', () => {
      registry.registerModule(coreModule);
      registry.registerModule(suiteModule);
      
      const dependents = registry.getDependents('webwaka-core-foundation');
      expect(dependents).toContain('webwaka-suite-crm');
    });
  });

  describe('getDependencyOrder', () => {
    it('should return correct dependency order', () => {
      registry.registerModule(coreModule);
      registry.registerModule(suiteModule);
      registry.registerModule(extModule);
      
      const order = registry.getDependencyOrder('webwaka-ext-analytics');
      expect(order).toEqual([
        'webwaka-core-foundation',
        'webwaka-suite-crm',
        'webwaka-ext-analytics'
      ]);
    });

    it('should return empty array for non-existent module', () => {
      expect(registry.getDependencyOrder('non-existent')).toEqual([]);
    });
  });
});
