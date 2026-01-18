# WebWaka Core Registry - PRD

## Original Problem Statement
Phase 2 - Step 01: Core Module Registry implementation for WebWaka Modular Rebuild.
Repository: https://github.com/changerplanet/webwaka-core-registry

## Tech Stack
- TypeScript (pure library, no framework/UI/DB/server)
- Jest for testing
- AJV for JSON Schema validation

## What's Been Implemented (2026-01-18)

### 1. Module Manifest Schema
- `/schemas/module_manifest.schema.json`
- Strict JSON Schema with additionalProperties: false
- Module ID pattern: `^webwaka-(core|suite|industry|ext|infra)-[a-z0-9-]+$`
- Semantic versioning enforcement
- Capability, dependency, and metadata definitions

### 2. Validator Module (`/src/validator.ts`)
- `validateManifest()` - Schema + business rule validation
- `isValidModuleId()` - Module ID format validation
- `isValidSemver()` - Semantic version validation
- `isValidCapabilityId()` - Capability ID format validation
- `extractModuleClass()` - Extract class from module ID

### 3. Registry Engine (`/src/registry.ts`)
- `registerModule()` - Register with dependency checking
- `listModules()` - List all registered modules
- `getModule()` - Get specific module by ID
- `resolveCapability()` - Resolve capability to module
- `listCapabilities()` - List all capabilities
- `enableModule()` - Enable module for tenant
- `disableModule()` - Disable with dependent checking
- `getDependents()` - Get dependent modules
- `getDependencyOrder()` - Get dependency resolution order

### 4. Test Suite (`/tests/`)
- 63 tests, 94%+ coverage
- Schema validation tests
- Registry operation tests
- Tenant enable/disable tests
- **HARD STOP CONDITION**: Hello Module lifecycle test ✅

## Core Requirements (Static)
- [x] Capabilities must be globally unique
- [x] Fail on duplicate or unresolved capabilities
- [x] Enforce dependency order
- [x] Prevent disabling module with dependents
- [x] Strict tenant isolation
- [x] Deterministic, auditable capability resolution

## Branch
- `phase2-step01-registry`

## Next Steps (Phase 2 - Step 02)
- ❌ DO NOT PROCEED without explicit authorization
- Await instructions for next phase
