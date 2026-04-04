#!/usr/bin/env node

import { listServers } from "./commands/list.js";
import { startServer } from "./commands/start.js";
import { showInfo } from "./commands/info.js";

const USAGE = `proto-mcp — Run MCP servers from the Proto Portal monorepo

Usage:
  proto-mcp list              List available servers
  proto-mcp start <name>      Start a server (stdio transport)
  proto-mcp info <name>       Show server tools, resources, and prompts
  proto-mcp --help            Show this help message
`;

async function main(): Promise<void> {
  const [command, serverName] = process.argv.slice(2);

  switch (command) {
    case "list":
      listServers();
      break;

    case "start":
      if (!serverName) {
        console.error("Error: Server name required.\n");
        console.error("Usage: proto-mcp start <name>");
        console.error('Run "proto-mcp list" to see available servers.');
        process.exit(1);
      }
      await startServer(serverName);
      break;

    case "info":
      if (!serverName) {
        console.error("Error: Server name required.\n");
        console.error("Usage: proto-mcp info <name>");
        console.error('Run "proto-mcp list" to see available servers.');
        process.exit(1);
      }
      await showInfo(serverName);
      break;

    case "--help":
    case "-h":
    case undefined:
      console.error(USAGE);
      break;

    default:
      console.error(`Unknown command: ${command}\n`);
      console.error(USAGE);
      process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
