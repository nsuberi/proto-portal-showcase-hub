# Research Workspace Platform

A multi-user research platform built on one principle: **users state intentions and organize their information**, while Claude Code handles execution. Users declare what they want to learn or integrate, trigger background research sessions, and curate results in a personal vault — nothing auto-publishes; the user decides what to share.

The platform combines a public knowledge gallery with authenticated personal workspaces. Users set learning intentions, Claude Code researches arXiv papers, and synthesizes findings into publishable insights, cross-article narratives, and architecture diagrams.

**Live at:** https://portfolio.cookinupideas.com/prototypes/research-workspace/

## Architecture

```
/prototypes/research-workspace/
  |
  |-- /* (public, S3)                          ->  Gallery SPA (browse published content)
  |-- /vault/api/vault/published* (no auth)    ->  ALB -> ECS (Express.js, public endpoints)
  |-- /vault/* (authenticated)                 ->  ALB -> Cognito -> ECS (Express.js + node-pty)
  |-- /api/* (mixed auth)                      ->  API Gateway -> Lambda -> DynamoDB
```

### Public Gallery
A React + Vite SPA served from S3 via CloudFront. Three content types displayed in a tabbed view:
- **Insights** -- single-article analysis with code cells
- **Syntheses** -- cross-article narratives connecting findings
- **Architectures** -- Mermaid diagrams with benefit framing

Content files (.md, .cells.json) are fetched at runtime via `fetch()` -- not bundled into JS.

### Authenticated Workspace
Express.js backend on ECS Fargate with a glassmorphism five-panel React SPA:
- **Files** — vault file browser (EFS-backed, drag-and-drop, create/delete/rename)
- **Intentions** — create research/synthesis/review plans with recurring schedules
- **Editor** — Milkdown WYSIWYG for markdown, regex syntax highlighting for code files
- **Claude Terminal** — tabbed xterm.js: interactive Claude Code session + per-run output tabs
- **Hooks & Activity** — real-time PreToolUse hook log showing every tool invocation

Additional capabilities:
- **Chat panel** — WebSocket-based Claude Code interaction with stream-json output
- **Voice input** — hold spacebar to dictate (Web Speech API transcription into terminal)
- **Publishing** — tag-based publishing from vault to public gallery
- **Session config** — read-only viewer for Claude Code skills, hooks, and tool policies
- **Scheduler** — recurring intention automation (checks every 60s, spawns PTY sessions)
- **Download/export** — download folder or entire vault as ZIP
- **EFS** persistent storage per user

### Automated Research Loop
A Claude Code Cloud Scheduled Task (4x/day) reads active intentions from DynamoDB, queries arXiv, generates drafts, and writes content to S3.

## Architectural Decisions

### 1. Custom Workspace Instead of code-server or Obsidian
**Decision:** Build a purpose-built workspace (Express.js + Milkdown + xterm.js) instead of deploying code-server with Foam or Obsidian.

**Why:** The job-to-be-done is "state intentions and organize information," not "write code in a full IDE." code-server (VS Code in the browser) was the original approach but proved to be overkill — it ships a full IDE when users need a markdown editor, a file browser, and a way to interact with Claude Code. Obsidian is closed-source with no multi-user web deployment option. The custom Express.js backend enables capabilities that couldn't exist as VS Code extensions: the intentions system with recurring schedules, real-time tool activity hooks panel, tag-based publishing to the public gallery, voice input, and a scheduler that spawns background research sessions. Milkdown provides focused WYSIWYG markdown editing, and xterm.js + node-pty gives direct interactive Claude Code terminal sessions.

### 2. GitHub OIDC Proxy for Cognito Authentication
**Decision:** Deploy a custom Lambda proxy that wraps GitHub OAuth in OIDC-compliant endpoints.

**Why:** AWS Cognito requires identity providers to be OIDC-compliant. GitHub's OAuth2 is not -- it lacks the `openid` scope, has no discovery endpoint (`.well-known/openid-configuration`), and doesn't return JWTs. Cognito rejects GitHub as a direct OIDC provider with `InvalidParameterException: openid is required in authorizeScopes`. The proxy Lambda implements standard OIDC discovery, authorization, token exchange, and userinfo endpoints, translating between Cognito's OIDC expectations and GitHub's OAuth2 reality. It signs JWTs with a self-managed RSA key pair stored as Lambda environment variables. Alternatives considered: email/password only (poor UX for developers), Google OAuth (requires GCP project, less natural for developer audience), Auth0/Clerk (external dependency outside AWS).

### 3. Cognito at ALB Level (Not Application Level)
**Decision:** Authentication is enforced at the ALB via `authenticate-cognito` listener rule actions, not in application code.

