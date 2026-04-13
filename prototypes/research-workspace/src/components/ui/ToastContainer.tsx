import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

let toastId = 0;

export function showToast(message: string, type: ToastType = "info") {
  window.dispatchEvent(
    new CustomEvent("show-toast", { detail: { message, type } })
  );
}

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const COLORS = {
  success: "border-l-green-500/60 bg-green-500/5",
  error: "border-l-red-500/60 bg-red-500/5",
  info: "border-l-primary/60 bg-primary/5",
};

const ICON_COLORS = {
  success: "text-green-400",
  error: "text-red-400",
  info: "text-primary",
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const { message, type } = (e as CustomEvent).detail;
      addToast(message, type);
    };
    window.addEventListener("show-toast", handler);
    return () => window.removeEventListener("show-toast", handler);
  }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => {
        const Icon = ICONS[toast.type];
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-2 px-3 py-2 rounded-lg border-l-2 border border-white/[0.08] backdrop-blur-xl shadow-xl max-w-sm animate-in slide-in-from-right ${COLORS[toast.type]}`}
            style={{
              backgroundColor: "rgba(26, 27, 32, 0.92)",
              animation: "slideIn 0.2s ease-out",
            }}
          >
            <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${ICON_COLORS[toast.type]}`} />
            <p className="font-label text-xs text-white/80 flex-1 leading-relaxed">
              {toast.message}
            </p>
            <button
              onClick={() => dismiss(toast.id)}
              className="p-0.5 text-white/20 hover:text-white/50 transition-colors flex-shrink-0"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
