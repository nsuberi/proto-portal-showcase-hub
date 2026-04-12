import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';
import { existsSync, createReadStream, statSync } from 'fs';
import { glob } from 'glob';

const VAULT_ROOT = process.env.VAULT_ROOT || '/workspace';
const PORT = parseInt(process.env.PORT || '8080', 10);
const API_PREFIX = '/api/vault';

// The ALB forwards the full CloudFront path to the container.
// Strip this prefix so Express routes match (e.g. /healthz, /api/vault/*).
const VAULT_BASE_PATH = '/prototypes/research-workspace/vault';

const app = express();

// Strip the vault base path prefix from incoming requests
app.use((req, _res, next) => {
  if (req.url.startsWith(VAULT_BASE_PATH)) {
    req.url = req.url.slice(VAULT_BASE_PATH.length) || '/';
  }
  next();
});

app.use(express.json());
app.use(express.text({ type: 'text/*' }));

// --- Path Sanitization ---

function sanitizePath(userPath) {
  const resolved = path.resolve(VAULT_ROOT, userPath);
  if (!resolved.startsWith(VAULT_ROOT)) {
    return null; // directory traversal attempt
  }
  return resolved;
}

function pathMiddleware(req, res, next) {
  // Extract the file path from the URL after /api/vault/files/
  const filePath = req.params[0] || '';
  const absPath = sanitizePath(filePath);
  if (!absPath) {
    return res.status(400).json({ error: 'Invalid path' });
  }
  req.vaultPath = absPath;
  req.vaultRelPath = filePath;
  next();
}

// --- CORS ---

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// --- Health Check ---

app.get('/healthz', (req, res) => {
  res.json({ status: 'ok', vault: VAULT_ROOT });
});

// Root: redirect to workspace SPA after Cognito auth completes
app.get('/', (req, res) => {
  res.redirect('/prototypes/research-workspace/workspace');
});

// --- Directory Tree ---

async function buildTree(dirPath, basePath = '') {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const children = [];

  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name.startsWith('.')) continue; // skip hidden files

    const relPath = basePath ? `${basePath}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      const subtree = await buildTree(path.join(dirPath, entry.name), relPath);
      children.push({
        name: entry.name,
        path: relPath,
        type: 'directory',
        children: subtree,
      });
    } else {
      const stat = statSync(path.join(dirPath, entry.name));
      children.push({
        name: entry.name,
        path: relPath,
        type: 'file',
        size: stat.size,
        modified: stat.mtime.toISOString(),
      });
    }
  }

  return children;
}

app.get(`${API_PREFIX}/tree`, async (req, res, next) => {
  try {
    // Ensure vault root exists
    await fs.mkdir(VAULT_ROOT, { recursive: true });
    const children = await buildTree(VAULT_ROOT);
    res.json({ name: 'vault', type: 'directory', path: '', children });
  } catch (err) {
    next(err);
  }
});

// --- File CRUD ---

// Read file
app.get(`${API_PREFIX}/files/*`, pathMiddleware, async (req, res, next) => {
  try {
    if (!existsSync(req.vaultPath)) {
      return res.status(404).json({ error: 'File not found', path: req.vaultRelPath });
    }
    const stat = statSync(req.vaultPath);
    if (stat.isDirectory()) {
      return res.status(400).json({ error: 'Path is a directory' });
    }
    const content = await fs.readFile(req.vaultPath, 'utf-8');
    const ext = path.extname(req.vaultPath).toLowerCase();
    const contentType = ext === '.md' ? 'text/markdown' : 'text/plain';
    res.set('Content-Type', `${contentType}; charset=utf-8`);
    res.set('Last-Modified', stat.mtime.toUTCString());
    res.set('ETag', `"${stat.size}-${stat.mtimeMs}"`);
    res.send(content);
  } catch (err) {
    next(err);
  }
});

// Write/update file
app.put(`${API_PREFIX}/files/*`, pathMiddleware, async (req, res, next) => {
  try {
    const dir = path.dirname(req.vaultPath);
    await fs.mkdir(dir, { recursive: true });
    const content = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    await fs.writeFile(req.vaultPath, content, 'utf-8');
    const stat = statSync(req.vaultPath);
    res.json({
      path: req.vaultRelPath,
      size: stat.size,
      modified: stat.mtime.toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

// Create new file (409 if exists)
app.post(`${API_PREFIX}/files/*`, pathMiddleware, async (req, res, next) => {
  try {
    if (existsSync(req.vaultPath)) {
      return res.status(409).json({ error: 'File already exists', path: req.vaultRelPath });
    }
    const dir = path.dirname(req.vaultPath);
    await fs.mkdir(dir, { recursive: true });
    const content = typeof req.body === 'string' ? req.body : '';
    await fs.writeFile(req.vaultPath, content, 'utf-8');
    const stat = statSync(req.vaultPath);
    res.status(201).json({
      path: req.vaultRelPath,
      size: stat.size,
      modified: stat.mtime.toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

// Delete file
app.delete(`${API_PREFIX}/files/*`, pathMiddleware, async (req, res, next) => {
  try {
    if (!existsSync(req.vaultPath)) {
      return res.status(404).json({ error: 'File not found', path: req.vaultRelPath });
    }
    const stat = statSync(req.vaultPath);
    if (stat.isDirectory()) {
      await fs.rmdir(req.vaultPath); // only deletes empty dirs
    } else {
      await fs.unlink(req.vaultPath);
    }
    res.json({ deleted: req.vaultRelPath });
  } catch (err) {
    next(err);
  }
});

// Rename/move file
app.patch(`${API_PREFIX}/files/*`, pathMiddleware, async (req, res, next) => {
  try {
    const { newPath } = req.body;
    if (!newPath) {
      return res.status(400).json({ error: 'newPath is required' });
    }
    const absNewPath = sanitizePath(newPath);
    if (!absNewPath) {
      return res.status(400).json({ error: 'Invalid new path' });
    }
    await fs.mkdir(path.dirname(absNewPath), { recursive: true });
    await fs.rename(req.vaultPath, absNewPath);
    res.json({ from: req.vaultRelPath, to: newPath });
  } catch (err) {
    next(err);
  }
});

// --- Wiki-Link Graph ---

app.get(`${API_PREFIX}/links`, async (req, res, next) => {
  try {
    await fs.mkdir(VAULT_ROOT, { recursive: true });
    const mdFiles = await glob('**/*.md', { cwd: VAULT_ROOT });
    const nodes = new Map();
    const edges = [];

    for (const filePath of mdFiles) {
      const absPath = path.join(VAULT_ROOT, filePath);
      const content = await fs.readFile(absPath, 'utf-8');

      // Extract first heading as title
      const titleMatch = content.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1] : path.basename(filePath, '.md');

      nodes.set(filePath, { id: filePath, title, exists: true });

      // Extract [[wiki-links]]
      const linkRegex = /\[\[([^\]]+)\]\]/g;
      let match;
      while ((match = linkRegex.exec(content)) !== null) {
        const target = match[1];
        // Resolve to a .md path
        const targetPath = target.endsWith('.md') ? target : `${target}.md`;

        if (!nodes.has(targetPath)) {
          nodes.set(targetPath, {
            id: targetPath,
            title: target,
            exists: existsSync(path.join(VAULT_ROOT, targetPath)),
          });
        }

        edges.push({ source: filePath, target: targetPath });
      }
    }

    res.json({
      nodes: Array.from(nodes.values()),
      edges,
    });
  } catch (err) {
    next(err);
  }
});

