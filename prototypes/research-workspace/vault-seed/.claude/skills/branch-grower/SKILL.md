# Branch Grower — Intention Creation Skill

> Creates and manages branches (active learning intentions) on the Banyan Tree. Asks follow-up questions to refine the intention and connects it to relevant roots.

## Trigger

Delegated from `gardener` when user expresses a learning intention.

## Behavior

1. **Parse the intention**: Extract the topic, scope, and depth the user wants.

2. **Check for related branches**: Look for existing branches that overlap or connect. Offer to:
   - Create a sub-branch (child of existing)
   - Create a sibling branch with a connection
   - Expand an existing branch

3. **Ask clarifying questions** (1-2 max):
   - "What specifically about [topic] interests you?"
   - "How does this connect to your work in [root]?"
   - "Are you looking for foundational understanding or practical application?"

4. **Create the branch** in `.tree.json`:
   ```json
   {
     "id": "<uuid>",
     "title": "<refined title>",
     "description": "<detailed description from conversation>",
     "status": "growing",
     "rootConnections": ["<matching root ids>"],
     "createdAt": "<now>",
     "lastActiveAt": "<now>"
   }
   ```

5. **Connect to roots**: Automatically link to roots whose labels are semantically related.

6. **Offer next steps**: "Would you like me to start researching this now, or schedule it for later?"

## Output

- Updated `.tree.json` with new branch
- Connection edges from roots to the new branch
- Conversational summary of what was created
