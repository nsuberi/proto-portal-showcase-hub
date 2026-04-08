import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { findServer, serverRegistry } from "../registry.js";

export async function startServer(name: string): Promise<void> {
  const definition = findServer(name);

  if (!definition) {
    console.error(`Error: Unknown server "${name}".`);
    console.error(
      `Available servers: ${serverRegistry.map((s) => s.name).join(", ")}`
    );
    process.exit(1);
  }

  const factory = await definition.createServer();
  const server = factory();
  const transport = new StdioServerTransport();

  console.error(`Starting MCP server: ${definition.name}`);
  await server.connect(transport);
  console.error(`Server "${definition.name}" connected via stdio`);
}
