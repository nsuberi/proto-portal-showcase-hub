---
name: open-claw
description: "Offer structured deep-dive research when a conversation touches on a technology or concept that would benefit from thorough investigation, working code, and architecture documentation. Triggers: user asks about an unfamiliar technology, discusses 'how does X work', explores implementation patterns, says 'I want to understand X deeply', 'research this', 'build me a demo of', or any request that would benefit from structured research → validation → implementation → documentation."
---

# OpenClaw — Deep-Dive Research Loop

When a conversation topic would benefit from structured research, offer:

> "Would you like me to do a deep dive on this? I'll research it, validate the approach, implement working code, create architecture diagrams, and package it as a standalone demo repo."

## Starting the Loop

If the user agrees:

1. **Create the state file** `.claude/open-claw.local.md` with this YAML frontmatter:

```yaml
---
active: true
topic: "<the concept or technology>"
description: "<one-sentence description of what to research and build>"
phase: research
phase_index: 0
phases: ["research", "validate", "implement", "architecture", "package"]
iteration: 1
max_iterations: 30
session_id: <current session id>
output_dir: "open-claw-output/<topic-slug>"
started_at: "<ISO timestamp>"
---
```

2. **Create the output directory** structure:
```
open-claw-output/<topic-slug>/
  research/
  validate/
  implement/
  architecture/
  package/
```

3. **Begin the research phase** immediately by reading the prompt template from `.claude/open-claw/prompts/1-research.md` and following its instructions.

## Phase Flow

The Stop hook (`type: "agent"`) manages transitions automatically. After completing each phase's required outputs, the hook advances to the next phase.

| Phase | Goal | Required Outputs |
|-------|------|------------------|
| 1. Research | Deep research via WebSearch/WebFetch | `research/findings.md`, `research/sources.json` |
| 2. Validate | Feasibility check, approach selection | `validate/validation-report.md` |
| 3. Implement | Working code with types and tests | `implement/src/` (source files) |
| 4. Architecture | Mermaid diagrams documenting the system | `architecture/architecture.md` |
| 5. Package | Assemble standalone repo with README | `package/README.md`, `package/package.json` |

All outputs go in the `output_dir` specified in the state file.

## During Each Phase

- Read the phase prompt template from `.claude/open-claw/prompts/{N}-{phase}.md`
- Replace `{{TOPIC}}`, `{{DESCRIPTION}}`, `{{OUTPUT_DIR}}` with values from the state file
- For phases after research, also read prior phase outputs for context
- Write all artifacts to the appropriate phase subdirectory
- When the phase requirements are met, the Stop hook will detect this and advance

## Completion

When all 5 phases are complete, the Stop hook deletes the state file and allows the session to stop normally. Present the results conversationally:

- Summarize what was researched and built
- Point to the output directory
- Highlight key findings and architectural decisions

## Cancellation

The user can cancel at any time by saying "cancel the deep dive" or running `/cancel-open-claw`. This deletes `.claude/open-claw.local.md`.
