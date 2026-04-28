# Synthesizer — Cross-Leaf Synthesis Skill

> Finds patterns, gaps, and connections across leaves on a branch (or across branches). Produces synthesis documents with architecture diagrams.

## Trigger

Automatically triggered by the `synthesis-trigger` hook when a branch accumulates 5+ leaves, or manually by the user ("synthesize what I've learned").

## Behavior

1. **Gather leaves**: Read all leaf files for the target branch(es).

2. **Analyze patterns**:
   - Common themes across leaves
   - Contradictions or tensions between sources
   - Gaps in coverage (what hasn't been explored yet)
   - Connections to other branches

3. **Produce synthesis document**: `syntheses/{branch-slug}.md`
   - Executive summary (3-5 sentences)
   - Theme analysis with evidence from specific leaves
   - Architecture diagram (Mermaid) showing concept relationships
   - Knowledge gaps identified
   - Suggested next branches or deeper explorations

4. **Update tree**:
   - Add synthesis as a special leaf (type: "diagram")
   - Create connection edges between synthesized branches
   - Check if any branch has enough depth for internalization signal

5. **Report**: "I've synthesized your research on [branch]. Key finding: [one-liner]. I also noticed [gap] — want me to explore that?"

## Output

- Synthesis markdown in `syntheses/`
- Updated `.tree.json` connections
- Optional: new branch suggestions based on gaps discovered
