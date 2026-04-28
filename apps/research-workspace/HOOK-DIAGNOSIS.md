# Hook JSON Output Validation Errors — Diagnosis & Fix

## Symptom

Every tool call in the Claude Code TUI shows:
```
JSON validation failed: Hook JSON output validation failed:
```

Note the trailing colon with nothing after it — Claude Code received **empty stdout** from the hook process.

Despite this error:
- The Agent Audit panel shows **correct tool counts** per session
- The `.tool-activity.jsonl` file is being written correctly
- Tool calls proceed (Claude Code treats hook validation failures as non-fatal)

## Why Agent Audit Works Despite the Error

The hook script does two things:

1. **Writes to `.tool-activity.jsonl`** via `fs.appendFileSync()` — truly synchronous, guaranteed on disk before returning
2. **Writes to stdout** via `process.stdout.write()` — **asynchronous on pipes** in Node.js

The activity log write (#1) always completes because `appendFileSync` is a blocking kernel-level syscall. The Agent Audit polls this file and displays the results correctly.

The stdout write (#2) is where the failure occurs.

## Root Cause: Async Pipe Writes in Node.js

The hook script uses the Node.js streaming API pattern:

```javascript
process.stdin.on('data', (chunk) => { input += chunk; });
process.stdin.on('end', () => {
  // ... processing ...
  process.stdout.write('{"decision":"allow"}\n');  // <-- THIS IS ASYNC ON PIPES
});
```

From the [Node.js docs](https://nodejs.org/api/process.html#processstdout):

> `process.stdout` differs from other Node.js streams in important ways. Writes are usually **blocking when the destination is a terminal/TTY** and **non-blocking when it's a pipe**.

When Claude Code spawns the hook as a child process, stdout is a **pipe**, not a TTY. This means:

1. `process.stdout.write(data)` places data in libuv's internal write buffer
2. The `stdin 'end'` callback returns
3. Node.js's event loop has no more pending work (no timers, no I/O watchers)
4. The process exits **before the pipe buffer is drained to the reading end**
5. Claude Code reads empty stdout → "Hook JSON output validation failed:"

On local disk with low latency, the race window is too small to observe. On EFS (NFS-backed) in the Docker container, `fs.appendFileSync` takes 10-100ms, stalling the event loop and widening the race window enough that the pipe buffer consistently fails to flush before exit.

## Timeline of Fix Attempts

| Commit | Fix | Why It Wasn't Enough |
|--------|-----|---------------------|
| `1c1139f` | Removed `set -euo pipefail` from bash hook | Correct diagnosis of SIGPIPE, but shell escaping issues remained |
| `70a5aa3` | Rewrote from bash+jq to Node.js | Eliminated shell escaping, but introduced async stdin/stdout pattern |
| `6ed2a07` | Always overwrite settings.json (was pointing to old `.sh` path) | Real bug, but fixing it exposed the async I/O race in the Node.js hook |

## The Fix: Fully Synchronous I/O

Replace event-based streaming with synchronous file descriptor operations:

```javascript
// BEFORE (async — broken on pipes)
process.stdin.on('data', (chunk) => { input += chunk; });
process.stdin.on('end', () => {
  process.stdout.write('{"decision":"allow"}\n');
});

// AFTER (sync — guaranteed delivery)
const input = fs.readFileSync(0, 'utf-8');   // fd 0 = stdin
fs.writeSync(1, '{"decision":"allow"}\n');   // fd 1 = stdout
```

Key properties:
- **`fs.readFileSync(0)`** — synchronous read from stdin file descriptor. Blocks until Claude Code closes the pipe. No event loop needed.
- **`fs.writeSync(1)`** — synchronous write to stdout file descriptor. Data is in the kernel pipe buffer before the call returns. No event loop drain needed.
- **No event loop dependency** — the script runs top-to-bottom as a synchronous program.

## Verification

```bash
# Normal input
echo '{"tool_name":"Read","tool_input":{}}' | node log-activity.js
# Expected: {"decision":"allow"}

# Empty stdin
echo '' | node log-activity.js
# Expected: {"decision":"allow"}

# Invalid JSON
echo 'garbage' | node log-activity.js
# Expected: {"decision":"allow"}
```
