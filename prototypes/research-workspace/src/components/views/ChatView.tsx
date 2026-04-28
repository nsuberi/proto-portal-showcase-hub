import ChatPanel from "../chat/ChatPanel";

interface ChatViewProps {
  onOpenActivity?: () => void;
}

export default function ChatView({ onOpenActivity }: ChatViewProps) {
  return (
    <div className="flex-1 flex justify-center h-full">
      <div className="w-full max-w-2xl h-full">
        <ChatPanel onOpenActivity={onOpenActivity} />
      </div>
    </div>
  );
}
