---
description: "Start an OpenClaw deep-dive research loop"
argument-hint: "TOPIC [--description TEXT] [--max-iterations N]"
---

# OpenClaw — Start Deep-Dive Loop

Parse the arguments to extract:
- **TOPIC**: The technology or concept to research (required, all non-flag words)
- **--description**: Optional one-sentence description (defaults to the topic)
- **--max-iterations**: Optional iteration limit (defaults to 30)

Then:

1. Create the output directory: `open-claw-output/{topic-slug}/` with subdirectories: `research/`, `validate/`, `implement/`, `architecture/`, `package/`

2. Create the state file `.claude/open-claw.local.md`:

```yaml
---
active: true
topic: "{TOPIC}"
description: "{DESCRIPTION}"
phase: research
phase_index: 0
phases: ["research", "validate", "implement", "architecture", "package"]
iteration: 1
max_iterations: {MAX_ITERATIONS}
session_id: {current session}
output_dir: "open-claw-output/{topic-slug}"
started_at: "{ISO timestamp}"
---
```

3. Confirm activation:
```
OpenClaw deep dive activated.

Topic: {TOPIC}
Max iterations: {MAX_ITERATIONS}
Output: open-claw-output/{topic-slug}/

Starting research phase...
```

4. Read `.claude/open-claw/prompts/1-research.md` and begin the research phase, replacing `{{TOPIC}}`, `{{DESCRIPTION}}`, and `{{OUTPUT_DIR}}` with the values from the state file.
