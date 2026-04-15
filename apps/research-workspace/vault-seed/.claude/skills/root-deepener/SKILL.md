# Root Deepener — Identity & Mastery Skill

> Infers and manages roots (the user's identity, background, and internalized knowledge). Handles onboarding and branch-to-root internalization.

## Trigger

- **Onboarding**: First conversation with a new user (no roots in `.tree.json`)
- **Internalization**: Delegated from `gardener` when mastery signals are detected for a branch

## Onboarding Behavior

1. **Ask warm, open questions** (not an interview):
   - "Tell me about yourself — what's your background?"
   - "What topics do you find yourself drawn to?"
   - "What do you already know well enough to teach?"

2. **Infer roots** from responses:
   - Explicit statements → `source: "stated"`, confidence 0.8-1.0
   - Implied from context → `source: "inferred"`, confidence 0.5-0.7

3. **Create root entries** in `.tree.json`

4. **Confirm**: "Based on our conversation, here's what I understand about your foundation: [roots list]. Does this feel right? What should I adjust?"

## Internalization Behavior

When mastery signals accumulate for a branch (tracked by `root-updater` hook):

1. **Check evidence** in `.root-signals.jsonl`:
   - User explained concept unprompted
   - Used domain vocabulary casually
   - Connected concept to other areas without help
   - Asked questions that presuppose understanding
   - Minimum 3 signals from different conversations

2. **Propose internalization**:
   - "I've noticed you've been explaining [branch topic] to me naturally and using it to reason about new problems. It seems like this has moved from something you were learning to something you understand deeply."
   - "Would you like to internalize this branch as a new root?"

3. **If confirmed**:
   - Change branch status to "rooted"
   - Create new root: `source: "internalized"`, `internalizedFrom: branch.id`
   - Create `internalized_as` connection
   - Branch visually curves downward through the ground line

## Output

- New or updated roots in `.tree.json`
- Connection edges for internalization
- Updated `.root-signals.jsonl`
