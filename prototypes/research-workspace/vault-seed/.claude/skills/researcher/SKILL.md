# Researcher — Deep Research Skill

> Spawns parallel sub-agents to research a branch from multiple angles. Produces leaf artifacts (markdown reviews, code samples, diagrams) that attach to the branch.

## Trigger

Delegated from `gardener` when user confirms they want to research a branch.

## Behavior

1. **Read the branch**: Load the branch from `.tree.json`, understand its title, description, and root connections.

2. **Spawn 3 parallel sub-agents**:

   | Agent | Focus | Output |
   |-------|-------|--------|
   | Foundations | Core concepts, key papers, definitions | `leaves/{branch-slug}/foundations.md` |
   | Personal Connections | How this relates to the user's roots | `leaves/{branch-slug}/connections.md` |
   | Practical Applications | Code examples, tools, hands-on guides | `leaves/{branch-slug}/practical.md` |

3. **Each sub-agent**:
   - Uses `WebSearch` and `WebFetch` to find current information
   - Writes a structured markdown document with citations
   - Includes Mermaid diagrams where architecture is relevant
   - References the user's roots for personal context

4. **After all agents complete**:
   - Write a summary leaf: `leaves/{branch-slug}/summary.md`
   - Update `.tree.json` with new leaf entries
   - Update the branch's `lastActiveAt` timestamp

5. **Report results** conversationally: "I've grown 4 new leaves on your [branch title] branch. The most interesting finding was..."

## Sub-Agent Prompt Template

```
You are researching "{branch.title}" for a user whose background includes:
{roots.map(r => `- ${r.label}`).join('\n')}

Focus area: {agent_focus}
Branch description: {branch.description}

Write a thorough review in markdown format. Include:
- Key concepts and definitions
- Important papers or references (with links if available)
- How this connects to the user's background
- Mermaid diagrams for any architectural concepts

Save your output to: leaves/{branch-slug}/{focus-area}.md
```

## Output

- 3-4 new leaf files in `leaves/{branch-slug}/`
- Updated `.tree.json` with leaf entries and connections
- The `leaf-tracker` hook will fire after each Write, potentially triggering synthesis
