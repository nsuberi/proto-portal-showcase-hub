---
name: add-mcp-server
description: Add a new MCP server to the proto-mcp CLI. Guides through package creation, workspace registration, and CLI registry setup.
---

# Add MCP Server

Use this skill when the user wants to add a new MCP server to the `proto-mcp` CLI.

## Overview

The `proto-mcp` CLI (`shared/mcp-cli/`) uses a static registry pattern to discover and run MCP servers. Each server is a standalone workspace package that exports a `createServer()` factory returning an `@modelcontextprotocol/sdk` `Server` instance.

## Steps

### 1. Create the server package

Create a new directory at `shared/mcp-servers/{server-name}/` with these files:

**`package.json`**
```json
{
  "name": "@proto-portal/mcp-server-{server-name}",
  "version": "1.0.0",
  "type": "module",
  "description": "MCP server for {description}",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": ["dist/**/*"],
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "node --test dist/__tests__/*.test.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.12.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "typescript": "^5.5.0"
  }
}
```

Add any workspace dependencies the server needs (e.g., `"@proto-portal/design-tokens": "workspace:*"`).

**`tsconfig.json`**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": false,
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

**`src/index.ts`**
```typescript
export { createServer } from "./server.js";
```

**`src/server.ts`**
```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";

export function createServer(): Server {
  const server = new Server(
    { name: "proto-portal-{server-name}", version: "1.0.0" },
    { capabilities: { tools: {}, resources: {}, prompts: {} } }
  );

  // Register your handlers here:
  // - server.setRequestHandler(ListToolsRequestSchema, ...)
  // - server.setRequestHandler(CallToolRequestSchema, ...)
  // - server.setRequestHandler(ListResourcesRequestSchema, ...)
  // - server.setRequestHandler(ReadResourceRequestSchema, ...)
  // - server.setRequestHandler(ListPromptsRequestSchema, ...)
  // - server.setRequestHandler(GetPromptRequestSchema, ...)

  return server;
}
```

### 2. Add to root workspaces

In the root `package.json`, add the new package to `workspaces`:

```json
"workspaces": [
  ...existing...,
  "shared/mcp-servers/{server-name}"
]
```

### 3. Add CLI dependency

In `shared/mcp-cli/package.json`, add a `workspace:*` dependency:

```json
"dependencies": {
  "@proto-portal/mcp-server-design-tokens": "workspace:*",
  "@proto-portal/mcp-server-{server-name}": "workspace:*"
}
```

### 4. Register in the CLI

In `shared/mcp-cli/src/registry.ts`, add an entry to `serverRegistry`:

```typescript
{
  name: "{server-name}",
  description: "Short description of what this server provides",
  packageName: "@proto-portal/mcp-server-{server-name}",
  createServer: async () => {
    const mod = await import("@proto-portal/mcp-server-{server-name}");
    return mod.createServer;
  },
},
```

### 5. Register with Claude Code (optional)

Add to `.mcp.json` at the repo root:

```json
{
  "mcpServers": {
    "{server-name}": {
      "command": "node",
      "args": ["shared/mcp-cli/dist/cli.js", "start", "{server-name}"]
    }
  }
}
```

### 6. Build and test

```bash
yarn install
yarn build:mcp
node shared/mcp-cli/dist/cli.js list
node shared/mcp-cli/dist/cli.js info {server-name}
```

## MCP Server Design Guidelines

- **Tools** are for computed/parameterized data (queries with arguments)
- **Resources** are for static/semi-static data (token values, config snapshots)
- **Prompts** are for reusable prompt templates with optional arguments
- All output to stdout is reserved for MCP protocol — use `console.error()` for diagnostics
- Import from existing workspace packages — never duplicate data
- Use `@modelcontextprotocol/sdk`'s `InMemoryTransport` for unit testing