**Why:** No unauthenticated HTTP request ever reaches an ECS container. The ALB rejects traffic before it touches the application. This eliminates an entire class of auth bypass vulnerabilities — the Express.js backend has no built-in auth and doesn't need any. The JWT `sub` claim from Cognito is parsed from the `x-amzn-oidc-data` header by the server middleware and used to scope all file operations to the user's vault directory.

### 4. Per-User EFS Access Points for Token Isolation
**Decision:** Each user gets a kernel-enforced EFS access point, not just directory-level separation.

**Why:** Claude Code's Max plan OAuth token is stored at `~/.claude/` in the user's home directory. Without proper isolation, one user could access another's token. EFS access points enforce isolation at the NFS/kernel level -- even root inside a container cannot traverse to another user's vault. This is stronger than application-level directory permissions.

### 5. Two-Tier IAM Credential Chain (Append-Only)
**Decision:** Cloud task uses a Tier 1 IAM user (can only `sts:AssumeRole`) to assume a Tier 2 role (append-only, 1-hour TTL).

**Why:** The cloud scheduled task runs on Anthropic's VMs with credentials stored as environment variables. If Tier 1 credentials leak, an attacker can only assume a role with append-only access to one S3 prefix and one DynamoDB table for at most 1 hour. No delete permissions exist on either tier. S3 versioning and DynamoDB point-in-time recovery provide rollback capability for anything written.

### 6. S3 + DynamoDB Instead of Git for Content Storage
**Decision:** Generated content goes to S3 (files) and DynamoDB (metadata), not committed to the git repository.

**Why:** The initial approach pushed content to git via a local macOS LaunchAgent, which broke due to macOS TCC (Transparency, Consent, and Control) permissions blocking the scheduled process. Beyond the immediate fix, the S3/DynamoDB approach decouples storage from the codebase: the frontend already fetches content at runtime via `fetch()`, so writing files directly to S3 at the same paths makes content live without rebuilding. DynamoDB provides filterable metadata queries (by content type, domain, date) that a static JSON file cannot. Git is no longer in the content pipeline; S3 versioning provides history.

### 7. Intentions System (Learn / Integrate)
**Decision:** Users set explicit "intentions" that drive scheduled research sessions, rather than fully automated topic selection.

**Why:** The original inference-insights loop picked topics autonomously. The intentions system gives users agency: "intention to learn" focuses arXiv research on their chosen topic; "intention to integrate" synthesizes their accumulated research into narratives and architecture diagrams. Drafts land in the user's private vault for review -- nothing auto-publishes. This respects the user's judgment about what to share.

### 8. Mermaid for Architecture Diagrams
**Decision:** Architecture content uses Mermaid diagram blocks in markdown, rendered client-side.

**Why:** Mermaid is the most widely supported diagramming format in markdown renderers (GitHub, VS Code, HedgeDoc). It renders client-side via mermaid.js with no server needed. Alternatives (D2, PlantUML) require server-side rendering. The gallery SPA dynamically imports mermaid.js to avoid bundling its full weight on pages that don't need diagrams.

### 9. Max Plan Auth via `claude login` in Interactive Terminal
**Decision:** Users authenticate Claude Code with their own Max plan by running `claude login` in the interactive terminal or via the chat panel's auth flow.

**Why:** The Claude Code CLI's OAuth device-code flow works in the container because it doesn't require a local callback server — it displays a URL and code that the user enters in their browser. The chat WebSocket handler also supports `claude auth login --claudeai` with a REST fallback for code submission. The OAuth token is stored at `~/.claude/` in the user's vault root (`HOME=/workspace/vaults/{userId}/`), persisting across container restarts on EFS. Each user authenticates independently — no shared credentials.

### 10. CloudFront Path-Based Routing (Vault vs Gallery)
**Decision:** CloudFront uses ordered cache behaviors to route `/vault/*` to ALB (authenticated) and `/*` to S3 (public).

**Why:** A single prototype path (`/prototypes/research-workspace/`) serves both public and private content. The more specific `/vault/*` pattern is matched first (CloudFront evaluates ordered behaviors by specificity), routing to the ALB where Cognito authenticates. The catch-all `/*` serves the public gallery from S3. This avoids needing separate subdomains or separate CloudFront distributions.

### 11. Replacing Inference Insights with Research Workspace
**Decision:** Consolidate the `inference-insights` prototype into `research-workspace` as a single, broader platform.

**Why:** Inference-insights was a standalone gallery with an automated content pipeline. Rather than maintaining two prototypes (a gallery + a workspace), the research workspace subsumes it: the gallery becomes the public face, and the workspace provides the authenticated authoring environment. The CloudFront behavior for `/prototypes/inference-insights/*` was removed and replaced with `/prototypes/research-workspace/*`. Existing content was migrated to the new S3 paths and DynamoDB table.

