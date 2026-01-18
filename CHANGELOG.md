# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-01-18

### Added

#### Phase 2 - Step 01: Module Registry & Capability Spine

- **Module Manifest Schema** (`/schemas/module_manifest.schema.json`)
  - Strict JSON Schema for validating `module.manifest.json` files
  - Required fields: moduleId, class, version, capabilities, dependencies, metadata
  - Validation rules for moduleId format, class prefix matching, semver, capability IDs

- **Registry Engine** (`/src/registry.ts`)
  - `validateManifest(manifest)` - Schema and business rule validation
  - `registerModule(manifest)` - Module registration with capability indexing
  - `listModules()` - List all registered modules
  - `getModule(moduleId)` - Get module by ID
  - `resolveCapability(capabilityId)` - Resolve capability to owning module

- **Capability Resolver** (`/src/capability-resolver.ts`)
  - Deterministic capability resolution
  - Fails hard on duplicate capabilities
  - Fails hard on unresolved capabilities
  - Used by permissions, routing, and feature gating

- **Tenant Control** (`/src/tenant-control.ts`)
  - `enableModule(tenantId, moduleId)` - Enable with dependency enforcement
  - `disableModule(tenantId, moduleId)` - Disable with dependent checking
  - Cannot enable without dependencies enabled
  - Cannot disable if dependents exist

- **Storage Abstraction** (`/src/storage.ts`)
  - `RegistryStorage` interface for future persistence
  - `InMemoryStorage` reference implementation

- **Comprehensive Test Suite** (`/tests/registry.test.ts`)
  - 34 tests covering all requirements
  - Invalid manifest rejection tests
  - Valid manifest registration tests
  - Duplicate capability rejection tests
  - Dependency enforcement tests
  - Tenant enable/disable rule tests
  - Hello module lifecycle demonstration (Hard Stop Condition)

### Changed

- Updated `module.manifest.json` with registry capabilities
- Updated `module.contract.md` with full API documentation

## [0.1.0] - 2026-01-18

### Added

- Initial commit with governance structure
- README.md, CHANGELOG.md, OWNERS.md, SECURITY.md
- module.manifest.json skeleton
- module.contract.md skeleton
- CI workflow for manifest validation
