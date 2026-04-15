import { type ReactNode, useEffect, useRef, useCallback, useState } from "react";
import { X } from "lucide-react";

interface MobileBottomSheetProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export default function MobileBottomSheet({
  title,
  isOpen,
  onClose,
  children,
}: MobileBottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [closing, setClosing] = useState(false);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onClose();
    }, 200);
  }, [onClose]);

  // Close on escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, handleClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

  if (!isOpen && !closing) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-on-surface/20 transition-opacity duration-200 ${
          closing ? "opacity-0" : "opacity-100"
        }`}
        onClick={handleClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={`mobile-bottom-sheet absolute bottom-0 left-0 right-0 flex flex-col ${
          closing ? "mobile-bottom-sheet-closing" : ""
        }`}
        style={{ maxHeight: "75vh" }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2 pb-1" onClick={handleClose}>
          <div className="w-8 h-1 rounded-full bg-on-surface-variant/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-2">
          <span className="font-label text-sm font-semibold text-on-surface">
            {title}
          </span>
          <button
            onClick={handleClose}
            className="p-2 -mr-2 rounded-full text-on-surface-variant/50 active:bg-on-surface/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain pb-safe">
          {children}
        </div>
      </div>
    </div>
  );
}
