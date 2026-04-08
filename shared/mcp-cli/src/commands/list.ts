import { serverRegistry } from "../registry.js";

export function listServers(): void {
  console.error("\nAvailable MCP Servers:\n");

  const maxName = Math.max(...serverRegistry.map((s) => s.name.length));

  for (const server of serverRegistry) {
    const padded = server.name.padEnd(maxName + 2);
    console.error(`  ${padded}${server.description}`);
  }

  console.error(
    `\nUsage:\n  proto-mcp start <name>    Start a server (stdio transport)\n  proto-mcp info <name>     Show server tools, resources, and prompts\n`
  );
}
