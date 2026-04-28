#!/usr/bin/env node
/**
 * Leaf Tracker — Stop Hook
 *
 * Runs at the end of a Claude Code session. Scans the vault for new files
 * written during the session (in leaves/, reviews/, assets/) and registers
 * them as leaf nodes on the Banyan Tree. When a branch accumulates 5+ leaves,
 * writes a synthesis-needed flag.
 *
 * Hook type: Stop
 */

const fs = require('fs');
const path = require('path');

const home = process.env.HOME || '/tmp';

try {
  // Read stdin (Claude Code sends session context as JSON)
  const input = fs.readFileSync(0, 'utf-8').trim() || '{}';
  const session = JSON.parse(input);

  // Load the tree
  const treePath = path.join(home, '.tree.json');
  if (!fs.existsSync(treePath)) {
    fs.writeSync(1, '');
    process.exit(0);
  }

  const tree = JSON.parse(fs.readFileSync(treePath, 'utf-8'));
  const existingLeafPaths = new Set((tree.leaves || []).map(l => l.filePath));
  let changed = false;

  // Scan known leaf directories for new files
  const leafDirs = ['leaves', 'reviews', 'assets', 'syntheses'];
  for (const dir of leafDirs) {
    const dirPath = path.join(home, dir);
    if (!fs.existsSync(dirPath)) continue;

    const scanDir = (d, prefix) => {
      const entries = fs.readdirSync(d, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(d, entry.name);
        const relativePath = prefix ? `${prefix}/${entry.name}` : `${dir}/${entry.name}`;

        if (entry.isDirectory()) {
          scanDir(fullPath, relativePath);
          continue;
        }

        if (!entry.name.endsWith('.md') && !entry.name.endsWith('.py') &&
            !entry.name.endsWith('.js') && !entry.name.endsWith('.ts')) continue;

        if (existingLeafPaths.has(relativePath)) continue;

        // New file — register as a leaf
        const ext = entry.name.split('.').pop().toLowerCase();
        const leafType = ['py', 'js', 'ts', 'tsx', 'jsx'].includes(ext) ? 'code'
          : ['mmd', 'mermaid'].includes(ext) ? 'diagram' : 'markdown';

        // Try to associate with a branch by directory name
        const branchSlug = prefix || dir;
        const matchingBranch = (tree.branches || []).find(b =>
          b.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').includes(branchSlug.split('/')[0]) ||
          branchSlug.includes(b.id)
        );

        const leaf = {
          id: require('crypto').randomUUID(),
          branchId: matchingBranch ? matchingBranch.id : (tree.branches[0]?.id || ''),
          type: leafType,
          filePath: relativePath,
          summary: entry.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
          createdAt: new Date().toISOString(),
        };

        tree.leaves = tree.leaves || [];
        tree.leaves.push(leaf);
        existingLeafPaths.add(relativePath);
        changed = true;
      }
    };

    scanDir(dirPath, '');
  }

  // Check if any branch has 5+ leaves — write synthesis flag
  if (changed) {
    const branchLeafCounts = {};
    for (const leaf of tree.leaves) {
      branchLeafCounts[leaf.branchId] = (branchLeafCounts[leaf.branchId] || 0) + 1;
    }

    for (const [branchId, count] of Object.entries(branchLeafCounts)) {
      if (count >= 5) {
        const flagPath = path.join(home, `.synthesis-needed-${branchId}`);
        if (!fs.existsSync(flagPath)) {
          fs.writeFileSync(flagPath, JSON.stringify({
            branchId,
            leafCount: count,
            triggeredAt: new Date().toISOString(),
          }));
        }
      }
    }

    tree.lastModified = new Date().toISOString();
    fs.writeFileSync(treePath, JSON.stringify(tree, null, 2));
  }

  // Stop hooks don't need to output anything
  fs.writeSync(1, '');
} catch (err) {
  // Never block on error
  try { fs.appendFileSync(path.join(home, '.hook-debug.log'), `[leaf-tracker] ${err.message}\n`); } catch {}
  fs.writeSync(1, '');
}
