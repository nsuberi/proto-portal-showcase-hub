# OpenClaw — Package Phase

You are in the **PACKAGE** phase of an OpenClaw deep-dive loop.

**Topic:** {{TOPIC}}
**Description:** {{DESCRIPTION}}
**Output directory:** {{OUTPUT_DIR}}/package/

## Prior Context

Read the outputs from ALL previous phases:
- `{{OUTPUT_DIR}}/research/findings.md` — Research findings
- `{{OUTPUT_DIR}}/research/sources.json` — Sources
- `{{OUTPUT_DIR}}/validate/validation-report.md` — Validation
- `{{OUTPUT_DIR}}/implement/` — Implementation code
- `{{OUTPUT_DIR}}/architecture/architecture.md` — Architecture docs

## Objective

Assemble a complete, standalone repository in `{{OUTPUT_DIR}}/package/` that someone could clone and run to understand "{{TOPIC}}". This is the final deliverable — it should be polished and self-contained.

## Required Outputs

Write to `{{OUTPUT_DIR}}/package/`:

### README.md
A comprehensive README with:
- **Title** — Clear name for the demo
- **What This Demonstrates** — 1-2 paragraph explanation of the concept
- **Quick Start** — How to install and run in under 5 commands
- **How It Works** — Brief technical explanation with link to architecture docs
- **Key Concepts** — Bullet list of the important things to understand
- **Project Structure** — File tree with one-line descriptions
- **Further Reading** — Links to the best sources from the research phase
- **License** — MIT

### package.json (or equivalent)
- Name, version, description
- Scripts: `start`, `test`, `build` (as appropriate)
- Dependencies from the implementation phase
- Appropriate engine/runtime requirements

### Source Code
Copy and organize the implementation from `{{OUTPUT_DIR}}/implement/`:
- `src/` — Main source files
- `tests/` — Test files
- Entry point script

### Documentation
- `docs/architecture.md` — Copy from the architecture phase
- Any additional docs needed to understand the project

### Configuration
- `tsconfig.json` (if TypeScript)
- `.gitignore` — Standard ignores for the chosen stack
- Any other config needed

## Quality Criteria

- Someone should be able to `git clone` this, run the install command, and see it work
- The README should be good enough to understand the project without reading the code
- All file paths should be correct and relative to the package root
- No dangling references to files outside the package directory
- The package should be self-contained — not depend on the monorepo structure
