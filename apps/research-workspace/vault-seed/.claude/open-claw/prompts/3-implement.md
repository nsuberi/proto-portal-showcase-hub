# OpenClaw — Implement Phase

You are in the **IMPLEMENT** phase of an OpenClaw deep-dive loop.

**Topic:** {{TOPIC}}
**Description:** {{DESCRIPTION}}
**Output directory:** {{OUTPUT_DIR}}/implement/

## Prior Context

Read the outputs from previous phases:
- `{{OUTPUT_DIR}}/research/findings.md` — Research findings
- `{{OUTPUT_DIR}}/validate/validation-report.md` — Validation report with chosen approach and stack

## Objective

Implement a working demonstration of "{{TOPIC}}" based on the validated approach. Write real, runnable code — not pseudocode or stubs.

## Implementation Guidelines

1. **Follow the validation report** — Use the chosen stack, dependencies, and file structure from the validate phase

2. **Write clean, well-typed code**:
   - Use TypeScript if the stack allows it
   - Include type definitions for key interfaces
   - Use meaningful variable and function names
   - Add comments only where the logic isn't self-evident

3. **Include working examples**:
   - A main entry point that demonstrates the core concept
   - At least one non-trivial usage example
   - Console output or visual feedback showing it works

4. **Write tests**:
   - Unit tests for core functionality
   - At least one integration/behavior test
   - Tests should actually run and pass

5. **Handle errors gracefully**:
   - Validate inputs at boundaries
   - Provide clear error messages
   - Don't swallow errors silently

## Required Outputs

Write to `{{OUTPUT_DIR}}/implement/`:

### Source files in `src/`
- Main implementation file(s)
- Type definitions (if TypeScript)
- Entry point / demo script

### Test files
- `tests/` directory with test files
- Tests should be runnable with the chosen test framework

### Configuration
- `package.json` (or equivalent for the chosen language) with dependencies and scripts
- `tsconfig.json` if using TypeScript
- Any other config needed to run the code

## Quality Criteria

- The code must actually work if you install dependencies and run it
- Demonstrate the core concept clearly — someone reading the code should understand the technology
- Keep the implementation focused — don't add features beyond what the validation report scoped
- Tests should cover the happy path and at least one edge case
