# Module Contract: Core Registry

## Purpose

The Core Registry is the **single source of truth** for the entire WebWaka platform. It provides:

- **Module Registration**: What modules exist in the platform
- **Capability Resolution**: What capabilities each module exposes
- **Dependency Management**: What dependencies modules require
- **Tenant Control**: Whether a module can be enabled/disabled per tenant

Nothing else in WebWaka works without this module.

## Capabilities

This module provides the following capabilities:

| Capability ID | Name | Description |
|---------------|------|-------------|
| `registry:validate` | Manifest Validation | Validates module manifests against the canonical JSON Schema |
| `registry:register` | Module Registration | Registers modules in the central registry |
| `registry:resolve` | Capability Resolution | Resolves capability IDs to their owning modules |
| `registry:tenant-control` | Tenant Module Control | Enables/disables modules per tenant with dependency enforcement |

## Dependencies

This module has **no dependencies**. It is the foundational module of the WebWaka platform.

## API Surface

### Core Functions

```typescript
// Validate a manifest against schema and business rules
validateManifest(manifest: unknown): ValidationResult

// Register a module in the registry
registerModule(manifest: ModuleManifest): Promise<RegisteredModule>

// List all registered modules
listModules(): Promise<RegisteredModule[]>

// Get a specific module by ID
getModule(moduleId: string): Promise<RegisteredModule | null>

// Resolve a capability to its owning module
resolveCapability(capabilityId: string): CapabilityResolution
```

### Tenant Control Functions

```typescript
// Enable a module for a tenant (enforces dependency rules)
enableModule(tenantId: string, moduleId: string): Promise<TenantModuleState>

// Disable a module for a tenant (enforces dependent rules)
disableModule(tenantId: string, moduleId: string): Promise<TenantModuleState>

// Check if module is enabled for tenant
isModuleEnabled(tenantId: string, moduleId: string): Promise<boolean>

// Get all enabled modules for a tenant
getEnabledModules(tenantId: string): Promise<string[]>
```

### Key Types

```typescript
interface ModuleManifest {
  moduleId: string;      // Must match repo name (e.g., webwaka-core-registry)
  class: 'core' | 'suite' | 'industry' | 'ext' | 'infra';
  version: string;       // Semver
  capabilities: Capability[];
  dependencies: ModuleDependency[];
  metadata: ModuleMetadata;
}

interface Capability {
  id: string;           // Format: namespace:name (globally unique)
  name: string;
  description: string;
}
```

## Validation Rules

### Manifest Schema Validation
- `moduleId` must match pattern: `webwaka-(core|suite|industry|ext|infra)-[name]`
- `class` must match the prefix in `moduleId`
- `version` must be valid semver
- Capability IDs must match pattern: `namespace:name`
- All required fields must be present

### Business Rules
- Capability IDs must be globally unique across all modules
- No circular dependencies allowed
- Self-dependency is not allowed
- Duplicate capabilities within a manifest are rejected

### Tenant Control Rules
- Cannot enable a module without its required dependencies enabled
- Cannot disable a module if other enabled modules depend on it
- Optional dependencies do not block enablement

## Storage Interface

The registry uses an abstracted storage interface:

```typescript
interface RegistryStorage {
  saveModule(module: RegisteredModule): Promise<void>;
  getModule(moduleId: string): Promise<RegisteredModule | null>;
  getAllModules(): Promise<RegisteredModule[]>;
  deleteModule(moduleId: string): Promise<boolean>;
  saveTenantState(state: TenantModuleState): Promise<void>;
  getTenantState(tenantId: string, moduleId: string): Promise<TenantModuleState | null>;
  getTenantStates(tenantId: string): Promise<TenantModuleState[]>;
}
```

Default implementation: `InMemoryStorage` (for development/testing)

## Security Considerations

- All manifest inputs are validated before registration
- Capability conflicts are detected and rejected atomically
- Tenant state isolation is enforced at the storage level
- No raw user input is passed to storage without validation

## Performance Expectations

- Manifest validation: < 10ms for typical manifests
- Module registration: < 50ms (including capability indexing)
- Capability resolution: O(1) lookup time
- Tenant state operations: O(1) for individual lookups

## Versioning

This module follows semantic versioning (semver):
- MAJOR: Breaking API changes
- MINOR: New features, backward compatible
- PATCH: Bug fixes, backward compatible

Current version: **0.2.0**
