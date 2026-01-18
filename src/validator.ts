/**
 * WebWaka Module Manifest Validator
 * Validates module manifests against the JSON schema and business rules
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { ModuleManifest, ValidationResult, ValidationError } from './types';
import moduleManifestSchema from '../schemas/module_manifest.schema.json';

/** Module ID pattern */
const MODULE_ID_PATTERN = /^webwaka-(core|suite|industry|ext|infra)-[a-z0-9-]+$/;

/** Semver pattern */
const SEMVER_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

/** Capability ID pattern */
const CAPABILITY_ID_PATTERN = /^[a-z][a-z0-9-]*[a-z0-9]$/;

/**
 * Creates and configures the AJV validator
 */
function createValidator(): Ajv {
  const ajv = new Ajv({
    allErrors: true,
    strict: true,
    strictSchema: true,
    strictNumbers: true,
    strictTypes: true,
    strictTuples: true,
    strictRequired: true
  });
  
  addFormats(ajv);
  return ajv;
}

/**
 * Validates a module manifest against the schema and business rules
 * @param manifest - The manifest to validate
 * @returns ValidationResult with errors if any
 */
export function validateManifest(manifest: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Schema validation
  const ajv = createValidator();
  const validate = ajv.compile(moduleManifestSchema);
  const schemaValid = validate(manifest);
  
  if (!schemaValid && validate.errors) {
    for (const error of validate.errors) {
      errors.push({
        code: 'SCHEMA_VALIDATION_ERROR',
        message: error.message || 'Schema validation failed',
        path: error.instancePath || undefined,
        context: {
          keyword: error.keyword,
          params: error.params
        }
      });
    }
  }
  
  // If schema validation fails, return early
  if (errors.length > 0) {
    return { valid: false, errors };
  }
  
  // Business rule validation (only if schema is valid)
  const typedManifest = manifest as ModuleManifest;
  
  // Validate moduleId matches class
  const moduleIdMatch = typedManifest.moduleId.match(MODULE_ID_PATTERN);
  if (moduleIdMatch) {
    const extractedClass = moduleIdMatch[1];
    if (extractedClass !== typedManifest.class) {
      errors.push({
        code: 'MODULE_CLASS_MISMATCH',
        message: `Module ID prefix '${extractedClass}' does not match declared class '${typedManifest.class}'`,
        path: '/class',
        context: {
          moduleId: typedManifest.moduleId,
          declaredClass: typedManifest.class,
          extractedClass
        }
      });
    }
  }
  
  // Validate capability IDs are unique within the module
  const capabilityIds = new Set<string>();
  for (const capability of typedManifest.capabilities) {
    if (capabilityIds.has(capability.id)) {
      errors.push({
        code: 'DUPLICATE_CAPABILITY_ID',
        message: `Duplicate capability ID '${capability.id}' within module`,
        path: '/capabilities',
        context: { capabilityId: capability.id }
      });
    }
    capabilityIds.add(capability.id);
  }
  
  // Validate no self-dependency
  for (const dep of typedManifest.dependencies) {
    if (dep.moduleId === typedManifest.moduleId) {
      errors.push({
        code: 'SELF_DEPENDENCY',
        message: 'Module cannot depend on itself',
        path: '/dependencies',
        context: { moduleId: typedManifest.moduleId }
      });
    }
  }
  
  // Validate no duplicate dependencies
  const depIds = new Set<string>();
  for (const dep of typedManifest.dependencies) {
    if (depIds.has(dep.moduleId)) {
      errors.push({
        code: 'DUPLICATE_DEPENDENCY',
        message: `Duplicate dependency '${dep.moduleId}'`,
        path: '/dependencies',
        context: { dependencyId: dep.moduleId }
      });
    }
    depIds.add(dep.moduleId);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validates a module ID format
 * @param moduleId - The module ID to validate
 * @returns true if valid
 */
export function isValidModuleId(moduleId: string): boolean {
  return MODULE_ID_PATTERN.test(moduleId);
}

/**
 * Validates a semantic version string
 * @param version - The version to validate
 * @returns true if valid semver
 */
export function isValidSemver(version: string): boolean {
  return SEMVER_PATTERN.test(version);
}

/**
 * Validates a capability ID format
 * @param capabilityId - The capability ID to validate
 * @returns true if valid
 */
export function isValidCapabilityId(capabilityId: string): boolean {
  return CAPABILITY_ID_PATTERN.test(capabilityId);
}

/**
 * Extracts the module class from a module ID
 * @param moduleId - The module ID
 * @returns The module class or null if invalid
 */
export function extractModuleClass(moduleId: string): string | null {
  const match = moduleId.match(MODULE_ID_PATTERN);
  return match ? match[1] : null;
}
