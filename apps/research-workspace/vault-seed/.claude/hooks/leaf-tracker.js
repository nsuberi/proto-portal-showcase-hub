/**
 * Leaf Tracker Hook — PostToolUse (Write)
 *
 * Fires after every Write tool use. Checks if the written file is a leaf
 * artifact (in the leaves/ directory). If so, counts total leaves for that
 * branch. When count >= 5, writes a .synthesis-needed-{branchId} flag file
 * to signal the synthesis-trigger hook.
 *
 * Hook type: PostToolUse
 * Tool filter: Write
 */

const fs = require("fs");
const path = require("path");

module.exports = async function leafTracker({ toolName, toolInput, toolResult }) {
  if (toolName !== "Write") return;

  const filePath = toolInput.file_path || "";

  // Only track writes to leaves/ directory
  if (!filePath.includes("/leaves/")) return;

  // Extract branch slug from path: leaves/{branch-slug}/filename.md
  const parts = filePath.split("/");
  const leavesIdx = parts.indexOf("leaves");
  if (leavesIdx < 0 || leavesIdx + 1 >= parts.length) return;

  const branchSlug = parts[leavesIdx + 1];
  const leavesDir = parts.slice(0, leavesIdx + 2).join("/");

  // Count leaf files for this branch
  try {
    const files = fs.readdirSync(leavesDir).filter((f) => f.endsWith(".md"));
    const leafCount = files.length;

    console.log(
      `[leaf-tracker] Branch "${branchSlug}" now has ${leafCount} leaves`
    );

    // If >= 5 leaves, write synthesis-needed flag
    if (leafCount >= 5) {
      const flagPath = path.join(
        path.dirname(leavesDir),
        "..",
        `.synthesis-needed-${branchSlug}`
      );

      if (!fs.existsSync(flagPath)) {
        fs.writeFileSync(
          flagPath,
          JSON.stringify({
            branchSlug,
            leafCount,
            triggeredAt: new Date().toISOString(),
          })
        );
        console.log(
          `[leaf-tracker] Synthesis threshold reached for "${branchSlug}" (${leafCount} leaves)`
        );
      }
    }
  } catch (err) {
    // Directory might not exist yet during first write
    console.log(`[leaf-tracker] Could not count leaves: ${err.message}`);
  }
};
