# webwaka-core-registry

**Type:** core  
**Description:** Module registry and platform skeleton for WebWaka modular architecture

## Status

✅ Phase 2 — Step 01 Complete

This module implements the canonical Module Registry & Capability Spine for WebWaka.

## Installation

```bash
npm install webwaka-core-registry
# or
yarn add webwaka-core-registry
```

## Quick Start

```typescript
import { ModuleRegistry, ModuleManifest } from 'webwaka-core-registry';

// Create a registry instance
const registry = new ModuleRegistry();

// Define a module manifest
const myModule: ModuleManifest = {
  moduleId: 'webwaka-suite-myapp',
  name: 'My App Suite',
  version: '1.0.0',
  class: 'suite',
  description: 'My application suite module',
  capabilities: [
    { id: 'my-feature', name: 'My Feature', description: 'Does something useful' }
  ],
  dependencies: [],
  metadata: {
    maintainers: [{ name: 'Me', email: 'me@example.com' }],
    license: 'MIT'
  }
};

// Validate the manifest
const validation = registry.validateManifest(myModule);
if (validation.valid) {
  // Register the module
  registry.registerModule(myModule);
  
  // Enable for a tenant
  registry.enableModule('tenant-123', 'webwaka-suite-myapp');
}
```

## Features

- **Schema Validation**: Strict JSON Schema validation with business rules
- **Capability Resolution**: Deterministic, globally unique capability mapping
- **Dependency Management**: Enforce registration and enable order
- **Tenant Isolation**: Per-tenant module state management
- **Type Safety**: Full TypeScript support with exported interfaces

## Documentation

- [Module Contract](./module.contract.md) - Defines the module's capabilities, dependencies, and API surface
- [Changelog](./CHANGELOG.md) - Version history and changes
- [Security Policy](./SECURITY.md) - Security guidelines and vulnerability reporting
- [Owners](./OWNERS.md) - Maintainers and code review requirements

## Module Manifest

See `module.manifest.json` for the complete module specification.

## API Reference

### Validator Functions

| Function | Description |
|----------|-------------|
| `validateManifest(manifest)` | Validates against schema and business rules |
| `isValidModuleId(id)` | Checks module ID format |
| `isValidSemver(version)` | Checks semantic version format |
| `isValidCapabilityId(id)` | Checks capability ID format |

### Registry Methods

| Method | Description |
|--------|-------------|
| `registerModule(manifest)` | Register a new module |
| `listModules()` | List all registered modules |
| `getModule(moduleId)` | Get a specific module |
| `resolveCapability(capabilityId)` | Resolve capability to module |
| `enableModule(tenantId, moduleId)` | Enable module for tenant |
| `disableModule(tenantId, moduleId)` | Disable module for tenant |

## Development

```bash
# Install dependencies
yarn install

# Build
yarn build

# Run tests
yarn test

# Run tests with coverage
yarn test --coverage
```

## Contributing

This module follows the WebWaka architectural rules:
- All changes must go through pull requests
- CI/CD checks must pass before merging
- Manifest validation is enforced automatically

## License

MIT
