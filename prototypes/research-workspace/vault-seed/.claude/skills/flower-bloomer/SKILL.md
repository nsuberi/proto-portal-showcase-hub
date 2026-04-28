# Flower Bloomer — Insight Capture Skill

> Detects when the user makes a personal connection or insight and captures it as a flower on their Banyan Tree.

## Trigger

Delegated from `gardener` when user message contains personal insight signals:
- "That's like..."
- "Oh wait, this is basically..."
- "This reminds me of..."
- "I just realized..."
- "The connection is..."
- Restating a concept in their own words using analogies from their roots

## Behavior

1. **Validate the insight**: Ensure this is a genuine personal connection, not just a factual restatement.

2. **Identify the lineage**:
   - Which root(s) does this connect to? (the "who you are" side)
   - Which branch does this come from? (the "what you're exploring" side)
   - Which specific leaf triggered it? (the artifact that sparked it)

3. **Craft the flower**:
   ```json
   {
     "id": "<uuid>",
     "branchId": "<branch that produced the insight>",
     "leafId": "<optional: specific leaf that triggered it>",
     "rootConnections": ["<root ids this connects to>"],
     "insight": "<the insight in the user's own words, refined>",
     "published": false,
     "createdAt": "<now>"
   }
   ```

4. **Save to vault**: Write `flowers/{flower-slug}.md` with the full insight including lineage context.

5. **Celebrate naturally**: "That's a beautiful connection. You've linked [root] to [branch] — [insight restatement]. This is the kind of insight that only someone with your background could make."

6. **Offer publishing**: "Would you like to share this insight to your gallery? Others exploring [branch topic] might find your perspective valuable."

## Output

- New flower entry in `.tree.json`
- Flower markdown in `flowers/`
- Connection edges from flower to root(s) and leaf
