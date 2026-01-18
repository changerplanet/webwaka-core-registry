# WebWaka Core Registry - PRD

## Original Problem Statement

Build the canonical Module Registry & Capability Spine for the WebWaka platform as Phase 2 — Step 01 of the WebWaka Modular Rebuild.

**Repository:** changerplanet/webwaka-core-registry  
**Branch:** main  
**Technology:** TypeScript only (no framework, no HTTP server, no database)

### Core Requirements

1. **Module Manifest Schema** - JSON Schema at `/schemas/module_manifest.schema.json`
2. **Registry Engine** - validateManifest, registerModule, listModules, resolveCapability, getModule
3. **Capability Resolver** - Deterministic resolution, fail on duplicates/unresolved
4. **Tenant Control** - enableModule, disableModule with dependency enforcement
5. **Tests** - Prove all validation and dependency rules
6. **Hard Stop Condition** - Hello module lifecycle demonstration

## User Personas

- **Platform Engineers** - Use registry to register and manage modules
- **Tenant Administrators** - Enable/disable modules per tenant
- **Module Developers** - Create modules following manifest schema

## What's Been Implemented

### 2026-01-18: Phase 2 — Step 01 Complete

- ✅ Module Manifest Schema (`/schemas/module_manifest.schema.json`)
- ✅ Registry Engine with all core functions
- ✅ Capability Resolver with duplicate detection
- ✅ Tenant Control with dependency safety
- ✅ Storage interface abstraction
- ✅ 34 passing tests
- ✅ Hard Stop Condition demonstrated
- ✅ CI workflow updated

### Files Created

- `/src/types.ts`, `/src/storage.ts`, `/src/validator.ts`
- `/src/capability-resolver.ts`, `/src/tenant-control.ts`
- `/src/registry.ts`, `/src/index.ts`
- `/tests/registry.test.ts`
- `/schemas/module_manifest.schema.json`
- `package.json`, `tsconfig.json`, `jest.config.js`
- `PHASE2_STEP01_COMPLETION_REPORT.md`

### Files Updated

- `module.manifest.json` - Added 4 registry capabilities
- `module.contract.md` - Full API documentation
- `README.md` - Usage guide
- `CHANGELOG.md` - v0.2.0 release
- `.github/workflows/ci.yml` - Build + test jobs

## Prioritized Backlog

### P0 - Blocked (Awaiting Authorization)
- Phase 2 — Step 02: Identity module

### P1 - Future Steps
- Permissions module
- Audit module
- Receipts module
- Payments module

### P2 - Enhancements
- Persistent storage implementation (MongoDB/PostgreSQL)
- Module versioning and upgrade paths
- Dependency version resolution (semver ranges)

## Next Tasks

⛔ **STOP** — Wait for explicit authorization for Phase 2 — Step 02
