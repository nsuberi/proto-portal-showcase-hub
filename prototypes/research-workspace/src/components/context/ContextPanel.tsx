import { type ReactNode } from "react";
import { X } from "lucide-react";

interface ContextPanelProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export default function ContextPanel({
  title,
  onClose,
  children,
}: ContextPanelProps) {
  return (
    <div className="context-panel h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant">
        <span className="font-label text-sm font-semibold text-on-surface">
          {title}
        </span>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-on-surface-variant/80 hover:text-on-surface-variant hover:bg-on-surface/[0.04] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
