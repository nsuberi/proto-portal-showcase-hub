import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { tokens } from "@/design-system/tokens";

interface LogEntry {
  id: number;
  timestamp: string;
  message: string;
  level: "info" | "action" | "success" | "warn";
}

interface LoggerContextValue {
  log: (message: string, level?: LogEntry["level"]) => void;
  entries: LogEntry[];
}

const LoggerContext = createContext<LoggerContextValue>({
  log: () => {},
  entries: [],
});

export function useAppLogger() {
  return useContext(LoggerContext);
}

let nextId = 0;

export function AppLoggerProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<LogEntry[]>([]);

  const log = useCallback((message: string, level: LogEntry["level"] = "info") => {
    const now = new Date();
    const timestamp = now.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }) + `.${String(now.getMilliseconds()).padStart(3, "0")}`;

    setEntries((prev) => [
      ...prev,
      { id: nextId++, timestamp, message, level },
    ]);
  }, []);

  return (
    <LoggerContext.Provider value={{ log, entries }}>
      {children}
    </LoggerContext.Provider>
  );
}

const levelColors: Record<LogEntry["level"], string> = {
  info: tokens.color.onSurfaceVariant,
  action: tokens.color.primary,
  success: "#27C93F",
  warn: tokens.color.tertiary,
};

const levelPrefixes: Record<LogEntry["level"], string> = {
  info: "INFO",
  action: "ACT",
  success: "OK",
  warn: "WARN",
};

export function AppLoggerPanel() {
  const { entries } = useAppLogger();
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries, isOpen]);

  const unreadCount = entries.length;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 16,
        right: 16,
        zIndex: 9999,
        fontFamily: tokens.font.mono,
        fontSize: 11,
      }}
    >
      {isOpen && (
        <div
          style={{
            width: 360,
            maxHeight: 320,
            background: tokens.color.surfaceContainerLowest,
            border: `1px solid ${tokens.color.outlineVariant}`,
            borderRadius: tokens.radius.lg,
            overflow: "hidden",
            marginBottom: 8,
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 12px",
              background: tokens.color.surfaceContainerLow,
              borderBottom: `1px solid ${tokens.color.outlineVariant}`,
            }}
          >
            <span
              style={{
                fontFamily: tokens.font.label,
                fontSize: 11,
                fontWeight: 600,
                color: tokens.color.onSurfaceVariant,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              Application Logs
            </span>
            <span
              style={{
                fontSize: 10,
                color: tokens.color.outline,
              }}
            >
              {entries.length} entries
            </span>
          </div>

          {/* Log entries */}
          <div
            ref={scrollRef}
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "6px 0",
              maxHeight: 268,
            }}
          >
            {entries.length === 0 ? (
              <div
                style={{
                  padding: "20px 12px",
                  textAlign: "center",
                  color: tokens.color.outline,
                  fontSize: 11,
                }}
              >
                Interact with the app to see logs...
              </div>
            ) : (
              entries.map((entry) => (
                <div
                  key={entry.id}
                  style={{
                    padding: "3px 12px",
                    lineHeight: 1.5,
                    display: "flex",
                    gap: 8,
                    alignItems: "baseline",
                  }}
                >
                  <span style={{ color: tokens.color.outline, flexShrink: 0 }}>
                    {entry.timestamp}
                  </span>
                  <span
                    style={{
                      color: levelColors[entry.level],
                      fontWeight: 600,
                      flexShrink: 0,
                      minWidth: 32,
                    }}
                  >
                    {levelPrefixes[entry.level]}
                  </span>
                  <span style={{ color: tokens.color.onSurface }}>
                    {entry.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 14px",
          background: isOpen
            ? tokens.color.surfaceContainerLow
            : tokens.color.surfaceContainerLowest,
          border: `1px solid ${tokens.color.outlineVariant}`,
          borderRadius: tokens.radius.full,
          cursor: "pointer",
          color: tokens.color.onSurfaceVariant,
          fontFamily: tokens.font.label,
          fontSize: 11,
          fontWeight: 500,
          marginLeft: "auto",
          boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
          transition: "all 0.2s",
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: entries.length > 0 ? "#27C93F" : tokens.color.outline,
            animation: entries.length > 0 ? "pulse 2s infinite" : "none",
          }}
        />
        {isOpen ? "Hide Logs" : "Logs"}
        {!isOpen && unreadCount > 0 && (
          <span
            style={{
              background: tokens.color.primaryContainer,
              color: tokens.color.primary,
              borderRadius: tokens.radius.full,
              padding: "1px 6px",
              fontSize: 10,
              fontWeight: 600,
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
