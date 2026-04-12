import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { spawn } from 'child_process';
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

// Chat WebSocket (Claude Code integration)
const chatWss = new WebSocketServer({ noServer: true });

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

// --- Chat WebSocket Handler (Claude Code integration) ---

chatWss.on('connection', (ws) => {
  console.log('[chat] New chat session');
  let sessionId = null;
  let activeProcess = null;

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
        cwd: VAULT_ROOT,
        env: { ...process.env, HOME: VAULT_ROOT },
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      activeProcess = authProc;

      // Close stdin — auth login outputs a URL, no input needed
      authProc.stdin.end();

      let authOutput = '';
      const urlRegex = /(https?:\/\/[^\s\x1b\]]+)/g;

      authProc.stdout.on('data', (chunk) => {
        const text = chunk.toString();
        authOutput += text;
        console.log('[chat] auth stdout:', text.trim());
        // Look for URLs in the output
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
        console.log('[chat] auth stderr:', text.trim());
        const matches = text.match(urlRegex);
        if (matches) {
          for (const url of matches) {
            sendEvent({ type: 'auth_url', url });
          }
        }
      });
      authProc.on('close', (code) => {
        activeProcess = null;
        console.log(`[chat] Auth flow completed with code ${code}`);
        console.log('[chat] Auth output:', authOutput.replace(/\x1b\[[0-9;]*m/g, '').trim());
        sendEvent({ type: 'auth_done', success: code === 0 });
      });
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
      cwd: VAULT_ROOT,
      env: { ...process.env, HOME: VAULT_ROOT },
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
    if (activeProcess) {
      activeProcess.kill();
      activeProcess = null;
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[server] Research Workspace backend listening on port ${PORT}`);
  console.log(`[server] Vault root: ${VAULT_ROOT}`);
  console.log(`[server] API prefix: ${API_PREFIX}`);
});
