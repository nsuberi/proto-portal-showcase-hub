import type { McpServerDefinition } from "./types.js";

/**
 * Static registry of available MCP servers.
 *
 * To add a new server:
 * 1. Create the package in shared/mcp-servers/{name}/
 * 2. Add it to the root workspaces array in package.json
 * 3. Add a workspace:* dependency in this CLI's package.json
 * 4. Add an entry here
 *
 * See .claude/skills/add-mcp-server/SKILL.md for the full guide.
 */
export const serverRegistry: McpServerDefinition[] = [
  {
    name: "design-tokens",
    description:
      "Proto Portal design system — tokens, themes, CSS variables, Tailwind classes, and usage guidance",
    packageName: "@proto-portal/mcp-server-design-tokens",
    createServer: async () => {
      const mod = await import("@proto-portal/mcp-server-design-tokens");
      return mod.createServer;
    },
  },
];

export function findServer(name: string): McpServerDefinition | undefined {
  return serverRegistry.find((s) => s.name === name);
}