## Infrastructure

| Resource | Service | Purpose |
|----------|---------|---------|
| Cognito User Pool | Auth | GitHub OAuth via OIDC proxy + email/password fallback |
| GitHub OIDC Proxy | Lambda | Translates GitHub OAuth to OIDC for Cognito |
| DynamoDB | Metadata | Content index, intentions, feedback, user profiles |
| EFS | Storage | Per-user persistent vaults with access point isolation |
| ECS Fargate | Compute | Express.js + node-pty backend (ARM64, Fargate Spot) |
| ECR | Registry | Docker images for the workspace |
| S3 | Content | Published gallery content (.md, .cells.json) + static SPA |
| CloudFront | CDN | Path-based routing (public vs authenticated) |
| ALB | Routing | Cognito auth action + forwarding to ECS |

## Security Model

### Current Isolation (Implemented)

```
Layer 1: Cognito + GitHub OAuth (at ALB)                    ✓ Shipped
  No request reaches any container without a valid JWT

Layer 2: Per-User Application-Level Path Isolation          ✓ Shipped
  Each user scoped to /workspace/vaults/{cognito-sub}/
  sanitizePath() validates every path against user's vault root
  Claude Code spawned with HOME set to user's vault directory

Layer 3: Per-User Claude OAuth                              ✓ Shipped
  Each user's .claude/ token stored in their vault directory
  Credential scrubbing: ANTHROPIC_API_KEY, AWS_* stripped from spawned processes
```

### Planned Isolation (Not Yet Implemented)

```
Layer 4: Per-User EFS Access Points                         ☐ Planned
  Kernel-level NFS isolation between user vaults (currently single access point)

Layer 5: Per-User ECS Tasks                                 ☐ Planned
  Separate container per user, no shared process space (currently shared task)
```

### Current Limitation: Single Shared ECS Task

All users share one ECS Fargate task (1 vCPU, 2 GB, ARM64). User isolation is enforced at the **application layer** — Cognito JWT parsing + `sanitizePath()` + per-user HOME directories. Users share the same container PID namespace, Linux UID (1000), and network stack.

**Suitable for:** Internal teams, trusted users, portfolio demonstrations.
**Not suitable for:** Multi-tenant production with untrusted users.

### Isolation Maturity Tiers

| Tier | Model | Isolation | Monthly Cost (5 users) | Cold Start |
|------|-------|-----------|----------------------|------------|
| **Current** | Shared task, app-layer paths | Application | ~$14 (Spot) | 0s (always on) |
| **Tier 2** | Per-user Fargate tasks | Container + application | ~$24 (Spot, 8hr/day) | 45-170s |
| **Tier 3** | Per-user tasks + per-user EFS APs | Container + kernel | ~$24 (Spot, APs free) | 45-170s |

Cold-start breakdown for per-user tasks: ECS placement (5-15s) + image pull (10-30s, cached after first) + Express boot (3-5s) + health check (30-120s). Mitigable with faster health checks, pre-warming, or loading screen UX.

IAM for the cloud research task: append-only (no delete on S3 or DynamoDB), 1-hour credential TTL, S3 versioning + DynamoDB PITR for rollback.

## Development

```bash
# Run the gallery SPA locally
yarn workspace @proto-portal/research-workspace dev    # port 3011

# Build
yarn workspace @proto-portal/research-workspace build

# Run via dev proxy (all prototypes)
yarn dev:proxy                                          # port 8082
```

## Content Types

| Type | Content Path | Trigger |
|------|-------------|---------|
| Insight | `content/insights/*.md` + `.cells.json` | "Intention to learn" |
| Synthesis | `content/syntheses/*.md` | "Intention to integrate" |
| Architecture | `content/architectures/*.md` (with Mermaid) | "Intention to integrate" |

## DynamoDB Schema

Table: `research-workspace`

| pk | sk | Description |
|----|-----|-------------|
| `CONTENT#<id>` | `META` | Published content metadata |
| `INTENTION#<user>#<id>` | `CONFIG` | Learning intention configuration |
| `INTENTION#<user>#<id>` | `HISTORY#<date>` | Session generation log |
| `STATE#memory` | `v1` | Global research loop state |
| `STATE#feedback` | `v1` | Aggregated user feedback |
| `USER#<cognito-sub>` | `PROFILE` | User profile + EFS access point |
| `WORKSPACE#<cognito-sub>` | `STATE` | Workspace running/stopped state |

GSI `by-type`: `contentType` (pk) + `date` (sk) for gallery filtering.
