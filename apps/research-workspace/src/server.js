import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';
import { existsSync, createReadStream, statSync } from 'fs';
import { glob } from 'glob';
import { randomUUID } from 'crypto';

const VAULT_ROOT = process.env.VAULT_ROOT || '/workspace';
const PORT = parseInt(process.env.PORT || '8080', 10);
const API_PREFIX = '/api/vault';

// The ALB forwards the full CloudFront path to the container.
const VAULT_BASE_PATH = '/prototypes/research-workspace/vault';

// Default user for dev mode (no ALB/Cognito)
const DEV_USER = { userId: 'dev-local', userEmail: 'dev@localhost' };

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

// --- User Identity Middleware ---
// Parses Cognito JWT from ALB x-amzn-oidc-data header for per-user isolation.

function parseUserIdentity(req) {
  const jwt = req.headers['x-amzn-oidc-data'];
  if (jwt) {
    try {
      const parts = jwt.split('.');
      if (parts.length >= 2) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
        return {
          userId: payload.sub || payload.username || 'unknown',
          userEmail: payload.email || '',
        };
      }
    } catch {
      // Malformed JWT — fall through to default
    }
  }
  return DEV_USER;
}

app.use((req, _res, next) => {
  const identity = parseUserIdentity(req);
  req.userId = identity.userId;
  req.userEmail = identity.userEmail;
  next();
});

// --- Per-User Vault Roots ---
// Each user gets an isolated directory under VAULT_ROOT/vaults/{userId}/

function getUserVaultRoot(userId) {
  return path.join(VAULT_ROOT, 'vaults', userId);
}

const initializedVaults = new Set();

async function ensureUserVault(userId) {
  const vaultDir = getUserVaultRoot(userId);
  if (!initializedVaults.has(userId)) {
    if (!existsSync(vaultDir)) {
      await fs.mkdir(vaultDir, { recursive: true });
      await fs.writeFile(path.join(vaultDir, 'README.md'),
        '# My Research Vault\n\nWelcome to your personal research workspace.\n');
      console.log(`[vault] Created vault for user ${userId}`);
    }
    // Initialize Claude Code config + harden permissions (once per session)
    await initClaudeCodeConfig(vaultDir).catch(err =>
      console.warn(`[init] Config init failed for ${userId}:`, err.message));
    // Clear old activity log so all events have runId tagging
    const activityLog = path.join(vaultDir, '.tool-activity.jsonl');
    if (existsSync(activityLog)) {
      await fs.unlink(activityLog).catch(() => {});
      console.log(`[init] Cleared activity log for ${userId}`);
    }
    await hardenUserVault(vaultDir).catch(() => {});
    initializedVaults.add(userId);
  }
  return vaultDir;
}

// --- Clean Environment for Spawned Processes ---
// Remove sensitive variables so Claude Code uses per-user OAuth, not shared API key.

function getCleanEnv(userVaultRoot) {
  const env = { ...process.env };
  delete env.ANTHROPIC_API_KEY;
  delete env.AWS_ACCESS_KEY_ID;
  delete env.AWS_SECRET_ACCESS_KEY;
  delete env.AWS_SESSION_TOKEN;
  env.HOME = userVaultRoot;
  env.TERM = 'xterm-256color';
  // Skip the "do you trust this folder?" prompt — the vault is a controlled,
  // per-user server environment; trust is implicit via Cognito auth.
  env.CLAUDE_CODE_SANDBOXED = '1';
  return env;
}

// --- Path Sanitization (scoped to user vault) ---

function sanitizePath(userVaultRoot, userPath) {
  const resolved = path.resolve(userVaultRoot, userPath);
  if (!resolved.startsWith(userVaultRoot)) {
    return null; // directory traversal attempt
  }
  return resolved;
}

function pathMiddleware(req, res, next) {
  const filePath = req.params[0] || '';
  const userVault = getUserVaultRoot(req.userId);
  const absPath = sanitizePath(userVault, filePath);
  if (!absPath) {
    return res.status(400).json({ error: 'Invalid path' });
  }
  req.vaultPath = absPath;
  req.vaultRelPath = filePath;
  req.userVault = userVault;
  next();
}

// --- Vault Size Enforcement ---
// Prevents EFS storage abuse by checking per-user vault size before writes.
// Complements infrastructure-level CloudWatch alarms on EFS StorageBytes.

const MAX_VAULT_SIZE_BYTES = parseInt(process.env.MAX_VAULT_SIZE_MB || '1024', 10) * 1024 * 1024;
const vaultSizeCache = new Map();
const VAULT_SIZE_CACHE_TTL = 60_000;

async function getVaultSize(vaultDir) {
  let total = 0;
  async function walk(dir) {
    let entries;
    try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else {
        try { total += (await fs.stat(fullPath)).size; } catch { /* skip */ }
      }
    }
  }
  await walk(vaultDir);
  return total;
}

async function checkVaultSize(userId, userVault, additionalBytes = 0) {
  const cached = vaultSizeCache.get(userId);
  const now = Date.now();
  let currentSize;
  if (cached && (now - cached.timestamp) < VAULT_SIZE_CACHE_TTL) {
    currentSize = cached.size;
  } else {
    currentSize = await getVaultSize(userVault);
    vaultSizeCache.set(userId, { size: currentSize, timestamp: now });
  }
  if (currentSize + additionalBytes > MAX_VAULT_SIZE_BYTES) {
    return {
      allowed: false,
      currentMB: Math.round(currentSize / 1024 / 1024),
      limitMB: Math.round(MAX_VAULT_SIZE_BYTES / 1024 / 1024),
    };
  }
  return { allowed: true };
}

function invalidateVaultSizeCache(userId) {
  vaultSizeCache.delete(userId);
}

// --- CORS ---

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// --- Shared auth process reference (accessible from both WS and REST) ---
let pendingAuthProcess = null;

// --- Health Check ---

app.get('/healthz', (req, res) => {
  res.json({ status: 'ok', vault: VAULT_ROOT });
});

// Root: redirect to workspace SPA after Cognito auth completes
app.get('/', (req, res) => {
  res.redirect('/prototypes/research-workspace/workspace');
});

