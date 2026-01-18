/**
 * WebWaka Core Registry - Manifest Validator
 * 
 * Validates module manifests against the canonical JSON Schema
 * with additional business rule enforcement.
 */

import Ajv, { ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import * as fs from 'fs';
import * as path from 'path';
import {
  ModuleManifest,
  ValidationResult,
  ValidationError,
  ModuleClass
} from './types';

// Load schema at module initialization
const SCHEMA_PATH = path.join(__dirname, '..', 'schemas', 'module_manifest.schema.json');

/**
 * ManifestValidator handles all manifest validation logic
 */
export class ManifestValidator {
  private ajv: Ajv;
  private validateFn: ValidateFunction | null = null;
  private schema: object | null = null;

  constructor() {
    this.ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(this.ajv);
    this.loadSchema();
  }

  /**
   * Load the JSON Schema from file
   */
  private loadSchema(): void {
    try {
      const schemaContent = fs.readFileSync(SCHEMA_PATH, 'utf-8');
      this.schema = JSON.parse(schemaContent);
      this.validateFn = this.ajv.compile(this.schema);
    } catch (error) {
      // Schema will be loaded lazily or from embedded schema
      this.schema = null;
      this.validateFn = null;
    }
  }

  /**
   * Set schema programmatically (useful for testing or embedded usage)
   */
  setSchema(schema: object): void {
    this.schema = schema;
    this.validateFn = this.ajv.compile(schema);
  }

  /**
   * Validate a manifest against the JSON Schema and business rules
   */
  validate(manifest: unknown): ValidationResult {
    const errors: ValidationError[] = [];

    // Schema validation
    if (this.validateFn) {
      const valid = this.validateFn(manifest);
      if (!valid && this.validateFn.errors) {
        for (const err of this.validateFn.errors) {
          errors.push({
            path: err.instancePath || '/',
            message: err.message || 'Unknown validation error',
            code: `SCHEMA_${err.keyword?.toUpperCase() || 'ERROR'}`
          });
        }
      }
    }

    // If schema validation failed, return early
    if (errors.length > 0) {
      return { valid: false, errors };
    }

    // Business rule validation (only if schema passed)
    const m = manifest as ModuleManifest;
    this.validateBusinessRules(m, errors);

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate business rules beyond JSON Schema
   */
  private validateBusinessRules(manifest: ModuleManifest, errors: ValidationError[]): void {
    // Rule: moduleId must match expected prefix based on class
    const expectedPrefix = `webwaka-${manifest.class}-`;
    if (!manifest.moduleId.startsWith(expectedPrefix)) {
      errors.push({
        path: '/moduleId',
        message: `moduleId must start with "${expectedPrefix}" to match class "${manifest.class}"`,
        code: 'CLASS_PREFIX_MISMATCH'
      });
    }

    // Rule: Capability IDs must be unique within the manifest
    const capabilityIds = new Set<string>();
    for (const cap of manifest.capabilities) {
      if (capabilityIds.has(cap.id)) {
        errors.push({
          path: '/capabilities',
          message: `Duplicate capability ID: ${cap.id}`,
          code: 'DUPLICATE_CAPABILITY'
        });
      }
      capabilityIds.add(cap.id);
    }

    // Rule: Dependencies must not include self
    for (const dep of manifest.dependencies) {
      if (dep.moduleId === manifest.moduleId) {
        errors.push({
          path: '/dependencies',
          message: 'Module cannot depend on itself',
          code: 'SELF_DEPENDENCY'
        });
      }
    }

    // Rule: Dependency moduleIds must be unique
    const depIds = new Set<string>();
    for (const dep of manifest.dependencies) {
      if (depIds.has(dep.moduleId)) {
        errors.push({
          path: '/dependencies',
          message: `Duplicate dependency: ${dep.moduleId}`,
          code: 'DUPLICATE_DEPENDENCY'
        });
      }
      depIds.add(dep.moduleId);
    }
  }

  /**
   * Extract module class from moduleId
   */
  static extractClass(moduleId: string): ModuleClass | null {
    const match = moduleId.match(/^webwaka-(core|suite|industry|ext|infra)-/);
    return match ? (match[1] as ModuleClass) : null;
  }

  /**
   * Validate moduleId format
   */
  static isValidModuleId(moduleId: string): boolean {
    return /^webwaka-(core|suite|industry|ext|infra)-[a-z0-9-]+$/.test(moduleId);
  }

  /**
   * Validate capability ID format
   */
  static isValidCapabilityId(capabilityId: string): boolean {
    return /^[a-z][a-z0-9-]*:[a-z][a-z0-9-]*$/.test(capabilityId);
  }

  /**
   * Validate semver format
   */
  static isValidSemver(version: string): boolean {
    return /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/.test(version);
  }
}

// Default singleton instance
export const validator = new ManifestValidator();
