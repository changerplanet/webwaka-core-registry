# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-01-18

### Added
- **Module Manifest Schema** (`/schemas/module_manifest.schema.json`)
  - JSON Schema with strict validation
  - Module ID pattern: `^webwaka-(core|suite|industry|ext|infra)-[a-z0-9-]+$`
  - Semantic versioning enforcement
  - Capability, dependency, and metadata definitions
  - No unknown fields allowed (additionalProperties: false)

- **Validator Module** (`/src/validator.ts`)
  - `validateManifest()` - Full schema + business rule validation
  - `isValidModuleId()` - Module ID format validation
  - `isValidSemver()` - Semantic version validation
  - `isValidCapabilityId()` - Capability ID format validation
  - `extractModuleClass()` - Extract class from module ID

- **Registry Engine** (`/src/registry.ts`)
  - `registerModule()` - Register with dependency checking
  - `listModules()` - List all registered modules
  - `getModule()` - Get specific module by ID
  - `resolveCapability()` - Resolve capability to providing module
  - `listCapabilities()` - List all registered capabilities
  - `enableModule()` - Enable module for tenant with dependency enforcement
  - `disableModule()` - Disable with dependent checking
  - `getDependents()` - Get modules depending on a given module
  - `getDependencyOrder()` - Get dependency resolution order

- **Type Definitions** (`/src/types.ts`)
  - Complete TypeScript interfaces for all data structures
  - Full export of types for consuming modules

- **Test Suite** (`/tests/`)
  - Schema validation tests
  - Registry operation tests
  - Tenant enable/disable tests
  - **Hello Module lifecycle test** (HARD STOP verification)
  - 63 tests with 94%+ coverage

### Technical Details
- Pure TypeScript library (no UI, no servers, no databases)
- Deterministic operations
- In-memory data structures
- Full tenant isolation
- Globally unique capability enforcement

## [0.0.1] - 2026-01-17

### Added
- Initial repository structure
- Governance files (OWNERS.md, SECURITY.md)
- CI workflow for manifest validation
