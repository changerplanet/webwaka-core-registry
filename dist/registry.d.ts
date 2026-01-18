/**
 * WebWaka Module Registry Engine
 * Core registry implementation for module lifecycle management
 */
import { ModuleManifest, RegisteredModule, TenantModuleState, ValidationResult, CapabilityResolution, ModuleOperationResult } from './types';
/**
 * Module Registry Engine
 * Manages module registration, capability resolution, and tenant state
 */
export declare class ModuleRegistry {
    /** Registered modules by ID */
    private modules;
    /** Capability to module mapping */
    private capabilityIndex;
    /** Tenant module states */
    private tenantStates;
    /**
     * Validates a module manifest
     * @param manifest - The manifest to validate
     * @returns ValidationResult
     */
    validateManifest(manifest: unknown): ValidationResult;
    /**
     * Registers a new module in the registry
     * @param manifest - The module manifest to register
     * @returns ValidationResult indicating success or errors
     */
    registerModule(manifest: ModuleManifest): ValidationResult;
    /**
     * Lists all registered modules
     * @returns Array of registered modules
     */
    listModules(): RegisteredModule[];
    /**
     * Gets a specific module by ID
     * @param moduleId - The module ID to retrieve
     * @returns The registered module or undefined
     */
    getModule(moduleId: string): RegisteredModule | undefined;
    /**
     * Resolves a capability to its providing module
     * @param capabilityId - The capability ID to resolve
     * @returns CapabilityResolution or undefined if not found
     */
    resolveCapability(capabilityId: string): CapabilityResolution | undefined;
    /**
     * Lists all registered capabilities
     * @returns Array of capability resolutions
     */
    listCapabilities(): CapabilityResolution[];
    /**
     * Enables a module for a specific tenant
     * @param tenantId - The tenant ID
     * @param moduleId - The module ID to enable
     * @returns ModuleOperationResult
     */
    enableModule(tenantId: string, moduleId: string): ModuleOperationResult;
    /**
     * Disables a module for a specific tenant
     * @param tenantId - The tenant ID
     * @param moduleId - The module ID to disable
     * @returns ModuleOperationResult
     */
    disableModule(tenantId: string, moduleId: string): ModuleOperationResult;
    /**
     * Gets all enabled modules for a tenant
     * @param tenantId - The tenant ID
     * @returns Array of enabled module IDs
     */
    getEnabledModules(tenantId: string): string[];
    /**
     * Gets the module state for a tenant
     * @param tenantId - The tenant ID
     * @param moduleId - The module ID
     * @returns TenantModuleState or undefined
     */
    getTenantModuleState(tenantId: string, moduleId: string): TenantModuleState | undefined;
    /**
     * Checks if a module is enabled for a tenant
     * @param tenantId - The tenant ID
     * @param moduleId - The module ID
     * @returns true if enabled
     */
    isModuleEnabled(tenantId: string, moduleId: string): boolean;
    /**
     * Gets modules that depend on a given module
     * @param moduleId - The module ID to find dependents for
     * @returns Array of module IDs that depend on the given module
     */
    getDependents(moduleId: string): string[];
    /**
     * Gets the dependency graph for a module
     * @param moduleId - The module ID
     * @returns Array of dependency module IDs in resolution order
     */
    getDependencyOrder(moduleId: string): string[];
    /**
     * Clears all registered modules and states
     * Used for testing
     */
    clear(): void;
}
/** Default registry instance */
export declare const registry: ModuleRegistry;
