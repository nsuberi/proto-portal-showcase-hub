import { useMemo } from "react";
import type { ChatMessage } from "./useChat";

export type ConversationPhase =
  | "idle"        // no messages yet
  | "intending"   // user expressing a learning intention
  | "exploring"   // general Q&A, no special surface needed
  | "researching" // agent running tool calls
  | "reviewing"   // agent produced a file artifact
  | "connecting"  // user asking how things relate
  | "reflecting"; // user asking to see their tree

export interface PhaseResult {
  phase: ConversationPhase;
  /** File path detected in reviewing phase */
  reviewFilePath?: string;
}

const INTENDING_PATTERNS = [
  /i want to (learn|understand|explore|know|study|research|dive into)/i,
  /i('d| would) like to (learn|understand|explore|know|study)/i,
  /let('s| us) (explore|learn|study|look into|research)/i,
  /can you (help me|teach me|show me how to) (learn|understand)/i,
  /i('m| am) (interested in|curious about)/i,
];

const CONNECTING_PATTERNS = [
  /how does .+ (connect|relate|link|tie) to/i,
  /what('s| is) the (connection|relationship|link) between/i,
  /how are .+ and .+ (related|connected)/i,
];

const REFLECTING_PATTERNS = [
  /show me my (tree|garden|knowledge|progress|map)/i,
  /what have i (learned|explored|studied)/i,
  /what does my (tree|garden|knowledge map) look like/i,
];

function extractFilePath(message: ChatMessage): string | undefined {
  if (!message.toolUses) return undefined;
  for (const tu of message.toolUses) {
    if (tu.tool === "Write" || tu.tool === "Edit") {
      // The description is "Writing /path/to/file" or "Editing /path/to/file"
      const match = tu.description.match(/(?:Writing|Editing) (.+)/);
      if (match) return match[1];
    }
  }
  return undefined;
}

export function useConversationPhase(
  messages: ChatMessage[],
  isStreaming: boolean,
): PhaseResult {
  return useMemo(() => {
    if (messages.length === 0) return { phase: "idle" as const };

    const lastMessage = messages[messages.length - 1];

    // If currently streaming with tool uses → researching
    if (
      isStreaming &&
      lastMessage.role === "assistant" &&
      lastMessage.toolUses &&
      lastMessage.toolUses.length > 0
    ) {
      return { phase: "researching" as const };
    }

    // Check for file artifacts in the most recent assistant message
    if (lastMessage.role === "assistant" && !isStreaming) {
      const filePath = extractFilePath(lastMessage);
      if (filePath) {
        return { phase: "reviewing" as const, reviewFilePath: filePath };
      }
    }

    // Check the most recent user message for intent signals
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMsg) {
      const text = lastUserMsg.content;

      if (REFLECTING_PATTERNS.some((p) => p.test(text))) {
        return { phase: "reflecting" as const };
      }

      if (CONNECTING_PATTERNS.some((p) => p.test(text))) {
        return { phase: "connecting" as const };
      }

      if (INTENDING_PATTERNS.some((p) => p.test(text))) {
        return { phase: "intending" as const };
      }
    }

    return { phase: "exploring" as const };
  }, [messages, isStreaming]);
}
