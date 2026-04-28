# Tree Viewer — Reflection & Visualization Skill

> Generates reflective summaries of the user's knowledge tree and offers guided questions about growth, gaps, and connections.

## Trigger

- User says "show me my tree/garden/progress"
- Periodic reflection (weekly digest)
- Delegated from `gardener` during reflecting phase

## Behavior

1. **Load full tree state** from `.tree.json`

2. **Generate tree summary**:
   - Total nodes by type (roots, branches, leaves, flowers)
   - Most active branch (by leaf count and recency)
   - Branches with no leaves yet (dormant)
   - Branches approaching synthesis threshold (4+ leaves)
   - Recent flowers and their lineage

3. **Identify growth patterns**:
   - Which roots are feeding the most branches?
   - Are there roots with no branches? (untapped potential)
   - Are there branches with no root connections? (floating interests)
   - Cross-branch connections and clusters (knowledge molecules)

4. **Offer reflective questions**:
   - "Your [root] background is feeding 3 branches but your [other root] isn't connected to anything yet. Want to explore how [other root] might connect?"
   - "You have 5 leaves on [branch] — ready for a synthesis?"
   - "Your [branch] hasn't had any new leaves in a while. Want to revisit it or let it rest?"

5. **Suggest next explorations** based on gaps and connections

## Output

- Tree summary with stats and patterns (displayed in chat)
- Reflective questions personalized to the user's tree
- Suggested next branches or syntheses
- Triggers the Knowledge Map view in the UI context panel
