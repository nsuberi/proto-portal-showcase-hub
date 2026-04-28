---
description: "Cancel an active OpenClaw deep-dive loop"
---

# Cancel OpenClaw

1. Check if `.claude/open-claw.local.md` exists
2. If **not found**: Say "No active OpenClaw loop found."
3. If **found**:
   - Read the file to get the current `phase` and `iteration` from the YAML frontmatter
   - Delete the file
   - Report: "Cancelled OpenClaw loop (was in {phase} phase, iteration {iteration}). Output artifacts remain in {output_dir}/."
