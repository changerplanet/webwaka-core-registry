/**
 * WebWaka Core Registry - Capability Resolver
 * 
 * Deterministic capability resolution system.
 * Given a capability ID, returns exactly one owning module.
 */

import {
  Capability,
  CapabilityResolution,
  RegisteredModule
} from './types';

/**
 * Error thrown when capability resolution fails
 */
export class CapabilityResolutionError extends Error {
  constructor(
    message: string,
    public readonly code: 'NOT_FOUND' | 'DUPLICATE' | 'INVALID_FORMAT',
    public readonly capabilityId: string,
    public readonly conflictingModules?: string[]
  ) {
    super(message);
    this.name = 'CapabilityResolutionError';
  }
}

/**
 * CapabilityResolver provides deterministic capability lookup
 */
export class CapabilityResolver {
  /** Map of capability ID to owning module */
  private capabilityMap: Map<string, { capability: Capability; module: RegisteredModule }> = new Map();
  
  /** Track all capabilities per module for cleanup */
  private moduleCapabilities: Map<string, Set<string>> = new Map();

  /**
   * Register capabilities from a module
   * @throws CapabilityResolutionError if duplicate capability detected
   */
  registerCapabilities(module: RegisteredModule): void {
    const newCapabilities: string[] = [];

    // First pass: check for duplicates
    for (const capability of module.capabilities) {
      const existing = this.capabilityMap.get(capability.id);
      if (existing && existing.module.moduleId !== module.moduleId) {
        throw new CapabilityResolutionError(
          `Capability "${capability.id}" is already registered by module "${existing.module.moduleId}"`,
          'DUPLICATE',
          capability.id,
          [existing.module.moduleId, module.moduleId]
        );
      }
      newCapabilities.push(capability.id);
    }

    // Second pass: register all capabilities (atomic)
    for (const capability of module.capabilities) {
      this.capabilityMap.set(capability.id, { capability, module });
    }

    // Track capabilities for this module
    this.moduleCapabilities.set(module.moduleId, new Set(newCapabilities));
  }

  /**
   * Unregister all capabilities from a module
   */
  unregisterCapabilities(moduleId: string): void {
    const capabilities = this.moduleCapabilities.get(moduleId);
    if (capabilities) {
      for (const capId of capabilities) {
        this.capabilityMap.delete(capId);
      }
      this.moduleCapabilities.delete(moduleId);
    }
  }

  /**
   * Resolve a capability ID to its owning module
   * @throws CapabilityResolutionError if not found or invalid format
   */
  resolve(capabilityId: string): CapabilityResolution {
    // Validate format
    if (!/^[a-z][a-z0-9-]*:[a-z][a-z0-9-]*$/.test(capabilityId)) {
      throw new CapabilityResolutionError(
        `Invalid capability ID format: "${capabilityId}". Expected format: namespace:name`,
        'INVALID_FORMAT',
        capabilityId
      );
    }

    const resolution = this.capabilityMap.get(capabilityId);
    if (!resolution) {
      throw new CapabilityResolutionError(
        `Capability "${capabilityId}" is not registered`,
        'NOT_FOUND',
        capabilityId
      );
    }

    return {
      capability: { ...resolution.capability },
      module: { ...resolution.module }
    };
  }

  /**
   * Check if a capability is registered
   */
  hasCapability(capabilityId: string): boolean {
    return this.capabilityMap.has(capabilityId);
  }

  /**
   * Get all registered capabilities
   */
  getAllCapabilities(): Map<string, string> {
    const result = new Map<string, string>();
    for (const [capId, { module }] of this.capabilityMap) {
      result.set(capId, module.moduleId);
    }
    return result;
  }

  /**
   * Get capabilities for a specific module
   */
  getModuleCapabilities(moduleId: string): string[] {
    const caps = this.moduleCapabilities.get(moduleId);
    return caps ? Array.from(caps) : [];
  }

  /**
   * Check for duplicate capabilities before registration
   * Returns list of conflicts
   */
  checkForDuplicates(capabilities: Capability[], excludeModuleId?: string): string[] {
    const conflicts: string[] = [];
    for (const cap of capabilities) {
      const existing = this.capabilityMap.get(cap.id);
      if (existing && existing.module.moduleId !== excludeModuleId) {
        conflicts.push(cap.id);
      }
    }
    return conflicts;
  }

  /**
   * Clear all registrations (useful for testing)
   */
  clear(): void {
    this.capabilityMap.clear();
    this.moduleCapabilities.clear();
  }
}

// Default singleton instance
export const capabilityResolver = new CapabilityResolver();
