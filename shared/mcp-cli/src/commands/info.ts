import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { findServer, serverRegistry } from "../registry.js";

export async function showInfo(name: string): Promise<void> {
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

  // Connect via in-memory transport to introspect capabilities
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);

  const client = new Client(
    { name: "proto-mcp-info", version: "1.0.0" },
    { capabilities: {} }
  );
  await client.connect(clientTransport);

  console.error(`\nMCP Server: ${definition.name}`);
  console.error(`Package:    ${definition.packageName}`);
  console.error(`${definition.description}\n`);

  // List tools
  try {
    const { tools } = await client.listTools();
    console.error(`Tools (${tools.length}):`);
    for (const tool of tools) {
      console.error(`  ${tool.name}`);
      console.error(`    ${tool.description}`);
      if (tool.inputSchema?.properties) {
        const props = Object.entries(
          tool.inputSchema.properties as Record<string, { type?: string; enum?: string[]; description?: string }>
        );
        for (const [propName, propSchema] of props) {
          const enumStr = propSchema.enum
            ? ` [${propSchema.enum.join(", ")}]`
            : "";
          console.error(`    --${propName}${enumStr}: ${propSchema.description ?? ""}`);
        }
      }
    }
  } catch {
    console.error("  (no tools)");
  }

  console.error("");

  // List resources
  try {
    const { resources } = await client.listResources();
    console.error(`Resources (${resources.length}):`);
    for (const resource of resources) {
      console.error(`  ${resource.uri}`);
      console.error(`    ${resource.name}: ${resource.description ?? ""}`);
    }
  } catch {
    console.error("  (no resources)");
  }

  console.error("");

  // List prompts
  try {
    const { prompts } = await client.listPrompts();
    console.error(`Prompts (${prompts.length}):`);
    for (const prompt of prompts) {
      const argNames = prompt.arguments?.map((a) => a.name).join(", ") ?? "";
      console.error(`  ${prompt.name}${argNames ? `(${argNames})` : ""}`);
      console.error(`    ${prompt.description ?? ""}`);
    }
  } catch {
    console.error("  (no prompts)");
  }

  console.error("");

  await client.close();
  await server.close();
}
