import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { registerTools } from "./tools.js";
import { registerResources } from "./resources.js";
import { registerPrompts } from "./prompts.js";

export function createServer(): Server {
  const server = new Server(
    { name: "proto-portal-design-tokens", version: "1.0.0" },
    { capabilities: { tools: {}, resources: {}, prompts: {} } }
  );

  registerTools(server);
  registerResources(server);
  registerPrompts(server);

  return server;
}
