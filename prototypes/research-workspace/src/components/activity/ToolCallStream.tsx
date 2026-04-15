import { useRef, useEffect } from "react";
import type { ToolCall } from "../../types/tool-calls";
import ToolCallCard from "./ToolCallCard";
import { Activity } from "lucide-react";

interface ToolCallStreamProps {
  toolCalls: ToolCall[];
}

export default function ToolCallStream({ toolCalls }: ToolCallStreamProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);

  // Auto-scroll when new events arrive
  useEffect(() => {
    if (toolCalls.length > prevCountRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    prevCountRef.current = toolCalls.length;
  }, [toolCalls.length]);

  if (toolCalls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <Activity className="w-6 h-6 text-white/10 mb-2" />
        <p className="font-label text-[10px] text-white/25">
          No tool activity yet for this session.
        </p>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto">
      {toolCalls.map((call) => (
        <ToolCallCard key={call.id} call={call} />
      ))}
    </div>
  );
}
