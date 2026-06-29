import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Send, Sprout, Search, Merge, Compass, Shield } from "lucide-react";
import TreeIcon from "./icons/TreeIcon";

interface Props {
  isAuthenticated: boolean;
}

const SUGGESTIONS = [
  { icon: Sprout, label: "Connect my experience to a new field", color: "text-primary" },
  { icon: Search, label: "Explore a research topic in depth", color: "text-leaf" },
  { icon: Merge, label: "Synthesize what I've learned", color: "text-branch" },
  { icon: Compass, label: "What should I explore next?", color: "text-tertiary" },
];

const PENDING_INTENT_KEY = "rw:pendingIntent";

/**
 * Input-led landing hero — the front door to the workspace, structured like
 * Claude's home. Typing a research intent hands off to the workspace (which
 * auto-sends it once connected). Unauthenticated users are routed to sign-in
 * first; their intent survives the round-trip via sessionStorage.
 */
export default function ResearchLauncher({ isAuthenticated }: Props) {
  const [input, setInput] = useState("");
  const navigate = useNavigate();

  const start = (text: string) => {
    const intent = text.trim();
    if (!intent) return;
    sessionStorage.setItem(PENDING_INTENT_KEY, intent);
    if (isAuthenticated) {
      navigate("/workspace");
    } else {
      window.location.href = "/prototypes/research-workspace/vault/";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    start(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      start(input);
    }
  };

  return (
    <section className="relative overflow-hidden border-b border-outline-variant/10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14 sm:py-20 flex flex-col items-center text-center">
        {/* Brand mark */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 flex items-center justify-center mb-5 sm:mb-6">
          <TreeIcon className="w-9 h-9 sm:w-11 sm:h-11 text-primary" strokeWidth={1.6} />
        </div>

        <h1 className="font-headline text-3xl sm:text-4xl font-bold text-on-surface mb-3">
          Organize your research ideas
        </h1>
        <p className="font-body text-lg sm:text-xl text-on-surface-variant/85 max-w-xl mb-8 sm:mb-10">
          Tell me what you want to learn. I'll investigate in real time, connect
          it to what you already know, and help you curate what matters.
        </p>

        {/* Research input */}
        <form onSubmit={handleSubmit} className="w-full max-w-2xl">
          <div className="flex items-end gap-2.5">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What do you want to research?"
              rows={1}
              autoFocus
              className="flex-1 resize-none bg-surface-bright border-1.5 border-outline-variant/50 rounded-2xl px-5 py-4 font-body text-base sm:text-lg text-on-surface placeholder:text-on-surface-variant/65 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all max-h-40 shadow-sm"
              style={{ minHeight: "60px" }}
            />
            <button
              type="submit"
              disabled={!input.trim()}
              aria-label="Start research"
              className="flex items-center justify-center w-[60px] h-[60px] rounded-2xl bg-primary text-on-primary disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/90 active:bg-primary/80 transition-colors shrink-0"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>

        {/* Suggestion chips */}
        <div className="flex flex-wrap gap-2.5 justify-center mt-6">
          {SUGGESTIONS.map((s) => (
            <button
              key={s.label}
              onClick={() => start(s.label)}
              className="inline-flex items-center gap-2.5 px-4 py-3 rounded-xl border border-outline-variant/40 bg-surface-container-lowest hover:bg-surface-container-low hover:border-primary/30 transition-all group"
            >
              <s.icon
                className={`w-4 h-4 ${s.color} flex-shrink-0 group-hover:scale-110 transition-transform`}
              />
              <span className="font-label text-sm text-on-surface-variant/80 group-hover:text-on-surface transition-colors">
                {s.label}
              </span>
            </button>
          ))}
        </div>

        <Link
          to="/security"
          className="inline-flex items-center gap-1.5 font-label text-sm text-on-surface-variant/65 hover:text-on-surface-variant/85 transition-colors mt-8"
        >
          <Shield className="w-3.5 h-3.5" />
          Learn about our security architecture
        </Link>
      </div>
    </section>
  );
}
