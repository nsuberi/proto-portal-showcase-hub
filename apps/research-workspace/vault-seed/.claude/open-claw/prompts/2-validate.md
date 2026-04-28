# OpenClaw — Validate Phase

You are in the **VALIDATE** phase of an OpenClaw deep-dive loop.

**Topic:** {{TOPIC}}
**Description:** {{DESCRIPTION}}
**Output directory:** {{OUTPUT_DIR}}/validate/

## Prior Context

Read the research outputs from the previous phase:
- `{{OUTPUT_DIR}}/research/findings.md` — Research findings
- `{{OUTPUT_DIR}}/research/sources.json` — Source references

## Objective

Validate that this concept can be implemented as a working demo. Choose a specific approach and assess feasibility before writing code.

## Validation Steps

1. **API / Library Availability** — Can we actually use this today? Check if the required APIs, libraries, or tools are available and stable.

2. **Environment Requirements** — What runtime, language version, or platform is needed? Are there browser compatibility concerns?

3. **Scope the Demo** — Define exactly what the demo will demonstrate:
   - What's the core behavior to showcase?
   - What's the simplest meaningful example?
   - What should be excluded to keep scope tight?

4. **Identify Risks** — What could go wrong during implementation?
   - API keys or authentication requirements?
   - Rate limits or paid services?
   - Complex build tooling?
   - Platform-specific limitations?

5. **Choose the Stack** — Based on the research and validation, decide:
   - Language/runtime (TypeScript/Node.js preferred, but match the domain)
   - Key dependencies (minimize — prefer standard library)
   - Build tooling (keep simple)
   - Test framework

## Required Output

Write to `{{OUTPUT_DIR}}/validate/`:

### validation-report.md

A structured feasibility assessment with sections:
- **Demo Scope** — Exactly what the demo will do (2-3 sentences)
- **Chosen Approach** — The specific implementation strategy with rationale
- **Technology Stack** — Language, runtime, dependencies, and why
- **Feasibility Assessment** — Green/Yellow/Red with explanation
- **Risks & Mitigations** — Known risks and how to handle them
- **File Structure Preview** — Expected project layout for the implementation phase
- **Success Criteria** — How to know the demo is "done" and working

## Quality Criteria

- Be honest about feasibility — if something won't work, say so and suggest alternatives
- Keep the demo scope tight — demonstrate the concept, don't build a production system
- Prefer well-documented, actively maintained dependencies
- If the concept requires external services (APIs, databases), note setup requirements
