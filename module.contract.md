# Module Contract: Core Registry

## Purpose

Module registry and capability spine for WebWaka modular architecture. This is the foundational module that all other WebWaka modules (Suites, Industry Suites, Extensions, and Infrastructure) depend on for registration and capability resolution.

## Capabilities

This module provides the following capabilities:

- **module-validation**: Schema-based validation of module manifests
- **module-registration**: Registration and indexing of modules in the registry
- **capability-resolution**: Deterministic resolution of capabilities to providing modules
- **tenant-management**: Per-tenant module enable/disable with dependency enforcement

## Dependencies

This module has no dependencies (it is the foundation).

## API Surface

### Public Interfaces

#### Validator Functions
- `validateManifest(manifest: unknown): ValidationResult` - Validates manifest against schema
- `isValidModuleId(moduleId: string): boolean` - Validates module ID format
- `isValidSemver(version: string): boolean` - Validates semantic version
- `isValidCapabilityId(capabilityId: string): boolean` - Validates capability ID format
- `extractModuleClass(moduleId: string): string | null` - Extracts class from module ID

#### Registry Class
- `validateManifest(manifest)` - Validates a manifest
- `registerModule(manifest)` - Registers a module
- `listModules()` - Lists all registered modules
- `getModule(moduleId)` - Gets a specific module
- `resolveCapability(capability)` - Resolves capability to module
- `listCapabilities()` - Lists all capabilities
- `enableModule(tenantId, moduleId)` - Enables module for tenant
- `disableModule(tenantId, moduleId)` - Disables module for tenant
- `isModuleEnabled(tenantId, moduleId)` - Checks if enabled
- `getEnabledModules(tenantId)` - Gets all enabled modules
- `getDependents(moduleId)` - Gets modules depending on this one
- `getDependencyOrder(moduleId)` - Gets dependency resolution order

### Events

No events - this is a pure library module.

## Data Models

### ModuleManifest
```typescript
interface ModuleManifest {
  moduleId: string;      // Pattern: ^webwaka-(core|suite|industry|ext|infra)-[a-z0-9-]+$
  name: string;
  version: string;       // Semantic versioning
  class: 'core' | 'suite' | 'industry' | 'ext' | 'infra';
  description: string;
  capabilities: Capability[];
  dependencies: Dependency[];
  metadata: ModuleMetadata;
}
```

### Capability
```typescript
interface Capability {
  id: string;           // Globally unique
  name: string;
  description: string;
  version?: string;     // API version (major.minor)
}
```

### Dependency
```typescript
interface Dependency {
  moduleId: string;
  version?: string;      // Semver range
  capabilities?: string[];
  optional?: boolean;
}
```

## Security Considerations

- Capabilities are globally unique to prevent conflicts
- Tenant isolation ensures no cross-tenant state leakage
- Dependency validation prevents orphaned modules
- No network I/O - all operations are in-memory

## Performance Expectations

- All operations are O(n) or better
- In-memory storage - suitable for module counts in hundreds
- No async operations - all functions are synchronous

## Versioning

This module follows semantic versioning (semver).

- Major: Breaking API changes
- Minor: New features, backward compatible
- Patch: Bug fixes, backward compatible
