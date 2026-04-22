import type { ReactNode } from "react";
import { X } from "lucide-react";

export interface ContextPanelProps {
  title?: string;
  onClose?: () => void;
  header?: ReactNode;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
}

export function ContextPanel({
  title,
  onClose,
  header,
  children,
  className,
  headerClassName,
  bodyClassName,
}: ContextPanelProps) {
  const renderDefaultHeader = header === undefined && (title || onClose);

  return (
    <div className={`h-full flex flex-col min-h-0 ${className ?? ""}`.trim()}>
      {header !== undefined && (
        <div
          className={`flex-shrink-0 ${headerClassName ?? ""}`.trim()}
        >
          {header}
        </div>
      )}

      {renderDefaultHeader && (
        <div
          className={`flex-shrink-0 flex items-center justify-between px-4 py-3 ${headerClassName ?? ""}`.trim()}
        >
          {title && (
            <span className="text-sm font-semibold">{title}</span>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="p-1 rounded-md opacity-60 hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      <div
        className={`flex-1 min-h-0 overflow-y-auto ${bodyClassName ?? ""}`.trim()}
      >
        {children}
      </div>
    </div>
  );
}
