# proto-mcp — Local MCP Server CLI

A CLI for discovering and running MCP (Model Context Protocol) servers packaged within the Proto Portal monorepo.

## Why a CLI for MCP servers?

### Local testing without remote infrastructure

MCP servers run on your machine, connected via stdio. You can iterate on tools, resources, and prompts against real project data — no deployment step, no remote endpoint, no API keys. When you change a token value in `shared/design-tokens/`, rebuild, and the MCP server serves the updated value immediately.

This makes the feedback loop for MCP development as fast as local web development: edit, build, test.

### Versioned and shareable

The CLI is a Yarn workspace package with semantic versioning. When the team bumps to `v1.1.0`, everyone gets the same MCP servers with the same behavior. No "works on my machine" — the servers are pinned to the monorepo state, built from the same source, and tested in CI.

This matters because MCP servers shape how AI tools understand your codebase. If one developer's design-tokens server returns outdated color values, they'll get inconsistent styling suggestions. Version-locking prevents that drift.

### Shared context across the team

One CLI gives every developer access to the same MCP servers. The design system MCP server means any team member working on any prototype gets consistent design guidance — the same tokens, the same Tailwind classes, the same responsive patterns. No one has to memorize the design system or look up token values manually.

As you add more servers (API docs, component libraries, deployment configs), the CLI becomes a single source of truth that AI tools can query, ensuring consistent AI-assisted development across the entire monorepo.

### Extensible by design

Adding a new MCP server is four mechanical steps — no framework magic, no plugin system. Create a package, register it, build. The static registry pattern means you can see every available server by reading one file (`src/registry.ts`), and each server is a standalone package you can test independently.

## Usage

```bash
# List available servers
proto-mcp list

# Show a server's tools, resources, and prompts
proto-mcp info design-tokens

# Start a server (stdio transport — used by Claude Code)
proto-mcp start design-tokens
```

## Available Servers

| Server | Package | Description |
|--------|---------|-------------|
| `design-tokens` | `@proto-portal/mcp-server-design-tokens` | Design system tokens, themes, CSS variables, Tailwind classes, and usage prompts |

## Claude Code Integration

The `.mcp.json` at the repo root registers servers with Claude Code:

```json
{
  "mcpServers": {
    "design-tokens": {
      "command": "node",
      "args": ["shared/mcp-cli/dist/cli.js", "start", "design-tokens"]
    }
  }
}
```

Claude Code starts the server automatically when it needs design system context.

## Building

```bash
# Build the full MCP chain (design-tokens -> mcp-server -> cli)
yarn build:mcp

# Or build individually
yarn workspace @proto-portal/design-tokens build
yarn workspace @proto-portal/mcp-server-design-tokens build
yarn workspace @proto-portal/mcp-cli build
```

## Adding a New Server

See the skill guide at `.claude/skills/add-mcp-server/SKILL.md` for the full walkthrough, or use the `/add-mcp-server` skill in Claude Code.

The short version:

1. Create package in `shared/mcp-servers/{name}/`
2. Add to root `workspaces` in `package.json`
3. Add `workspace:*` dep to `shared/mcp-cli/package.json`
4. Add entry to `shared/mcp-cli/src/registry.ts`
5. (Optional) Add to `.mcp.json` for Claude Code auto-start

## Architecture

```
shared/mcp-cli/             CLI dispatcher
  src/cli.ts                 Entrypoint (#!/usr/bin/env node)
  src/registry.ts            Static server registry (lazy imports)
  src/commands/              list, start, info command handlers

shared/mcp-servers/
  design-tokens/             First MCP server
    src/server.ts            Server factory with tools/resources/prompts
    src/tools.ts             get_tokens, get_theme, get_css_variables, get_tailwind_classes
    src/resources.ts         9 token category resources
    src/prompts.ts           design_system_guide, create_component_styles
```

Each MCP server exports a `createServer()` factory. The CLI imports it lazily, instantiates the server, and connects it to a `StdioServerTransport`. All CLI output goes to stderr — stdout is reserved for the MCP protocol.
