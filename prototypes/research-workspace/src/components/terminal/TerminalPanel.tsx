import { useRef, useEffect, useCallback } from "react";
import { useTerminal } from "../../hooks/useTerminal";
import { Terminal as TerminalIcon, Wifi, WifiOff } from "lucide-react";
import "@xterm/xterm/css/xterm.css";

export default function TerminalPanel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { fitAddon, isConnected } = useTerminal(containerRef);

  // Re-fit terminal when the panel is resized
  const handleResize = useCallback(() => {
    if (fitAddon) {
      try {
        fitAddon.fit();
      } catch {
        // Container may not be visible
      }
    }
  }, [fitAddon]);

  // Watch for container size changes with ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      // Debounce slightly to avoid excessive fitting
      requestAnimationFrame(handleResize);
    });
    observer.observe(container);

    return () => observer.disconnect();
  }, [handleResize]);

  return (
    <div className="h-full flex flex-col bg-surface-container-lowest">
      {/* Terminal header */}
      <div className="flex items-center justify-between px-3 py-1 border-t border-outline-variant/20 bg-surface-container-low/50">
        <div className="flex items-center gap-1.5">
          <TerminalIcon className="w-3.5 h-3.5 text-on-surface-variant/60" />
          <span className="font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant/60">
            Terminal
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {isConnected ? (
            <Wifi className="w-3.5 h-3.5 text-domain-ml" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-error/60" />
          )}
          <span
            className={`font-label text-xs ${
              isConnected ? "text-domain-ml" : "text-error/60"
            }`}
          >
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>
      </div>

      {/* Terminal container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden px-1 py-1"
      />
    </div>
  );
}