// --- Auth Code REST endpoint (fallback when WebSocket drops) ---
app.post(`${API_PREFIX}/auth-code`, (req, res) => {
  const { code } = req.body || {};
  if (!code) {
    return res.status(400).json({ error: 'code is required' });
  }
  if (!pendingAuthProcess || !pendingAuthProcess.stdin.writable) {
    return res.status(409).json({ error: 'No auth process waiting for a code. Start /login first.' });
  }
  console.log('[auth] Writing auth code via REST endpoint');
  pendingAuthProcess.stdin.write(code.trim() + '\n');
  res.json({ status: 'ok', message: 'Code submitted. Check auth status.' });
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
    const userVault = await ensureUserVault(req.userId);
    const children = await buildTree(userVault);
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
    const content = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const sizeCheck = await checkVaultSize(req.userId, req.userVault, Buffer.byteLength(content));
    if (!sizeCheck.allowed) {
      return res.status(413).json({
        error: 'Vault size limit exceeded',
        currentMB: sizeCheck.currentMB,
        limitMB: sizeCheck.limitMB,
      });
    }
    const dir = path.dirname(req.vaultPath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(req.vaultPath, content, 'utf-8');
    invalidateVaultSizeCache(req.userId);
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
    const content = typeof req.body === 'string' ? req.body : '';
    const sizeCheck = await checkVaultSize(req.userId, req.userVault, Buffer.byteLength(content));
    if (!sizeCheck.allowed) {
      return res.status(413).json({
        error: 'Vault size limit exceeded',
        currentMB: sizeCheck.currentMB,
        limitMB: sizeCheck.limitMB,
      });
    }
    const dir = path.dirname(req.vaultPath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(req.vaultPath, content, 'utf-8');
    invalidateVaultSizeCache(req.userId);
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
    invalidateVaultSizeCache(req.userId);
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
    const absNewPath = sanitizePath(req.userVault, newPath);
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

// Create empty folder
app.post(`${API_PREFIX}/folders/*`, pathMiddleware, async (req, res, next) => {
  try {
    if (existsSync(req.vaultPath)) {
      return res.status(409).json({ error: 'Folder already exists', path: req.vaultRelPath });
    }
    await fs.mkdir(req.vaultPath, { recursive: true });
    res.status(201).json({ path: req.vaultRelPath, type: 'directory' });
  } catch (err) {
    next(err);
  }
});

// --- Wiki-Link Graph ---

app.get(`${API_PREFIX}/links`, async (req, res, next) => {
  try {
    const userVault = await ensureUserVault(req.userId);
    const mdFiles = await glob('**/*.md', { cwd: userVault });
    const nodes = new Map();
    const edges = [];

    for (const filePath of mdFiles) {
      const absPath = path.join(userVault, filePath);
      const content = await fs.readFile(absPath, 'utf-8');
      const titleMatch = content.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1] : path.basename(filePath, '.md');
      nodes.set(filePath, { id: filePath, title, exists: true });

      const linkRegex = /\[\[([^\]]+)\]\]/g;
      let match;
      while ((match = linkRegex.exec(content)) !== null) {
        const target = match[1];
        const targetPath = target.endsWith('.md') ? target : `${target}.md`;
        if (!nodes.has(targetPath)) {
          nodes.set(targetPath, {
            id: targetPath,
            title: target,
            exists: existsSync(path.join(userVault, targetPath)),
          });
        }
        edges.push({ source: filePath, target: targetPath });
      }
    }

    res.json({ nodes: Array.from(nodes.values()), edges });
  } catch (err) {
    next(err);
  }
});

// --- Search ---

app.get(`${API_PREFIX}/search`, async (req, res, next) => {
  try {
    const query = (req.query.q || '').toLowerCase();
    if (!query) return res.json({ results: [] });
    const userVault = getUserVaultRoot(req.userId);
    const mdFiles = await glob('**/*.md', { cwd: userVault });
    const results = [];

    for (const filePath of mdFiles) {
      const absPath = path.join(userVault, filePath);
      const content = await fs.readFile(absPath, 'utf-8');
      const idx = content.toLowerCase().indexOf(query);
      if (idx !== -1) {
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

// --- Published Content (shared across users, persisted on EFS) ---
// Stores a non-editable snapshot of a vault file in /workspace/published/.
// The gallery page reads from these endpoints (no per-user scoping).

const PUBLISHED_DIR = path.join(VAULT_ROOT, 'published');

async function ensurePublishedDir() {
  if (!existsSync(PUBLISHED_DIR)) {
    await fs.mkdir(PUBLISHED_DIR, { recursive: true });
    console.log('[vault] Created shared published directory');
  }
}

// POST /api/vault/publish — publish a vault file to the shared gallery
app.post(`${API_PREFIX}/publish`, async (req, res, next) => {
  try {
    await ensurePublishedDir();
    const userVault = await ensureUserVault(req.userId);
    const { filePath, title, summary, type, tags, domains, markdown } = req.body;

    if (!filePath && !markdown) {
      return res.status(400).json({ error: 'filePath or markdown required' });
    }

    // Read content from vault file if markdown not provided inline
    let content = markdown;
    if (!content && filePath) {
      const absPath = sanitizePath(userVault, filePath);
      if (!absPath || !existsSync(absPath)) {
        return res.status(404).json({ error: 'File not found in vault' });
      }
      content = await fs.readFile(absPath, 'utf-8');
    }

    // Generate stable id from filePath or content hash
    const stableSlug = (filePath || 'untitled')
      .replace(/[^a-z0-9]/gi, '-').toLowerCase().replace(/-+/g, '-');
    const id = `pub-${req.userId}-${stableSlug}`;
    const now = new Date().toISOString();

    // Auto-extract title/summary from markdown if not provided
    const extractedTitle = title?.trim()
      || content.match(/^#\s+(.+)$/m)?.[1]?.trim()
      || (filePath || 'Untitled').split('/').pop().replace(/\.\w+$/, '').replace(/[-_]/g, ' ');
    const extractedSummary = summary?.trim()
      || content.split('\n').find(l => l.trim() && !l.startsWith('#') && !l.startsWith('---'))?.trim().slice(0, 200)
      || 'Published from workspace';

    const item = {
      id,
      title: extractedTitle,
      summary: extractedSummary,
      type: type || 'insight',
      date: now.slice(0, 10),
      publishedAt: now,
      tags: tags || ['published'],
      domains: domains || [],
      status: 'published',
      author: req.userEmail || req.userId,
      contentPath: filePath || null,
    };

    // Write non-editable snapshot to EFS: metadata + content in one JSON file
    const entry = { item, markdown: content };
    await fs.writeFile(
      path.join(PUBLISHED_DIR, `${id}.json`),
      JSON.stringify(entry, null, 2),
      'utf-8'
    );

    // Best-effort forward to Lambda API for public gallery access
    // (vault server is behind Cognito, so unauthenticated gallery visitors
    // need the Lambda API to read published content)
    const lambdaApiBase = process.env.LAMBDA_API_URL || 'https://portfolio.cookinupideas.com/api/v1';
    const apiKey = process.env.CLIENT_API_KEY || '';
    if (apiKey) {
      fetch(`${lambdaApiBase}/research-workspace/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({
          type: item.type,
          title: item.title,
          summary: item.summary,
          contentPath: item.contentPath,
          tags: item.tags,
          domains: item.domains,
          markdown: content,
        }),
      }).then(r => {
        if (r.ok) console.log(`[publish] Forwarded to Lambda API: ${id}`);
        else console.warn(`[publish] Lambda API forward failed: HTTP ${r.status}`);
      }).catch(err => {
        console.warn(`[publish] Lambda API forward error: ${err.message}`);
      });
    }

    console.log(`[publish] ${req.userId} published "${extractedTitle}" as ${id}`);
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

// GET /api/vault/published — list all published items (metadata only)
app.get(`${API_PREFIX}/published`, async (_req, res, next) => {
  try {
    await ensurePublishedDir();
    const files = await fs.readdir(PUBLISHED_DIR);
    const items = [];
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      try {
        const raw = await fs.readFile(path.join(PUBLISHED_DIR, file), 'utf-8');
        const entry = JSON.parse(raw);
        if (entry.item) items.push(entry.item);
      } catch {
        // Skip corrupted files
      }
    }
    // Sort by date descending
    items.sort((a, b) => (b.publishedAt || b.date || '').localeCompare(a.publishedAt || a.date || ''));
    res.json({ items, count: items.length });
  } catch (err) {
    next(err);
  }
});

// GET /api/vault/published/:id — get a single published item with markdown
app.get(`${API_PREFIX}/published/:id`, async (req, res, next) => {
  try {
    const filePath = path.join(PUBLISHED_DIR, `${req.params.id}.json`);
    if (!existsSync(filePath)) {
      return res.status(404).json({ error: 'Published item not found' });
    }
    const raw = await fs.readFile(filePath, 'utf-8');
    const entry = JSON.parse(raw);
    res.json(entry);
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

// Run terminal WebSocket (streams PTY output for background runs)
const runWss = new WebSocketServer({ noServer: true });

// Chat WebSocket (Claude Code integration)
const chatWss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  let pathname = url.pathname;

  // Strip vault base path prefix for WebSocket upgrades too
  if (pathname.startsWith(VAULT_BASE_PATH)) {
    pathname = pathname.slice(VAULT_BASE_PATH.length) || '/';
  }

  // Match /api/vault/runs/:id/ws for run terminals
  const runWsMatch = pathname.match(new RegExp(`^${API_PREFIX}/runs/([^/]+)/ws$`));

  if (pathname === `${API_PREFIX}/terminal`) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else if (runWsMatch) {
    const runId = runWsMatch[1];
    runWss.handleUpgrade(request, socket, head, (ws) => {
      runWss.emit('connection', ws, runId, request);
    });
  } else if (pathname === `${API_PREFIX}/chat`) {
    chatWss.handleUpgrade(request, socket, head, (ws) => {
      chatWss.emit('connection', ws, request);
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

wss.on('connection', async (ws, request) => {
  if (!pty) {
    ws.send('\r\n[Error: node-pty not available in this environment]\r\n');
    ws.close();
    return;
  }

  // Parse user identity from the upgrade request headers
  const identity = parseUserIdentity(request);
  const userVault = await ensureUserVault(identity.userId);
  console.log(`[terminal] New session for user ${identity.userId}`);

  const shell = pty.spawn('claude', ['--dangerously-skip-permissions'], {
    name: 'xterm-256color',
    cols: 80,
    rows: 24,
    cwd: userVault,
    env: getCleanEnv(userVault),
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

// --- Chat WebSocket Handler (Claude Code integration) ---

chatWss.on('connection', async (ws, request) => {
  const chatIdentity = parseUserIdentity(request);
  const chatUserVault = await ensureUserVault(chatIdentity.userId);
  console.log(`[chat] New session for user ${chatIdentity.userId}`);
  let sessionId = null;
  let activeProcess = null;

  // Keep-alive ping every 30s to prevent ALB idle timeout
  const pingInterval = setInterval(() => {
    if (ws.readyState === 1) {
      ws.ping();
    }
  }, 30000);

  ws.on('pong', () => { /* connection alive */ });

  function sendEvent(event) {
    try {
      if (ws.readyState === 1) { // WebSocket.OPEN
        ws.send(JSON.stringify(event));
      }
    } catch {
      // WebSocket closed
    }
  }

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      sendEvent({ type: 'error', message: 'Invalid JSON' });
      return;
    }

    // Handle auth request — spawns `claude auth login` and captures the URL
    if (msg.type === 'auth') {
      if (activeProcess) {
        sendEvent({ type: 'error', message: 'Please wait for the current operation to finish.' });
        return;
      }

      console.log('[chat] Starting auth flow');
      const authProc = spawn('claude', ['auth', 'login', '--claudeai'], {
        cwd: chatUserVault,
        env: getCleanEnv(chatUserVault),
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      activeProcess = authProc;
      pendingAuthProcess = authProc; // Share ref for REST fallback

      // Keep stdin OPEN — the auth process needs to receive the code
      // after the user authenticates in the browser

      let authOutput = '';
      const urlRegex = /(https?:\/\/[^\s\x1b\]]+)/g;

      authProc.stdout.on('data', (chunk) => {
        const text = chunk.toString();
        authOutput += text;
        console.log('[chat] auth stdout:', text.replace(/\x1b\[[0-9;]*m/g, '').trim());
        const matches = text.match(urlRegex);
        if (matches) {
          for (const url of matches) {
            sendEvent({ type: 'auth_url', url });
          }
        }
      });
      authProc.stderr.on('data', (chunk) => {
        const text = chunk.toString();
        authOutput += text;
        console.log('[chat] auth stderr:', text.replace(/\x1b\[[0-9;]*m/g, '').trim());
        const matches = text.match(urlRegex);
        if (matches) {
          for (const url of matches) {
            sendEvent({ type: 'auth_url', url });
          }
        }
      });
      authProc.on('close', (code) => {
        activeProcess = null;
        pendingAuthProcess = null;
        console.log(`[chat] Auth flow completed with code ${code}`);
        sendEvent({ type: 'auth_done', success: code === 0 });
      });
      return;
    }

    // Handle auth code — user pastes the code from the OAuth page
    if (msg.type === 'auth_code' && msg.code) {
      if (activeProcess && activeProcess.stdin.writable) {
        console.log('[chat] Writing auth code to stdin');
        activeProcess.stdin.write(msg.code + '\n');
      } else {
        sendEvent({ type: 'error', message: 'No auth process waiting for a code. Try /login again.' });
      }
      return;
    }

    if (msg.type !== 'message' || !msg.content) return;

    // Handle /login command typed in chat
    if (msg.content.trim().toLowerCase() === '/login') {
      if (activeProcess) {
        sendEvent({ type: 'error', message: 'Please wait for the current operation to finish.' });
        return;
      }
      // Reuse the auth handler
      ws.emit('message', Buffer.from(JSON.stringify({ type: 'auth' })));
      return;
    }

    if (activeProcess) {
      sendEvent({ type: 'error', message: 'A message is already being processed. Please wait.' });
      return;
    }

    const args = [
      '-p', msg.content,
      '--output-format', 'stream-json',
      '--verbose',
      '--dangerously-skip-permissions',
      '--max-budget-usd', '2',
    ];

    if (sessionId) {
      args.push('--resume', sessionId);
    }

    console.log('[chat] Spawning claude with prompt:', msg.content.slice(0, 80));

    const proc = spawn('claude', args, {
      cwd: chatUserVault,
      env: getCleanEnv(chatUserVault),
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    activeProcess = proc;

    // Close stdin immediately — we pass prompt via -p flag, not stdin
    proc.stdin.end();

    let buffer = '';
    let lastText = '';
    let stderrBuffer = '';
    let gotAnyEvent = false;

    proc.stdout.on('data', (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop(); // keep incomplete last line

      for (const line of lines) {
        if (!line.trim()) continue;
        let event;
        try {
          event = JSON.parse(line);
        } catch {
          continue;
        }

        gotAnyEvent = true;

        // Extract session ID from init
        if (event.type === 'system' && event.subtype === 'init') {
          sessionId = event.session_id;
          sendEvent({ type: 'init', sessionId });
          continue;
        }

        // Stream assistant text
        if (event.type === 'assistant' && event.message?.content) {
          const textBlocks = event.message.content.filter(b => b.type === 'text');
          if (textBlocks.length > 0) {
            const fullText = textBlocks.map(b => b.text).join('');
            if (fullText !== lastText) {
              lastText = fullText;
              sendEvent({ type: 'assistant_text', content: fullText });
            }
          }

          // Report tool use
          const toolBlocks = event.message.content.filter(b => b.type === 'tool_use');
          for (const tool of toolBlocks) {
            sendEvent({ type: 'tool_use', tool: tool.name, input: tool.input || {} });
          }
          continue;
        }

        // Result (completion)
        if (event.type === 'result') {
          sessionId = event.session_id || sessionId;
          sendEvent({ type: 'done', sessionId });
          continue;
        }
      }
    });

    proc.stderr.on('data', (chunk) => {
      const text = chunk.toString().trim();
      stderrBuffer += text + '\n';
      console.error('[chat] stderr:', text);
    });

    proc.on('error', (err) => {
      console.error('[chat] Process error:', err.message);
      sendEvent({ type: 'error', message: `Failed to start Claude: ${err.message}` });
      activeProcess = null;
    });

    proc.on('close', (code) => {
      activeProcess = null;
      // Flush remaining buffer
      if (buffer.trim()) {
        try {
          const event = JSON.parse(buffer);
          gotAnyEvent = true;
          if (event.type === 'result') {
            sessionId = event.session_id || sessionId;
            sendEvent({ type: 'done', sessionId });
            return;
          }
        } catch {
          // ignore
        }
      }
      if (code !== 0) {
        const cleanStderr = stderrBuffer.replace(/\x1b\[[0-9;]*m/g, '').trim();
        console.warn(`[chat] Claude exited with code ${code}, stderr: ${cleanStderr || '(empty)'}`);
        const allOutput = cleanStderr || buffer.replace(/\x1b\[[0-9;]*m/g, '').trim();
        const isAuthError = allOutput.includes('auth') || allOutput.includes('login')
          || allOutput.includes('credential') || allOutput.includes('API key')
          || allOutput.includes('not logged in') || allOutput.includes('token');
        if (isAuthError || !gotAnyEvent) {
          // If no events received at all, likely an auth issue
          sendEvent({ type: 'auth_required', message: allOutput || 'Claude is not authenticated. Click "Connect Claude" to sign in.' });
        } else {
          sendEvent({ type: 'error', message: allOutput || `Claude exited with code ${code}` });
        }
      } else if (!gotAnyEvent) {
        // Process succeeded but produced no events
        sendEvent({ type: 'done', sessionId });
      }
    });
  });

  ws.on('close', () => {
    console.log('[chat] Session closed');
    clearInterval(pingInterval);
    if (activeProcess) {
      // Don't kill auth processes — the REST fallback can still submit the code
      if (activeProcess === pendingAuthProcess) {
        console.log('[chat] Auth process kept alive for REST fallback');
      } else {
        activeProcess.kill();
      }
      activeProcess = null;
    }
  });
});

// --- Initialize Claude Code skill + hooks on first boot ---

// Initialize Claude Code config for a user's vault (called on first request)
async function initClaudeCodeConfig(vaultRoot = VAULT_ROOT) {
  const claudeDir = path.join(vaultRoot, '.claude');
  const skillDir = path.join(claudeDir, 'skills', 'research');
  const hooksDir = path.join(claudeDir, 'hooks');

  // Research skill
  const skillPath = path.join(skillDir, 'SKILL.md');
  if (!existsSync(skillPath)) {
    await fs.mkdir(skillDir, { recursive: true });
    await fs.writeFile(skillPath, `# Research Skill

## When to Use
When asked to research a paper, analyze an arXiv submission, or investigate a technical topic.

## Instructions
1. Use WebFetch to retrieve the paper from arXiv or the provided URL
2. Read and analyze the paper's key contributions, methodology, and results
3. Create a structured markdown review in the vault with:
   - **Paper metadata** — title, authors, date, source URL
   - **Key Contributions** — what's novel
   - **Methodology** — how they did it
   - **Results & Findings** — what they found
   - **Weaknesses & Limitations** — gaps, assumptions, scalability concerns
   - **Connections** — how this relates to other papers in the vault
4. Save the file as \`reviews/<paper-slug>.md\`
5. If multiple papers are provided for review, also produce:
   - A comparative analysis section
   - Architecture diagrams (Mermaid) showing how concepts fit together
   - Code assets that implement key architectural patterns described

## Output Format
Save all files to the vault. Use Mermaid diagrams for architecture visualization.
Reviews go in \`reviews/\`, code assets in \`assets/\`, syntheses in \`syntheses/\`.
`);
    console.log('[init] Created research skill');
  }

  // Hook script — logs tool use to .tool-activity.jsonl
  // Always overwrite: this is server-generated, not user-customized.
  // Written as Node.js (not bash) to avoid shell escaping and jq issues.
  const hookScript = path.join(hooksDir, 'log-activity.js');
  // Also clean up old bash version if it exists
  const oldHookScript = path.join(hooksDir, 'log-activity.sh');
  if (existsSync(oldHookScript)) await fs.unlink(oldHookScript).catch(() => {});
  await fs.mkdir(hooksDir, { recursive: true });
  await fs.writeFile(hookScript, `#!/usr/bin/env node
// Claude Code PreToolUse hook — audits tool activity and enforces tool policy.
const fs = require('fs');
const path = require('path');

let input = '';
process.stdin.on('data', (chunk) => { input += chunk; });
process.stdin.on('end', () => {
  try {
    const parsed = JSON.parse(input || '{}');
    const tool = parsed.tool_name || 'unknown';
    const toolInput = parsed.tool_input || {};
    const runId = process.env.CLAUDE_RUN_ID || '';
    const home = process.env.HOME || '/tmp';
    let decision = 'allow';
    let reason = '';

    // Check tool policy
    const policyFile = path.join(home, '.claude', 'tool-policy.json');
    try {
      if (fs.existsSync(policyFile)) {
        const policy = JSON.parse(fs.readFileSync(policyFile, 'utf-8'));
        if (Array.isArray(policy.blocked_tools) && policy.blocked_tools.includes(tool)) {
          decision = 'block';
          reason = 'Tool ' + tool + ' is blocked by workspace policy';
        }
      }
    } catch {}

    // Append to activity log
    const logEntry = JSON.stringify({
      timestamp: new Date().toISOString(),
      tool,
      input: toolInput,
      decision,
      runId,
    });
    try {
      fs.appendFileSync(path.join(home, '.tool-activity.jsonl'), logEntry + '\\n');
    } catch {}

    // Output decision — this MUST be the only stdout
    if (decision === 'block') {
      process.stdout.write(JSON.stringify({ decision: 'block', reason }) + '\\n');
    } else {
      process.stdout.write('{"decision":"allow"}\\n');
    }
  } catch (err) {
    // If anything goes wrong, still output valid JSON
    process.stdout.write('{"decision":"allow"}\\n');
  }
});
`);
  await fs.chmod(hookScript, 0o755);

  // Claude Code settings with hook config — always write the correct format
  const settingsPath = path.join(claudeDir, 'settings.json');
  const settingsContent = {
    hooks: {
      PreToolUse: [
        {
          matcher: "",
          hooks: [
            {
              type: "command",
              command: hookScript
            }
          ]
        }
      ]
    }
  };
  // Write if missing or if the existing file has a malformed hooks structure
  let needsWrite = !existsSync(settingsPath);
  if (!needsWrite) {
    try {
      const existing = JSON.parse(await fs.readFile(settingsPath, 'utf-8'));
      const entries = existing?.hooks?.PreToolUse;
      if (Array.isArray(entries) && entries.some(e => e.command && !e.hooks)) {
        needsWrite = true;
      }
    } catch {
      needsWrite = true;
    }
  }
  if (needsWrite) {
    await fs.writeFile(settingsPath, JSON.stringify(settingsContent, null, 2));
    console.log('[init] Created Claude Code settings with hooks');
  }

  // Default tool policy (enterprise controls demo)
  const policyPath = path.join(claudeDir, 'tool-policy.json');
  if (!existsSync(policyPath)) {
    await fs.writeFile(policyPath, JSON.stringify({
      blocked_tools: [],
      notes: "Add tool names to blocked_tools to deny them. E.g. [\"Bash\"] blocks shell access."
    }, null, 2));
    console.log('[init] Created default tool policy');
  }
}

// Harden .claude/ permissions for a specific vault directory
async function hardenUserVault(vaultRoot) {
  const claudeDir = path.join(vaultRoot, '.claude');
  try {
    if (existsSync(claudeDir)) {
      await fs.chmod(claudeDir, 0o700);
      const entries = await fs.readdir(claudeDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile() && (
          entry.name.includes('credential') || entry.name.includes('token')
          || entry.name.includes('auth') || entry.name === 'settings.json'
        )) {
          await fs.chmod(path.join(claudeDir, entry.name), 0o600);
        }
      }
    }
  } catch { /* best effort */ }
}

// --- Activity log endpoint ---

app.get(`${API_PREFIX}/activity`, async (req, res) => {
  const logPath = path.join(getUserVaultRoot(req.userId), '.tool-activity.jsonl');
  try {
    if (!existsSync(logPath)) return res.json({ events: [] });
    const content = await fs.readFile(logPath, 'utf-8');
    const events = content.trim().split('\n').filter(Boolean).map(line => {
      try { return JSON.parse(line); } catch { return null; }
    }).filter(Boolean);
    res.json({ events: events.slice(-200) });
  } catch {
    res.json({ events: [] });
  }
});

app.delete(`${API_PREFIX}/activity`, async (req, res) => {
  const logPath = path.join(getUserVaultRoot(req.userId), '.tool-activity.jsonl');
  try {
    await fs.writeFile(logPath, '');
    res.json({ cleared: true });
  } catch {
    res.json({ cleared: false });
  }
});

// --- Session config endpoint ---
// Returns configured skills, hooks, and tool policy for the user's Claude session.

app.get(`${API_PREFIX}/config`, async (req, res) => {
  const userVault = await ensureUserVault(req.userId);
  const claudeDir = path.join(userVault, '.claude');
  const result = { skills: [], hooks: {}, toolPolicy: { blocked_tools: [] } };

  try {
    // Read skills
    const skillsDir = path.join(claudeDir, 'skills');
    if (existsSync(skillsDir)) {
      const skillEntries = await fs.readdir(skillsDir, { withFileTypes: true });
      for (const entry of skillEntries) {
        if (entry.isDirectory()) {
          const skillFile = path.join(skillsDir, entry.name, 'SKILL.md');
          if (existsSync(skillFile)) {
            const content = await fs.readFile(skillFile, 'utf-8');
            // Extract first heading as name, first paragraph under "When to Use" as description
            const nameMatch = content.match(/^#\s+(.+)/m);
            const whenMatch = content.match(/##\s+When to Use\s*\n+([\s\S]*?)(?=\n##|\n$)/);
            result.skills.push({
              id: entry.name,
              name: nameMatch ? nameMatch[1].trim() : entry.name,
              description: whenMatch ? whenMatch[1].trim().split('\n')[0] : '',
              path: `.claude/skills/${entry.name}/SKILL.md`,
            });
          }
        }
      }
    }

    // Read hooks from settings.json — flatten nested format and convert paths
    const settingsPath = path.join(claudeDir, 'settings.json');
    if (existsSync(settingsPath)) {
      const settings = JSON.parse(await fs.readFile(settingsPath, 'utf-8'));
      if (settings.hooks) {
        const normalized = {};
        for (const [event, hookList] of Object.entries(settings.hooks)) {
          const flat = [];
          for (const entry of hookList) {
            // Flatten {matcher, hooks: [{type, command}]} → {matcher, command, filePath}
            const innerHooks = entry.hooks || [];
            for (const h of innerHooks) {
              const cmd = h.command || '';
              flat.push({
                matcher: entry.matcher || '',
                command: cmd,
                filePath: cmd.startsWith(userVault)
                  ? cmd.slice(userVault.length + 1)
                  : null,
              });
            }
          }
          normalized[event] = flat;
        }
        result.hooks = normalized;
      }
    }

    // Read tool policy
    const policyPath = path.join(claudeDir, 'tool-policy.json');
    if (existsSync(policyPath)) {
      result.toolPolicy = JSON.parse(await fs.readFile(policyPath, 'utf-8'));
    }
  } catch (err) {
    console.warn('[config] Error reading config:', err.message);
  }

  res.json(result);
});

// --- Onboarding status check ---
// Checks whether Claude Code has completed onboarding in this vault.
// The frontend uses this to gate run launches with a helpful modal.

app.get(`${API_PREFIX}/onboarding-status`, async (req, res) => {
  const userVault = await ensureUserVault(req.userId);
  // Claude Code stores onboarding state in ~/.claude.json (HOME=vault root)
  const configPath = path.join(userVault, '.claude.json');
  try {
    if (!existsSync(configPath)) {
      return res.json({ ready: false, reason: 'not_launched' });
    }
    const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));
    if (!config.hasCompletedOnboarding) {
      return res.json({ ready: false, reason: 'not_onboarded' });
    }
    // Also check for OAuth credentials (user must have authenticated)
    const credPath = path.join(userVault, '.claude', 'credentials.json');
    const altCredPath = path.join(userVault, '.claude', '.credentials.json');
    if (!existsSync(credPath) && !existsSync(altCredPath)) {
      return res.json({ ready: false, reason: 'not_authenticated' });
    }
    return res.json({ ready: true });
  } catch {
    return res.json({ ready: false, reason: 'not_launched' });
  }
});

// --- Concurrent Run Manager (interactive PTY) ---
// Each run spawns a full interactive Claude Code PTY session.
// The research prompt is auto-injected after Claude Code starts up.
// Users see the real Claude Code TUI and can interact with it.

const activeRuns = new Map();

app.post(`${API_PREFIX}/runs`, async (req, res) => {
  const { prompt, title, intentionId } = req.body || {};
  if (!prompt) {
    return res.status(400).json({ error: 'prompt is required' });
  }

  if (!pty) {
    return res.status(500).json({ error: 'node-pty not available — cannot spawn interactive terminal' });
  }

  const userVault = await ensureUserVault(req.userId);
  const runId = randomUUID();

  console.log(`[run:${runId.slice(0,8)}] Starting interactive PTY for ${req.userId}: ${(title || prompt).slice(0, 60)}`);

  let shell;
  try {
    const runEnv = getCleanEnv(userVault);
    runEnv.CLAUDE_RUN_ID = runId;
    shell = pty.spawn('claude', ['--dangerously-skip-permissions'], {
      name: 'xterm-256color',
      cols: 120,
      rows: 30,
      cwd: userVault,
      env: runEnv,
    });
  } catch (err) {
    console.error(`[run:${runId.slice(0,8)}] Failed to spawn PTY:`, err.message);
    return res.status(500).json({ error: `Failed to spawn Claude Code: ${err.message}` });
  }

  const run = {
    id: runId,
    intentionId: intentionId || null,
    title: title || prompt.slice(0, 80),
    status: 'running',
    startedAt: new Date().toISOString(),
    finishedAt: null,
    toolCount: 0,
    error: null,
    userVault,
    userId: req.userId,
    shell,
    promptInjected: false,
    clients: new Set(),
    outputBuffer: '',
  };
  activeRuns.set(runId, run);

  function broadcast(text) {
    run.outputBuffer += text;
    if (run.outputBuffer.length > 100000) {
      run.outputBuffer = run.outputBuffer.slice(-80000);
    }
    for (const ws of run.clients) {
      try { ws.send(text); } catch {}
    }
  }

  // Stream raw PTY output to all connected WebSocket clients
  shell.onData((data) => {
    broadcast(data);
  });

  // Auto-inject the research prompt after Claude Code starts up.
  // Wait for output to settle (no new data for 1.5s) with a max wait of 10s.
  let settleTimer = null;
  let maxTimer = null;
  let hasOutput = false;

  function injectPrompt() {
    if (run.promptInjected) return;
    run.promptInjected = true;
    if (settleTimer) clearTimeout(settleTimer);
    if (maxTimer) clearTimeout(maxTimer);
    // Write the prompt to the PTY as if the user typed it, then press Enter
    shell.write(prompt + '\r');
    console.log(`[run:${runId.slice(0,8)}] Prompt injected (${prompt.length} chars)`);
  }

  // Reset settle timer on each chunk of output
  const onDataForInjection = shell.onData(() => {
    hasOutput = true;
    if (run.promptInjected) return;
    if (settleTimer) clearTimeout(settleTimer);
    settleTimer = setTimeout(injectPrompt, 1500);
  });

  // Max wait fallback
  maxTimer = setTimeout(() => {
    if (!run.promptInjected) {
      console.log(`[run:${runId.slice(0,8)}] Max wait reached, injecting prompt`);
      injectPrompt();
    }
  }, 10000);

  // --- Task completion detection ---
  // After the prompt is injected, monitor output for Claude's idle state.
  // When output settles (3s silence after substantial output), send /exit.
  let completionBytes = 0;
  let completionTimer = null;
  const MAX_RUN_DURATION = 30 * 60 * 1000; // 30 minutes

  shell.onData((data) => {
    if (!run.promptInjected || run.status !== 'running') return;
    completionBytes += data.length;
    // Wait for substantial output before considering "settle"
    if (completionBytes < 500) return;
    if (completionTimer) clearTimeout(completionTimer);
    completionTimer = setTimeout(() => {
      if (run.status === 'running') {
        console.log(`[run:${runId.slice(0,8)}] Task complete (${completionBytes} bytes output), sending /exit`);
        shell.write('/exit\r');
      }
    }, 3000);
  });

  // Max duration fallback — force-exit stuck runs
  const maxRunTimer = setTimeout(() => {
    if (run.status === 'running') {
      console.log(`[run:${runId.slice(0,8)}] Max duration reached, forcing exit`);
      shell.write('/exit\r');
    }
  }, MAX_RUN_DURATION);

  shell.onExit(({ exitCode }) => {
    run.status = exitCode === 0 ? 'completed' : 'failed';
    run.finishedAt = new Date().toISOString();
    if (exitCode !== 0) run.error = `Exited with code ${exitCode}`;
    console.log(`[run:${runId.slice(0,8)}] ${run.status} (exit ${exitCode})`);
    // Notify connected clients the session ended, then close the WebSocket
    // so the frontend's ws.onclose fires and updates the tab icon
    for (const ws of run.clients) {
      try {
        ws.send(`\r\n\x1b[${exitCode === 0 ? '32' : '31'}m[Session ended]\x1b[0m\r\n`);
        ws.close();
      } catch {}
    }
    // Clean up timers
    if (settleTimer) clearTimeout(settleTimer);
    if (maxTimer) clearTimeout(maxTimer);
    if (completionTimer) clearTimeout(completionTimer);
    clearTimeout(maxRunTimer);
    setTimeout(() => activeRuns.delete(runId), 1800000);
  });

  res.status(201).json({
    runId,
    id: runId,
    intentionId: run.intentionId,
    title: run.title,
    status: run.status,
    startedAt: run.startedAt,
  });
});

app.get(`${API_PREFIX}/runs`, (req, res) => {
  const runs = [];
  for (const [, entry] of activeRuns) {
    if (entry.userId !== req.userId) continue;
    runs.push({
      id: entry.id,
      intentionId: entry.intentionId,
      title: entry.title,
      status: entry.status,
      startedAt: entry.startedAt,
      finishedAt: entry.finishedAt,
      toolCount: entry.toolCount,
      error: entry.error,
    });
  }
  runs.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  res.json({ runs });
});

app.delete(`${API_PREFIX}/runs/:id`, (req, res) => {
  const entry = activeRuns.get(req.params.id);
  if (!entry) {
    return res.status(404).json({ error: 'Run not found' });
  }
  if (entry.userId !== req.userId) {
    return res.status(403).json({ error: 'Not authorized' });
  }
  if (entry.status === 'running' && entry.shell) {
    entry.shell.kill();
    entry.status = 'cancelled';
    entry.finishedAt = new Date().toISOString();
  }
  res.json({ status: entry.status });
});

// --- Run Terminal WebSocket Handler ---
// Bidirectional: streams PTY output to clients, relays client input to PTY.

runWss.on('connection', (ws, runId, request) => {
  const run = activeRuns.get(runId);
  if (!run) {
    ws.send('\r\n\x1b[31m[Run not found]\x1b[0m\r\n');
    ws.close();
    return;
  }

  // Verify the connecting user owns this run
  const identity = parseUserIdentity(request);
  if (run.userId !== identity.userId) {
    ws.send('\r\n\x1b[31m[Not authorized]\x1b[0m\r\n');
    ws.close();
    return;
  }

  console.log(`[run:${runId.slice(0,8)}] Client connected`);
  run.clients.add(ws);

  // Backfill buffered output for late-joining clients
  if (run.outputBuffer) ws.send(run.outputBuffer);
  if (run.status !== 'running') {
    ws.send(`\r\n\x1b[33m[Session ${run.status}]\x1b[0m\r\n`);
  }

  // Relay client input to the PTY (bidirectional)
  ws.on('message', (msg) => {
    if (run.status !== 'running' || !run.shell) return;
    const str = msg.toString();
    // Handle resize messages (prefixed with \x01)
    if (str.startsWith('\x01')) {
      try {
        const { cols, rows } = JSON.parse(str.slice(1));
        run.shell.resize(cols, rows);
      } catch {
        // Not a valid resize message — send as input
        run.shell.write(str);
      }
    } else {
      run.shell.write(str);
    }
  });

  ws.on('close', () => {
    run.clients.delete(ws);
    console.log(`[run:${runId.slice(0,8)}] Client disconnected`);
  });
});

// --- Token Security ---

// Revoke stored auth tokens (per-user)
app.delete(`${API_PREFIX}/auth`, async (req, res) => {
  const userVault = getUserVaultRoot(req.userId);
  const credPaths = [
    path.join(userVault, '.claude', 'credentials.json'),
    path.join(userVault, '.claude', '.credentials.json'),
    path.join(userVault, '.claude.json'),
  ];
  let revoked = 0;
  for (const p of credPaths) {
    try {
      if (existsSync(p)) { await fs.unlink(p); revoked++; }
    } catch { /* best effort */ }
  }
  try {
    const configDir = path.join(userVault, '.claude');
    if (existsSync(configDir)) {
      const entries = await fs.readdir(configDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile() && (entry.name.includes('token') || entry.name.includes('auth') || entry.name.includes('credential'))) {
          await fs.unlink(path.join(configDir, entry.name));
          revoked++;
        }
      }
    }
  } catch { /* directory may not exist */ }
  console.log(`[auth] Revoked ${revoked} credential files for user ${req.userId}`);
  res.json({ revoked, message: `Deleted ${revoked} credential file(s). Re-authenticate in the terminal.` });
});

// --- Scheduled Run Executor ---
// Periodically checks intentions with recurring schedules and spawns runs.

function buildServerPrompt(intention) {
  const parts = [];
  if (intention.type === 'research') {
    parts.push(`Use the research skill to analyze: ${intention.title}.`);
    if (intention.description) parts.push(intention.description);
    parts.push('Save the review to reviews/ in the vault.');
  } else if (intention.type === 'synthesis') {
    parts.push(`Use the research skill to synthesize findings: ${intention.title}.`);
    if (intention.description) parts.push(intention.description);
    parts.push('Read existing reviews in reviews/, produce a synthesis in syntheses/. Include Mermaid architecture diagrams.');
  } else if (intention.type === 'review') {
    const docs = intention.documents?.join(', ') || 'all files in reviews/';
    parts.push(`Use the research skill to review these documents: ${docs}.`);
    parts.push(`Objective: ${intention.title}.`);
    if (intention.description) parts.push(intention.description);
    parts.push('Produce: comparative analysis, code assets in assets/, and Mermaid architecture diagrams.');
  }
  return parts.join(' ');
}

async function appendSchedulerLog(vaultDir, entry) {
  const logPath = path.join(vaultDir, '.scheduler-log.jsonl');
  await fs.appendFile(logPath, JSON.stringify(entry) + '\n').catch(() => {});
}

async function runScheduler() {
  const vaultsDir = path.join(VAULT_ROOT, 'vaults');
  if (!existsSync(vaultsDir)) return;

  let userDirs;
  try {
    userDirs = await fs.readdir(vaultsDir, { withFileTypes: true });
  } catch { return; }

  for (const entry of userDirs) {
    if (!entry.isDirectory()) continue;
    const userId = entry.name;
    const vaultDir = path.join(vaultsDir, userId);
    const intentionsPath = path.join(vaultDir, '.intentions.json');

    if (!existsSync(intentionsPath)) continue;

    let intentions;
    try {
      intentions = JSON.parse(await fs.readFile(intentionsPath, 'utf-8'));
    } catch { continue; }

    if (!Array.isArray(intentions)) continue;

    let changed = false;
    for (const intention of intentions) {
      if (!intention.schedule || !intention.schedule.timesPerDay) continue;

      // Check end date
      if (intention.schedule.endDate && new Date(intention.schedule.endDate) < new Date()) continue;

      // Check if due
      const intervalMs = (24 * 60 * 60 * 1000) / intention.schedule.timesPerDay;
      const lastRun = intention.lastRunAt ? new Date(intention.lastRunAt).getTime() : 0;
      const now = Date.now();

      if ((now - lastRun) < intervalMs) continue;

      // Due — spawn a run
      if (!pty) {
        console.warn(`[scheduler] Cannot spawn run — node-pty not available`);
        continue;
      }

      const prompt = buildServerPrompt(intention);
      const runId = randomUUID();

      console.log(`[scheduler] Triggering run for ${userId}: "${intention.title}" (${runId.slice(0,8)})`);

      try {
        await ensureUserVault(userId);
        const runEnv = getCleanEnv(vaultDir);
        runEnv.CLAUDE_RUN_ID = runId;

        const shell = pty.spawn('claude', ['--dangerously-skip-permissions'], {
          name: 'xterm-256color',
          cols: 120,
          rows: 30,
          cwd: vaultDir,
          env: runEnv,
        });

        const run = {
          id: runId,
          intentionId: intention.id || null,
          title: `[Scheduled] ${intention.title}`,
          status: 'running',
          startedAt: new Date().toISOString(),
          finishedAt: null,
          toolCount: 0,
          error: null,
          userVault: vaultDir,
          userId,
          shell,
          promptInjected: false,
          clients: new Set(),
          outputBuffer: '',
        };
        activeRuns.set(runId, run);

        // Buffer output (same as manual runs)
        const MAX_BUFFER = 100 * 1024;
        function broadcast(text) {
          run.outputBuffer += text;
          if (run.outputBuffer.length > MAX_BUFFER) {
            run.outputBuffer = run.outputBuffer.slice(-MAX_BUFFER);
          }
          for (const ws of run.clients) {
            try { ws.send(text); } catch {}
          }
        }

        shell.onData((data) => { broadcast(data); });

        // Prompt injection (same settle pattern)
        let settleT = null;
        const maxT = setTimeout(() => {
          if (!run.promptInjected) {
            run.promptInjected = true;
            shell.write(prompt + '\r');
            console.log(`[scheduler:${runId.slice(0,8)}] Prompt injected`);
          }
        }, 10000);

        shell.onData(() => {
          if (run.promptInjected) return;
          if (settleT) clearTimeout(settleT);
          settleT = setTimeout(() => {
            if (!run.promptInjected) {
              run.promptInjected = true;
              if (maxT) clearTimeout(maxT);
              shell.write(prompt + '\r');
              console.log(`[scheduler:${runId.slice(0,8)}] Prompt injected`);
            }
          }, 1500);
        });

        // Completion detection (same as manual runs)
        let compBytes = 0;
        let compTimer = null;
        shell.onData((data) => {
          if (!run.promptInjected || run.status !== 'running') return;
          compBytes += data.length;
          if (compBytes < 500) return;
          if (compTimer) clearTimeout(compTimer);
          compTimer = setTimeout(() => {
            if (run.status === 'running') {
              shell.write('/exit\r');
              console.log(`[scheduler:${runId.slice(0,8)}] Task complete, sending /exit`);
            }
          }, 3000);
        });

        shell.onExit(({ exitCode }) => {
          run.status = exitCode === 0 ? 'completed' : 'failed';
          run.finishedAt = new Date().toISOString();
          if (exitCode !== 0) run.error = `Exited with code ${exitCode}`;
          console.log(`[scheduler:${runId.slice(0,8)}] ${run.status} (exit ${exitCode})`);
          for (const ws of run.clients) {
            try {
              ws.send(`\r\n\x1b[${exitCode === 0 ? '32' : '31'}m[Session ended]\x1b[0m\r\n`);
              ws.close();
            } catch {}
          }
          if (settleT) clearTimeout(settleT);
          clearTimeout(maxT);
          if (compTimer) clearTimeout(compTimer);
          appendSchedulerLog(vaultDir, {
            timestamp: new Date().toISOString(),
            intentionId: intention.id,
            title: intention.title,
            event: run.status,
            runId,
            error: run.error || undefined,
          });
          setTimeout(() => activeRuns.delete(runId), 1800000);
        });

        // Update lastRunAt
        intention.lastRunAt = new Date().toISOString();
        changed = true;

        await appendSchedulerLog(vaultDir, {
          timestamp: new Date().toISOString(),
          intentionId: intention.id,
          title: intention.title,
          event: 'started',
          runId,
        });

      } catch (err) {
        console.error(`[scheduler] Failed to spawn run for ${userId}:`, err.message);
        await appendSchedulerLog(vaultDir, {
          timestamp: new Date().toISOString(),
          intentionId: intention.id,
          title: intention.title,
          event: 'failed',
          error: err.message,
        });
      }
    }

    if (changed) {
      await fs.writeFile(intentionsPath, JSON.stringify(intentions, null, 2)).catch(() => {});
    }
  }
}

// Run scheduler every 60 seconds
setInterval(runScheduler, 60000);
// Also run once after startup (with a delay to let the server initialize)
setTimeout(runScheduler, 5000);

// --- Start Server ---

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[server] Research Workspace backend listening on port ${PORT}`);
  console.log(`[server] Vault root: ${VAULT_ROOT}`);
  console.log(`[server] Per-user vaults: ${VAULT_ROOT}/vaults/{userId}/`);
  console.log(`[server] API prefix: ${API_PREFIX}`);
});
