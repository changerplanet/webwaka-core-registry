/**
 * WebWaka Module Manifest Validator
 * Validates module manifests against the JSON schema and business rules
 */
import { ValidationResult } from './types';
/**
 * Validates a module manifest against the schema and business rules
 * @param manifest - The manifest to validate
 * @returns ValidationResult with errors if any
 */
export declare function validateManifest(manifest: unknown): ValidationResult;
/**
 * Validates a module ID format
 * @param moduleId - The module ID to validate
 * @returns true if valid
 */
export declare function isValidModuleId(moduleId: string): boolean;
/**
 * Validates a semantic version string
 * @param version - The version to validate
 * @returns true if valid semver
 */
export declare function isValidSemver(version: string): boolean;
/**
 * Validates a capability ID format
 * @param capabilityId - The capability ID to validate
 * @returns true if valid
 */
export declare function isValidCapabilityId(capabilityId: string): boolean;
/**
 * Extracts the module class from a module ID
 * @param moduleId - The module ID
 * @returns The module class or null if invalid
 */
export declare function extractModuleClass(moduleId: string): string | null;
