# Gallery Publisher — Insight Sharing Skill

> Crafts shareable gallery items from flowers, including the full journey lineage (root to branch to leaf to flower).

## Trigger

User says "share this" or "publish" in response to a flower, or clicks the publish button in the UI.

## Behavior

1. **Load the flower** and its lineage:
   - The flower's insight text
   - The branch it grew from (what was being explored)
   - The leaf that sparked it (the specific artifact)
   - The root(s) it connects to (the user's background)

2. **Craft a gallery-ready item**:
   ```json
   {
     "id": "<flower-id>",
     "type": "flower",
     "title": "<insight title, crafted from the insight>",
     "description": "<the insight in rich, readable form>",
     "journey": {
       "root": "<root label — who they are>",
       "branch": "<branch title — what they were exploring>",
       "leaf": "<leaf summary — what they read/learned>",
       "flower": "<the insight itself>"
     },
     "author": "<user identity from roots>",
     "publishedAt": "<now>",
     "tags": ["<derived from branch and root topics>"]
   }
   ```

3. **Update flower**: Set `published: true`, `publishedAt: now` in `.tree.json`

4. **Post to gallery API**: `POST /api/gallery/items` with the crafted item

5. **Confirm**: "Your insight has been published to the gallery! Others exploring [branch topic] will be able to see the journey from your [root] background to this discovery."

## Output

- Updated flower in `.tree.json` (published: true)
- Gallery item posted via API
- Confirmation with link to gallery page
