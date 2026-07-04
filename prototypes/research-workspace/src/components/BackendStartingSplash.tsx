// Full-screen "Starting…" splash shown while the scale-to-zero backend wakes.
// Used by BackendGate (guarding /workspace) and by sign-in actions that must
// wake the backend before navigating to the Cognito-authenticated /vault route.

export type SplashPhase = "starting" | "error";

interface Props {
  phase: SplashPhase;
  elapsed?: number;
  onRetry?: () => void;
}

export default function BackendStartingSplash({ phase, elapsed = 0, onRetry }: Props) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--spacing-xl, 24px)",
        background: "var(--color-surface)",
        color: "var(--color-on-surface)",
        fontFamily: "var(--font-sans, system-ui, sans-serif)",
      }}
    >
      <style>{`@keyframes rw-gate-pulse{0%,100%{opacity:.35;transform:scale(.85)}50%{opacity:1;transform:scale(1)}}`}</style>
      <div style={{ maxWidth: "28rem", textAlign: "center" }}>
        {phase === "error" ? (
          <>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 600, margin: 0 }}>
              The workspace didn’t wake in time
            </h1>
            <p
              style={{
                marginTop: "var(--spacing-md, 12px)",
                color: "var(--color-on-surface-variant)",
                lineHeight: 1.5,
              }}
            >
              It can take a moment to spin up after a period of inactivity. Give it
              another try.
            </p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                style={{
                  marginTop: "var(--spacing-xl, 24px)",
                  minHeight: "44px",
                  padding: "0 var(--spacing-xl, 24px)",
                  borderRadius: "var(--radius-md, 0.625rem)",
                  border: "none",
                  cursor: "pointer",
                  background: "var(--color-primary)",
                  color: "var(--color-on-primary)",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                }}
              >
                Try again
              </button>
            )}
          </>
        ) : (
          <>
            <div
              aria-hidden
              style={{
                width: "0.75rem",
                height: "0.75rem",
                margin: "0 auto var(--spacing-lg, 16px)",
                borderRadius: "9999px",
                background: "var(--color-primary)",
                animation: "rw-gate-pulse 1.2s ease-in-out infinite",
              }}
            />
            <h1 style={{ fontSize: "1.25rem", fontWeight: 600, margin: 0 }}>
              Starting the workspace…
            </h1>
            <p
              style={{
                marginTop: "var(--spacing-md, 12px)",
                color: "var(--color-on-surface-variant)",
                lineHeight: 1.5,
              }}
            >
              The research backend scales to zero when idle to save cost. Waking it
              up — this usually takes 20–40 seconds.
            </p>
            {elapsed > 0 && (
              <p
                style={{
                  marginTop: "var(--spacing-sm, 8px)",
                  fontSize: "0.8rem",
                  color: "var(--color-on-surface-variant)",
                  opacity: 0.7,
                }}
              >
                {elapsed}s elapsed
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
