# webwaka-core-registry

**Type:** core  
**Version:** 0.2.0  
**Description:** Module registry and capability spine for WebWaka platform

## Overview

This is the **canonical Module Registry** for the WebWaka platform. It is the single source of truth for:

- What modules exist
- What capabilities they expose
- What dependencies they require
- Whether a module can be enabled/disabled per tenant

## Installation

```bash
# Install dependencies
yarn install

# Build TypeScript
yarn build

# Run tests
yarn test
```

## Usage

```typescript
import { ModuleRegistry, ModuleManifest } from 'webwaka-core-registry';

// Create registry instance
const registry = new ModuleRegistry();

// Define a module manifest
const manifest: ModuleManifest = {
  moduleId: 'webwaka-ext-hello',
  class: 'ext',
  version: '1.0.0',
  capabilities: [{
    id: 'hello:greet',
    name: 'Greet',
    description: 'Provides greeting functionality'
  }],
  dependencies: [],
  metadata: {
    name: 'Hello Module',
    description: 'A simple hello module',
    author: 'WebWaka Team',
    license: 'MIT'
  }
};

// 1. Validate manifest
const validation = registry.validateManifest(manifest);
if (!validation.valid) {
  console.error('Validation failed:', validation.errors);
}

// 2. Register module
const registered = await registry.registerModule(manifest);

// 3. Enable for tenant
await registry.enableModule('tenant-123', 'webwaka-ext-hello');

// 4. Resolve capability
const resolution = registry.resolveCapability('hello:greet');
console.log('Capability owner:', resolution.module.moduleId);

// 5. Disable module
await registry.disableModule('tenant-123', 'webwaka-ext-hello');
```

## API Reference

### Core Functions

| Function | Description |
|----------|-------------|
| `validateManifest(manifest)` | Validate a manifest against schema and rules |
| `registerModule(manifest)` | Register a module in the registry |
| `listModules()` | List all registered modules |
| `getModule(moduleId)` | Get a specific module |
| `resolveCapability(capabilityId)` | Resolve capability to owning module |

### Tenant Control

| Function | Description |
|----------|-------------|
| `enableModule(tenantId, moduleId)` | Enable module for tenant |
| `disableModule(tenantId, moduleId)` | Disable module for tenant |
| `isModuleEnabled(tenantId, moduleId)` | Check if module is enabled |
| `getEnabledModules(tenantId)` | Get all enabled modules |

## Module Manifest Schema

See `/schemas/module_manifest.schema.json` for the complete JSON Schema.

### Required Fields

- `moduleId`: Must match repo name (e.g., `webwaka-core-registry`)
- `class`: One of `core`, `suite`, `industry`, `ext`, `infra`
- `version`: Valid semver
- `capabilities`: Array of capability definitions
- `dependencies`: Array of module dependencies
- `metadata`: Module metadata (name, description, author, license)

## Documentation

- [Module Contract](./module.contract.md) - Detailed API and capability specifications
- [Changelog](./CHANGELOG.md) - Version history
- [Security Policy](./SECURITY.md) - Security guidelines
- [Owners](./OWNERS.md) - Maintainers and code review requirements

## Project Structure

```
├── src/
│   ├── index.ts              # Public API exports
│   ├── registry.ts           # Main ModuleRegistry class
│   ├── validator.ts          # Manifest validation
│   ├── capability-resolver.ts # Capability resolution
│   ├── tenant-control.ts     # Tenant enablement logic
│   ├── storage.ts            # Storage abstraction
│   └── types.ts              # TypeScript type definitions
├── schemas/
│   └── module_manifest.schema.json  # Canonical JSON Schema
├── tests/
│   └── registry.test.ts      # Comprehensive test suite
├── package.json
├── tsconfig.json
└── jest.config.js
```

## Contributing

This module follows the WebWaka architectural rules:
- All changes must go through pull requests
- CI/CD checks must pass before merging
- Manifest validation is enforced automatically

## License

MIT
