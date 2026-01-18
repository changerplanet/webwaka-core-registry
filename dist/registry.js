"use strict";
/**
 * WebWaka Module Registry Engine
 * Core registry implementation for module lifecycle management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.registry = exports.ModuleRegistry = void 0;
const validator_1 = require("./validator");
/**
 * Module Registry Engine
 * Manages module registration, capability resolution, and tenant state
 */
class ModuleRegistry {
    /** Registered modules by ID */
    modules = new Map();
    /** Capability to module mapping */
    capabilityIndex = new Map();
    /** Tenant module states */
    tenantStates = new Map();
    /**
     * Validates a module manifest
     * @param manifest - The manifest to validate
     * @returns ValidationResult
     */
    validateManifest(manifest) {
        return (0, validator_1.validateManifest)(manifest);
    }
    /**
     * Registers a new module in the registry
     * @param manifest - The module manifest to register
     * @returns ValidationResult indicating success or errors
     */
    registerModule(manifest) {
        // First validate the manifest
        const validation = this.validateManifest(manifest);
        if (!validation.valid) {
            return validation;
        }
        // Check for duplicate module ID
        if (this.modules.has(manifest.moduleId)) {
            return {
                valid: false,
                errors: [{
                        code: 'MODULE_ALREADY_REGISTERED',
                        message: `Module '${manifest.moduleId}' is already registered`,
                        context: { moduleId: manifest.moduleId }
                    }]
            };
        }
        // Check for capability conflicts (must be globally unique)
        for (const capability of manifest.capabilities) {
            const existingModule = this.capabilityIndex.get(capability.id);
            if (existingModule) {
                return {
                    valid: false,
                    errors: [{
                            code: 'CAPABILITY_CONFLICT',
                            message: `Capability '${capability.id}' is already provided by module '${existingModule}'`,
                            context: {
                                capabilityId: capability.id,
                                existingModule,
                                newModule: manifest.moduleId
                            }
                        }]
                };
            }
        }
        // Verify all dependencies are registered
        for (const dep of manifest.dependencies) {
            if (!dep.optional && !this.modules.has(dep.moduleId)) {
                return {
                    valid: false,
                    errors: [{
                            code: 'MISSING_DEPENDENCY',
                            message: `Required dependency '${dep.moduleId}' is not registered`,
                            context: {
                                dependency: dep.moduleId,
                                module: manifest.moduleId
                            }
                        }]
                };
            }
            // Verify required capabilities if specified
            if (dep.capabilities && !dep.optional) {
                const depModule = this.modules.get(dep.moduleId);
                if (depModule) {
                    for (const reqCap of dep.capabilities) {
                        const hasCapability = depModule.capabilities.some(c => c.id === reqCap);
                        if (!hasCapability) {
                            return {
                                valid: false,
                                errors: [{
                                        code: 'MISSING_REQUIRED_CAPABILITY',
                                        message: `Module '${dep.moduleId}' does not provide required capability '${reqCap}'`,
                                        context: {
                                            dependency: dep.moduleId,
                                            requiredCapability: reqCap,
                                            module: manifest.moduleId
                                        }
                                    }]
                            };
                        }
                    }
                }
            }
        }
        // Register the module
        const registered = {
            ...manifest,
            registeredAt: new Date().toISOString(),
            active: true
        };
        this.modules.set(manifest.moduleId, registered);
        // Index capabilities
        for (const capability of manifest.capabilities) {
            this.capabilityIndex.set(capability.id, manifest.moduleId);
        }
        return { valid: true, errors: [] };
    }
    /**
     * Lists all registered modules
     * @returns Array of registered modules
     */
    listModules() {
        return Array.from(this.modules.values());
    }
    /**
     * Gets a specific module by ID
     * @param moduleId - The module ID to retrieve
     * @returns The registered module or undefined
     */
    getModule(moduleId) {
        return this.modules.get(moduleId);
    }
    /**
     * Resolves a capability to its providing module
     * @param capabilityId - The capability ID to resolve
     * @returns CapabilityResolution or undefined if not found
     */
    resolveCapability(capabilityId) {
        const moduleId = this.capabilityIndex.get(capabilityId);
        if (!moduleId) {
            return undefined;
        }
        const module = this.modules.get(moduleId);
        if (!module) {
            return undefined;
        }
        const capability = module.capabilities.find(c => c.id === capabilityId);
        if (!capability) {
            return undefined;
        }
        return {
            capabilityId,
            moduleId,
            capability
        };
    }
    /**
     * Lists all registered capabilities
     * @returns Array of capability resolutions
     */
    listCapabilities() {
        const results = [];
        for (const capabilityId of this.capabilityIndex.keys()) {
            const resolution = this.resolveCapability(capabilityId);
            if (resolution) {
                results.push(resolution);
            }
        }
        return results;
    }
    /**
     * Enables a module for a specific tenant
     * @param tenantId - The tenant ID
     * @param moduleId - The module ID to enable
     * @returns ModuleOperationResult
     */
    enableModule(tenantId, moduleId) {
        // Validate module exists
        const module = this.modules.get(moduleId);
        if (!module) {
            return {
                success: false,
                operation: 'enable',
                moduleId,
                tenantId,
                error: `Module '${moduleId}' is not registered`
            };
        }
        // Get or create tenant state map
        if (!this.tenantStates.has(tenantId)) {
            this.tenantStates.set(tenantId, new Map());
        }
        const tenantModules = this.tenantStates.get(tenantId);
        // Check if already enabled
        const existing = tenantModules.get(moduleId);
        if (existing?.enabled) {
            return {
                success: true,
                operation: 'enable',
                moduleId,
                tenantId
            };
        }
        // Check all required dependencies are enabled for this tenant
        const missingDeps = [];
        for (const dep of module.dependencies) {
            if (dep.optional)
                continue;
            const depState = tenantModules.get(dep.moduleId);
            if (!depState?.enabled) {
                missingDeps.push(dep.moduleId);
            }
        }
        if (missingDeps.length > 0) {
            return {
                success: false,
                operation: 'enable',
                moduleId,
                tenantId,
                error: `Required dependencies are not enabled: ${missingDeps.join(', ')}`,
                affectedDependencies: missingDeps
            };
        }
        // Enable the module
        tenantModules.set(moduleId, {
            moduleId,
            enabled: true,
            enabledAt: new Date().toISOString()
        });
        return {
            success: true,
            operation: 'enable',
            moduleId,
            tenantId
        };
    }
    /**
     * Disables a module for a specific tenant
     * @param tenantId - The tenant ID
     * @param moduleId - The module ID to disable
     * @returns ModuleOperationResult
     */
    disableModule(tenantId, moduleId) {
        // Validate module exists
        const module = this.modules.get(moduleId);
        if (!module) {
            return {
                success: false,
                operation: 'disable',
                moduleId,
                tenantId,
                error: `Module '${moduleId}' is not registered`
            };
        }
        // Get tenant state map
        const tenantModules = this.tenantStates.get(tenantId);
        if (!tenantModules) {
            return {
                success: true,
                operation: 'disable',
                moduleId,
                tenantId
            };
        }
        // Check if already disabled
        const existing = tenantModules.get(moduleId);
        if (!existing?.enabled) {
            return {
                success: true,
                operation: 'disable',
                moduleId,
                tenantId
            };
        }
        // Check no other enabled modules depend on this one
        const dependents = [];
        for (const [otherModuleId, state] of tenantModules) {
            if (!state.enabled || otherModuleId === moduleId)
                continue;
            const otherModule = this.modules.get(otherModuleId);
            if (!otherModule)
                continue;
            for (const dep of otherModule.dependencies) {
                if (dep.moduleId === moduleId && !dep.optional) {
                    dependents.push(otherModuleId);
                    break;
                }
            }
        }
        if (dependents.length > 0) {
            return {
                success: false,
                operation: 'disable',
                moduleId,
                tenantId,
                error: `Cannot disable: other enabled modules depend on this: ${dependents.join(', ')}`,
                affectedDependencies: dependents
            };
        }
        // Disable the module
        tenantModules.set(moduleId, {
            moduleId,
            enabled: false,
            disabledAt: new Date().toISOString()
        });
        return {
            success: true,
            operation: 'disable',
            moduleId,
            tenantId
        };
    }
    /**
     * Gets all enabled modules for a tenant
     * @param tenantId - The tenant ID
     * @returns Array of enabled module IDs
     */
    getEnabledModules(tenantId) {
        const tenantModules = this.tenantStates.get(tenantId);
        if (!tenantModules) {
            return [];
        }
        return Array.from(tenantModules.entries())
            .filter(([_, state]) => state.enabled)
            .map(([moduleId]) => moduleId);
    }
    /**
     * Gets the module state for a tenant
     * @param tenantId - The tenant ID
     * @param moduleId - The module ID
     * @returns TenantModuleState or undefined
     */
    getTenantModuleState(tenantId, moduleId) {
        return this.tenantStates.get(tenantId)?.get(moduleId);
    }
    /**
     * Checks if a module is enabled for a tenant
     * @param tenantId - The tenant ID
     * @param moduleId - The module ID
     * @returns true if enabled
     */
    isModuleEnabled(tenantId, moduleId) {
        const state = this.getTenantModuleState(tenantId, moduleId);
        return state?.enabled ?? false;
    }
    /**
     * Gets modules that depend on a given module
     * @param moduleId - The module ID to find dependents for
     * @returns Array of module IDs that depend on the given module
     */
    getDependents(moduleId) {
        const dependents = [];
        for (const [id, module] of this.modules) {
            if (id === moduleId)
                continue;
            for (const dep of module.dependencies) {
                if (dep.moduleId === moduleId) {
                    dependents.push(id);
                    break;
                }
            }
        }
        return dependents;
    }
    /**
     * Gets the dependency graph for a module
     * @param moduleId - The module ID
     * @returns Array of dependency module IDs in resolution order
     */
    getDependencyOrder(moduleId) {
        const module = this.modules.get(moduleId);
        if (!module) {
            return [];
        }
        const visited = new Set();
        const result = [];
        const visit = (id) => {
            if (visited.has(id))
                return;
            visited.add(id);
            const mod = this.modules.get(id);
            if (!mod)
                return;
            for (const dep of mod.dependencies) {
                if (!dep.optional) {
                    visit(dep.moduleId);
                }
            }
            result.push(id);
        };
        visit(moduleId);
        return result;
    }
    /**
     * Clears all registered modules and states
     * Used for testing
     */
    clear() {
        this.modules.clear();
        this.capabilityIndex.clear();
        this.tenantStates.clear();
    }
}
exports.ModuleRegistry = ModuleRegistry;
/** Default registry instance */
exports.registry = new ModuleRegistry();
