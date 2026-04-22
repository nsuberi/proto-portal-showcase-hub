import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { X } from "lucide-react";

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  header?: ReactNode;
  children: ReactNode;
  /** Max height of the sheet. Defaults to "75vh". */
  maxHeight?: string;
  /** Duration of the close animation in ms. Defaults to 200. */
  closeAnimationMs?: number;
  className?: string;
  backdropClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  header,
  children,
  maxHeight = "75vh",
  closeAnimationMs = 200,
  className,
  backdropClassName,
  headerClassName,
  bodyClassName,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [closing, setClosing] = useState(false);

  const handleClose = useCallback(() => {
    setClosing(true);
    window.setTimeout(() => {
      setClosing(false);
      onClose();
    }, closeAnimationMs);
  }, [onClose, closeAnimationMs]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, handleClose]);

  useEffect(() => {
    if (isOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [isOpen]);

  if (!isOpen && !closing) return null;

  const renderDefaultHeader = header === undefined && title !== undefined;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className={`absolute inset-0 transition-opacity duration-200 ${
          closing ? "opacity-0" : "opacity-100"
        } ${backdropClassName ?? "bg-black/20"}`.trim()}
        onClick={handleClose}
      />

      <div
        ref={sheetRef}
        className={`absolute bottom-0 left-0 right-0 flex flex-col ${
          closing ? "translate-y-full" : "translate-y-0"
        } transition-transform duration-200 ${className ?? ""}`.trim()}
        style={{ maxHeight }}
      >
        <div
          className="flex justify-center pt-2 pb-1 cursor-pointer"
          onClick={handleClose}
        >
          <div className="w-8 h-1 rounded-full opacity-30 bg-current" />
        </div>

        {header !== undefined && (
          <div className={`flex-shrink-0 ${headerClassName ?? ""}`.trim()}>
            {header}
          </div>
        )}

        {renderDefaultHeader && (
          <div
            className={`flex-shrink-0 flex items-center justify-between px-5 py-2 ${headerClassName ?? ""}`.trim()}
          >
            <span className="text-sm font-semibold">{title}</span>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close"
              className="p-2 -mr-2 rounded-full opacity-60 hover:opacity-100 transition-opacity"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <div
          className={`flex-1 min-h-0 overflow-y-auto overscroll-contain ${bodyClassName ?? ""}`.trim()}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
