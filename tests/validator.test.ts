/**
 * Module Manifest Validation Tests
 */

import { validateManifest, isValidModuleId, isValidSemver, isValidCapabilityId, extractModuleClass } from '../src/validator';
import { ModuleManifest } from '../src/types';

describe('Module Manifest Validation', () => {
  const validManifest: ModuleManifest = {
    moduleId: 'webwaka-core-hello',
    name: 'Hello Module',
    version: '1.0.0',
    class: 'core',
    description: 'A test hello module for validation testing',
    capabilities: [
      {
        id: 'hello-world',
        name: 'Hello World',
        description: 'Provides hello world functionality',
        version: '1.0'
      }
    ],
    dependencies: [],
    metadata: {
      maintainers: [
        {
          name: 'Test Maintainer',
          email: 'test@example.com',
          role: 'owner'
        }
      ],
      license: 'MIT'
    }
  };

  describe('validateManifest', () => {
    it('should validate a correct manifest', () => {
      const result = validateManifest(validManifest);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject manifest with invalid moduleId pattern', () => {
      const invalid = { ...validManifest, moduleId: 'invalid-module-id' };
      const result = validateManifest(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'SCHEMA_VALIDATION_ERROR')).toBe(true);
    });

    it('should reject manifest with class mismatch', () => {
      const invalid = { ...validManifest, moduleId: 'webwaka-suite-hello', class: 'core' as const };
      const result = validateManifest(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'MODULE_CLASS_MISMATCH')).toBe(true);
    });

    it('should reject manifest with invalid semver', () => {
      const invalid = { ...validManifest, version: 'v1.0' };
      const result = validateManifest(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'SCHEMA_VALIDATION_ERROR')).toBe(true);
    });

    it('should reject manifest with duplicate capability IDs', () => {
      const invalid = {
        ...validManifest,
        capabilities: [
          { id: 'duplicate-cap', name: 'Cap 1', description: 'First capability with same ID' },
          { id: 'duplicate-cap', name: 'Cap 2', description: 'Second capability with same ID' }
        ]
      };
      const result = validateManifest(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'DUPLICATE_CAPABILITY_ID')).toBe(true);
    });

    it('should reject manifest with self-dependency', () => {
      const invalid = {
        ...validManifest,
        dependencies: [{ moduleId: 'webwaka-core-hello' }]
      };
      const result = validateManifest(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'SELF_DEPENDENCY')).toBe(true);
    });

    it('should reject manifest with duplicate dependencies', () => {
      const invalid = {
        ...validManifest,
        dependencies: [
          { moduleId: 'webwaka-core-other' },
          { moduleId: 'webwaka-core-other' }
        ]
      };
      const result = validateManifest(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'DUPLICATE_DEPENDENCY')).toBe(true);
    });

    it('should reject manifest missing required fields', () => {
      const invalid = { moduleId: 'webwaka-core-test' };
      const result = validateManifest(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject manifest with unknown fields', () => {
      const invalid = { ...validManifest, unknownField: 'value' };
      const result = validateManifest(invalid);
      expect(result.valid).toBe(false);
    });

    it('should validate all module classes', () => {
      const classes = ['core', 'suite', 'industry', 'ext', 'infra'] as const;
      for (const cls of classes) {
        const manifest = {
          ...validManifest,
          moduleId: `webwaka-${cls}-test`,
          class: cls
        };
        const result = validateManifest(manifest);
        expect(result.valid).toBe(true);
      }
    });

    it('should validate semver with prerelease and build metadata', () => {
      const manifest = { ...validManifest, version: '1.0.0-alpha.1+build.123' };
      const result = validateManifest(manifest);
      expect(result.valid).toBe(true);
    });
  });

  describe('isValidModuleId', () => {
    it('should accept valid module IDs', () => {
      expect(isValidModuleId('webwaka-core-registry')).toBe(true);
      expect(isValidModuleId('webwaka-suite-crm')).toBe(true);
      expect(isValidModuleId('webwaka-industry-healthcare')).toBe(true);
      expect(isValidModuleId('webwaka-ext-analytics')).toBe(true);
      expect(isValidModuleId('webwaka-infra-database')).toBe(true);
    });

    it('should reject invalid module IDs', () => {
      expect(isValidModuleId('invalid-id')).toBe(false);
      expect(isValidModuleId('webwaka-invalid-test')).toBe(false);
      expect(isValidModuleId('webwaka-core-')).toBe(false);
      expect(isValidModuleId('WEBWAKA-CORE-TEST')).toBe(false);
    });
  });

  describe('isValidSemver', () => {
    it('should accept valid semver versions', () => {
      expect(isValidSemver('0.0.1')).toBe(true);
      expect(isValidSemver('1.0.0')).toBe(true);
      expect(isValidSemver('2.1.3')).toBe(true);
      expect(isValidSemver('1.0.0-alpha')).toBe(true);
      expect(isValidSemver('1.0.0-alpha.1')).toBe(true);
      expect(isValidSemver('1.0.0+build.123')).toBe(true);
    });

    it('should reject invalid versions', () => {
      expect(isValidSemver('v1.0.0')).toBe(false);
      expect(isValidSemver('1.0')).toBe(false);
      expect(isValidSemver('1')).toBe(false);
      expect(isValidSemver('latest')).toBe(false);
    });
  });

  describe('isValidCapabilityId', () => {
    it('should accept valid capability IDs', () => {
      expect(isValidCapabilityId('hello-world')).toBe(true);
      expect(isValidCapabilityId('user-management')).toBe(true);
      expect(isValidCapabilityId('api-gateway')).toBe(true);
    });

    it('should reject invalid capability IDs', () => {
      expect(isValidCapabilityId('a')).toBe(false);  // too short
      expect(isValidCapabilityId('ab')).toBe(false); // too short
      expect(isValidCapabilityId('Hello-World')).toBe(false); // uppercase
      expect(isValidCapabilityId('-hello')).toBe(false); // starts with dash
      expect(isValidCapabilityId('hello-')).toBe(false); // ends with dash
    });
  });

  describe('extractModuleClass', () => {
    it('should extract module class from valid IDs', () => {
      expect(extractModuleClass('webwaka-core-registry')).toBe('core');
      expect(extractModuleClass('webwaka-suite-crm')).toBe('suite');
      expect(extractModuleClass('webwaka-industry-healthcare')).toBe('industry');
      expect(extractModuleClass('webwaka-ext-analytics')).toBe('ext');
      expect(extractModuleClass('webwaka-infra-database')).toBe('infra');
    });

    it('should return null for invalid IDs', () => {
      expect(extractModuleClass('invalid-id')).toBeNull();
      expect(extractModuleClass('')).toBeNull();
    });
  });
});