// --- Search ---

app.get(`${API_PREFIX}/search`, async (req, res, next) => {
  try {
    const query = (req.query.q || '').toLowerCase();
    if (!query) {
      return res.json({ results: [] });
    }
    const mdFiles = await glob('**/*.md', { cwd: VAULT_ROOT });
    const results = [];

    for (const filePath of mdFiles) {
      const absPath = path.join(VAULT_ROOT, filePath);
      const content = await fs.readFile(absPath, 'utf-8');
      const lower = content.toLowerCase();
      const idx = lower.indexOf(query);

      if (idx !== -1) {
        // Extract a snippet around the match
        const start = Math.max(0, idx - 40);
        const end = Math.min(content.length, idx + query.length + 40);
        const snippet = content.slice(start, end).replace(/\n/g, ' ');
        results.push({ path: filePath, snippet: `...${snippet}...` });
      }
    }

    res.json({ results });
  } catch (err) {
    next(err);
  }
});

// --- Error Handler ---

app.use((err, req, res, next) => {
  console.error('[error]', err.message);
  res.status(500).json({ error: err.message });
});

// --- Start Server + WebSocket ---

const server = createServer(app);

// Terminal WebSocket
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  let pathname = url.pathname;

  // Strip vault base path prefix for WebSocket upgrades too
  if (pathname.startsWith(VAULT_BASE_PATH)) {
    pathname = pathname.slice(VAULT_BASE_PATH.length) || '/';
  }

  if (pathname === `${API_PREFIX}/terminal`) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

// Lazy import node-pty (native module)
let pty;
try {
  pty = await import('node-pty');
} catch (err) {
  console.warn('[terminal] node-pty not available:', err.message);
}

wss.on('connection', (ws) => {
  if (!pty) {
    ws.send('\r\n[Error: node-pty not available in this environment]\r\n');
    ws.close();
    return;
  }

  console.log('[terminal] New terminal session');

  const shell = pty.spawn('/bin/bash', [], {
    name: 'xterm-256color',
    cols: 80,
    rows: 24,
    cwd: VAULT_ROOT,
    env: {
      ...process.env,
      TERM: 'xterm-256color',
      HOME: VAULT_ROOT,
    },
  });

  shell.onData((data) => {
    try {
      ws.send(data);
    } catch (e) {
      // WebSocket closed
    }
  });

  ws.on('message', (msg) => {
    const str = msg.toString();
    // Handle resize messages
    if (str.startsWith('\x01')) {
      try {
        const { cols, rows } = JSON.parse(str.slice(1));
        shell.resize(cols, rows);
      } catch (e) {
        // Not a resize message, send to pty
        shell.write(str);
      }
    } else {
      shell.write(str);
    }
  });

  ws.on('close', () => {
    console.log('[terminal] Session closed');
    shell.kill();
  });

  shell.onExit(() => {
    try { ws.close(); } catch (e) { /* already closed */ }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[server] Research Workspace backend listening on port ${PORT}`);
  console.log(`[server] Vault root: ${VAULT_ROOT}`);
  console.log(`[server] API prefix: ${API_PREFIX}`);
});
