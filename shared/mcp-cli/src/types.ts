import type { Server } from "@modelcontextprotocol/sdk/server/index.js";

/**
 * Factory function that every MCP server package must export.
 * Returns a fully configured Server instance ready for transport connection.
 */
export type McpServerFactory = () => Server;

/**
 * Registry entry describing an available MCP server.
 */
export interface McpServerDefinition {
  /** Short name used in CLI commands (e.g., "design-tokens") */
  name: string;
  /** Human-readable description */
  description: string;
  /** The workspace package name (e.g., "@proto-portal/mcp-server-design-tokens") */
  packageName: string;
  /** Lazy import — only loads the server package when actually needed */
  createServer: () => Promise<McpServerFactory>;
}
