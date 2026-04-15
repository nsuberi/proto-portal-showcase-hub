/**
 * Synthesis Trigger Hook — PostToolUse
 *
 * Checks for .synthesis-needed-{branchSlug} flag files after every tool use.
 * When found, queues a synthesis run by writing a .synthesis-queue-{branchSlug}
 * file. The gardener skill checks for queued syntheses and delegates to the
 * synthesizer skill.
 *
 * Hook type: PostToolUse
 * Tool filter: (any — checks on every tool completion)
 */

const fs = require("fs");
const path = require("path");

module.exports = async function synthesisTrigger({ toolName }) {
  // Only check periodically — after Write or Read operations
  if (toolName !== "Write" && toolName !== "Read") return;

  const vaultRoot = process.env.VAULT_ROOT || process.cwd();

  try {
    const entries = fs.readdirSync(vaultRoot);
    const synthesisFlags = entries.filter((f) =>
      f.startsWith(".synthesis-needed-")
    );

    for (const flag of synthesisFlags) {
      const branchSlug = flag.replace(".synthesis-needed-", "");
      const queueFile = path.join(vaultRoot, `.synthesis-queue-${branchSlug}`);
      const flagFile = path.join(vaultRoot, flag);

      // Skip if already queued
      if (fs.existsSync(queueFile)) continue;

      // Read the flag data
      const flagData = JSON.parse(fs.readFileSync(flagFile, "utf-8"));

      // Write queue entry
      fs.writeFileSync(
        queueFile,
        JSON.stringify({
          branchSlug,
          leafCount: flagData.leafCount,
          queuedAt: new Date().toISOString(),
          status: "pending",
        })
      );

      // Remove the trigger flag (consumed)
      fs.unlinkSync(flagFile);

      console.log(
        `[synthesis-trigger] Queued synthesis for "${branchSlug}" (${flagData.leafCount} leaves)`
      );
    }
  } catch (err) {
    // Vault root might not exist yet
    console.log(`[synthesis-trigger] Check skipped: ${err.message}`);
  }
};
