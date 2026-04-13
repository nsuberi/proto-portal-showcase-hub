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
      runWss.emit('connection', ws, runId);
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
  const hookScript = path.join(hooksDir, 'log-activity.sh');
  if (!existsSync(hookScript)) {
    await fs.mkdir(hooksDir, { recursive: true });
    await fs.writeFile(hookScript, `#!/bin/bash
# Claude Code PreToolUse hook — logs tool activity and enforces tool policy.
# Enterprise controls: every tool invocation is audited. Blocked tools
# are denied with a reason.

INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name // "unknown"')
TOOL_INPUT=$(echo "$INPUT" | jq -c '.tool_input // {}')
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%S.000Z)
DECISION="allow"
REASON=""

# Check tool policy (if policy file exists)
POLICY_FILE="$HOME/.claude/tool-policy.json"
if [ -f "$POLICY_FILE" ]; then
  BLOCKED=$(jq -r --arg tool "$TOOL" '(.blocked_tools // []) | map(select(. == $tool)) | length' "$POLICY_FILE" 2>/dev/null)
  if [ "$BLOCKED" != "0" ] && [ "$BLOCKED" != "" ]; then
    DECISION="block"
    REASON="Tool $TOOL is blocked by workspace policy"
  fi
fi

# Append to per-user activity log
echo "{\\"timestamp\\":\\"$TIMESTAMP\\",\\"tool\\":\\"$TOOL\\",\\"input\\":$TOOL_INPUT,\\"decision\\":\\"$DECISION\\"}" >> "$HOME/.tool-activity.jsonl"

# Output decision
if [ "$DECISION" = "block" ]; then
  echo "{\\"decision\\":\\"block\\",\\"reason\\":\\"$REASON\\"}"
else
  echo '{"decision":"allow"}'
fi
`);
    await fs.chmod(hookScript, 0o755);
    console.log('[init] Created hook script');
  }

  // Claude Code settings with hook config
  const settingsPath = path.join(claudeDir, 'settings.json');
  if (!existsSync(settingsPath)) {
    await fs.writeFile(settingsPath, JSON.stringify({
      hooks: {
        PreToolUse: [
          {
            matcher: "",
            command: hookScript
          }
        ]
      }
    }, null, 2));
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

// --- Concurrent Run Manager (stream-json) ---
// Each run spawns Claude Code with --output-format stream-json.
// The server parses events, logs tool use, and formats ANSI-colored
// output that streams to run terminal tabs via WebSocket.

const activeRuns = new Map();

// Format a stream-json event as colored ANSI text for the terminal tab
function formatEventForTerminal(event) {
  if (event.type === 'system' && event.subtype === 'init') {
    return `\x1b[90m[Session ${event.session_id?.slice(0,8) || '?'}]\x1b[0m\r\n`;
  }
  if (event.type === 'assistant' && event.message?.content) {
    const parts = [];
    for (const block of event.message.content) {
      if (block.type === 'text') {
        parts.push(block.text);
      } else if (block.type === 'tool_use') {
        const inp = block.input || {};
        let detail = '';
        if (inp.file_path) detail = inp.file_path;
        else if (inp.command) detail = (inp.command || '').slice(0, 80);
        else if (inp.pattern) detail = inp.pattern;
        else if (inp.url) detail = inp.url;
        else if (inp.query) detail = inp.query;
        parts.push(`\x1b[36m[${block.name}]\x1b[0m \x1b[90m${detail}\x1b[0m`);
      }
    }
    return parts.join('\r\n') + '\r\n';
  }
  if (event.type === 'result') {
    return `\r\n\x1b[32m[Done]\x1b[0m\r\n`;
  }
  return '';
}

app.post(`${API_PREFIX}/runs`, async (req, res) => {
  const { prompt, title, intentionId } = req.body || {};
  if (!prompt) {
    return res.status(400).json({ error: 'prompt is required' });
  }

  const userVault = await ensureUserVault(req.userId);
  const runId = randomUUID();
  const args = [
    '-p', prompt,
    '--output-format', 'stream-json',
    '--verbose',
    '--dangerously-skip-permissions',
    '--max-budget-usd', '2',
  ];

  console.log(`[run:${runId.slice(0,8)}] Starting for ${req.userId}: ${(title || prompt).slice(0, 60)}`);

  const proc = spawn('claude', args, {
    cwd: userVault,
    env: getCleanEnv(userVault),
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  proc.stdin.end();

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
    proc,
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

  // Header
  broadcast(`\x1b[33m▶ ${run.title}\x1b[0m\r\n\x1b[90m${new Date().toLocaleTimeString()}\x1b[0m\r\n\r\n`);

  let buffer = '';
  proc.stdout.on('data', (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop();

    for (const line of lines) {
      if (!line.trim()) continue;
      let event;
      try { event = JSON.parse(line); } catch { continue; }

      // Format for terminal display
      const text = formatEventForTerminal(event);
      if (text) broadcast(text);

      // Log tool use to activity file
      if (event.type === 'assistant' && event.message?.content) {
        const tools = event.message.content.filter(b => b.type === 'tool_use');
        for (const tool of tools) {
          run.toolCount++;
          const logLine = JSON.stringify({
            timestamp: new Date().toISOString(),
            tool: tool.name,
            input: tool.input || {},
            decision: 'allow',
            runId,
            runTitle: run.title,
          });
          fs.appendFile(path.join(run.userVault, '.tool-activity.jsonl'), logLine + '\n').catch(() => {});
        }
      }
    }
  });

  proc.stderr.on('data', (chunk) => {
    const text = chunk.toString().trim();
    console.error(`[run:${runId.slice(0,8)}] stderr:`, text);
    broadcast(`\x1b[31m${text}\x1b[0m\r\n`);
  });

  proc.on('error', (err) => {
    run.status = 'failed';
    run.error = err.message;
    run.finishedAt = new Date().toISOString();
    broadcast(`\r\n\x1b[31m[Error: ${err.message}]\x1b[0m\r\n`);
  });

  proc.on('close', (code) => {
    run.status = code === 0 ? 'completed' : 'failed';
    run.finishedAt = new Date().toISOString();
    if (code !== 0) run.error = `Exited with code ${code}`;
    console.log(`[run:${runId.slice(0,8)}] ${run.status} (${run.toolCount} tools, exit ${code})`);
    broadcast(`\r\n\x1b[${code === 0 ? '32' : '31'}m[Run ${run.status}]\x1b[0m\r\n`);
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
  if (entry.status === 'running' && entry.proc) {
    entry.proc.kill();
    entry.status = 'cancelled';
    entry.finishedAt = new Date().toISOString();
  }
  res.json({ status: entry.status });
});

// --- Run Terminal WebSocket Handler ---
// Streams formatted ANSI output from background runs to terminal tabs.

runWss.on('connection', (ws, runId) => {
  const run = activeRuns.get(runId);
  if (!run) {
    ws.send('\r\n\x1b[31m[Run not found]\x1b[0m\r\n');
    ws.close();
    return;
  }

  console.log(`[run:${runId.slice(0,8)}] Client connected`);
  run.clients.add(ws);

  if (run.outputBuffer) ws.send(run.outputBuffer);
  if (run.status !== 'running') {
    ws.send(`\r\n\x1b[33m[Run ${run.status}]\x1b[0m\r\n`);
  }

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

// --- Start Server ---

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[server] Research Workspace backend listening on port ${PORT}`);
  console.log(`[server] Vault root: ${VAULT_ROOT}`);
  console.log(`[server] Per-user vaults: ${VAULT_ROOT}/vaults/{userId}/`);
  console.log(`[server] API prefix: ${API_PREFIX}`);
});
