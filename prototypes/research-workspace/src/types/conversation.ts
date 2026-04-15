import type { Branch, Leaf, Flower, Root } from "./tree";

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  toolUses?: { tool: string; input: Record<string, unknown>; timestamp: string }[];
  timestamp: string;
}

export interface TreeNodeIds {
  branchIds: string[];
  leafIds: string[];
  flowerIds: string[];
  rootIds: string[];
}

export interface ConversationSummary {
  id: string;
  title: string;
  createdAt: string;
  lastMessageAt: string;
  messageCount: number;
  toolUseCount: number;
  treeNodes: TreeNodeIds;
}

export interface ConversationDetail {
  id: string;
  title: string;
  sessionId?: string;
  createdAt: string;
  lastMessageAt: string;
  messages: ConversationMessage[];
  toolUses: { tool: string; input: Record<string, unknown>; timestamp: string }[];
  treeNodes: TreeNodeIds;
  treeDetails: {
    branches: Branch[];
    leaves: Leaf[];
    flowers: Flower[];
    roots: Root[];
  };
}
