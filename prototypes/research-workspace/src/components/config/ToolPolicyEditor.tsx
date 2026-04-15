import { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Plus,
  Trash2,
  ShieldCheck,
  ShieldOff,
  FileText,
  Pencil,
  Terminal,
  Search,
  Globe,
  Activity,
  Zap,
  BookOpen,
  Eye,
  AlertTriangle,
  Check,
} from "lucide-react";
import { showToast } from "../ui/ToastContainer";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ToolRule {
  id: string;
  tool: string;
  parameter: string;
  condition: "matches" | "not_matches";
  action: "block";
  pattern: string;
  label: string;
}

interface ToolPolicy {
  blocked_tools: string[];
  rules: ToolRule[];
  notes?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BASE_URL = import.meta.env.DEV
  ? "http://localhost:8080"
  : "/prototypes/research-workspace/vault";

const TOOL_META: {
  name: string;
  icon: typeof FileText;
  parameter: string;
  paramLabel: string;
  placeholder: string;
}[] = [
  { name: "Read", icon: FileText, parameter: "file_path", paramLabel: "file path", placeholder: "^reviews/" },
  { name: "Write", icon: Pencil, parameter: "file_path", paramLabel: "file path", placeholder: "^(reviews|syntheses)/" },
  { name: "Edit", icon: Pencil, parameter: "file_path", paramLabel: "file path", placeholder: "^(reviews|syntheses)/" },
  { name: "Bash", icon: Terminal, parameter: "command", paramLabel: "command", placeholder: "rm\\s+-rf|sudo" },
  { name: "Glob", icon: Search, parameter: "pattern", paramLabel: "pattern", placeholder: "\\*\\*/\\*\\.py" },
  { name: "Grep", icon: Search, parameter: "pattern", paramLabel: "pattern", placeholder: "password|secret" },
  { name: "WebFetch", icon: Globe, parameter: "url", paramLabel: "URL", placeholder: "^https://(arxiv\\.org|scholar\\.google\\.com)" },
  { name: "WebSearch", icon: Globe, parameter: "query", paramLabel: "query", placeholder: "transformer architecture" },
  { name: "Agent", icon: Activity, parameter: "prompt", paramLabel: "prompt", placeholder: "" },
];

const TOOL_NAMES = TOOL_META.map((t) => t.name);

interface Preset {
  label: string;
  icon: typeof Zap;
  description: string;
  policy: ToolPolicy;
}

const PRESETS: Record<string, Preset> = {
  full_access: {
    label: "Full Access",
    icon: Zap,
    description: "All tools enabled, no restrictions",
    policy: { blocked_tools: [], rules: [], notes: "Full access — no restrictions" },
  },
  research_only: {
    label: "Research Only",
    icon: BookOpen,
    description: "Read + fetch from allowed sites, no shell or writes",
    policy: {
      blocked_tools: ["Bash", "Write", "Edit"],
      rules: [
        {
          id: "preset-research-fetch",
          tool: "WebFetch",
          parameter: "url",
          condition: "not_matches",
          action: "block",
          pattern: "^https://(arxiv\\.org|scholar\\.google\\.com|en\\.wikipedia\\.org)",
          label: "Only arXiv, Google Scholar, and Wikipedia",
        },
      ],
      notes: "Research only — read and fetch from approved sources",
    },
  },
  read_only: {
    label: "Read Only",
    icon: Eye,
    description: "Can only read files and search",
    policy: {
      blocked_tools: ["Write", "Edit", "Bash", "WebFetch", "WebSearch", "Agent"],
      rules: [],
      notes: "Read only — no writes, no network, no agents",
    },
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  return "r" + Math.random().toString(36).slice(2, 9);
}

function isValidRegex(pattern: string): boolean {
  try {
    new RegExp(pattern);
    return true;
  } catch {
    return false;
  }
}

function getToolMeta(name: string) {
  return TOOL_META.find((t) => t.name === name);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ToolToggleGrid({
  blockedTools,
  onToggle,
}: {
  blockedTools: Set<string>;
  onToggle: (tool: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {TOOL_META.map(({ name, icon: Icon }) => {
        const blocked = blockedTools.has(name);
        return (
          <button
            key={name}
            onClick={() => onToggle(name)}
            title={blocked ? `${name} — blocked (click to allow)` : `${name} — allowed (click to block)`}
            className={`inline-flex items-center gap-1.5 font-label text-[11px] px-2 py-1 rounded-md transition-all cursor-pointer select-none ${
              blocked
                ? "bg-error/15 text-error/70 line-through hover:bg-error/25"
                : "bg-on-surface/[0.06] text-on-surface-variant hover:bg-on-surface/[0.12] hover:text-on-surface"
            }`}
          >
            {blocked ? (
              <ShieldOff className="w-3 h-3" />
            ) : (
              <Icon className="w-3 h-3" />
            )}
            {name}
          </button>
        );
      })}
    </div>
  );
}

function RuleRow({
  rule,
  onDelete,
}: {
  rule: ToolRule;
  onDelete: () => void;
}) {
  const meta = getToolMeta(rule.tool);
  const Icon = meta?.icon || Activity;
  const conditionLabel =
    rule.condition === "not_matches" ? "must match" : "must not match";

  return (
    <div className="group flex items-start gap-2 py-1.5 px-2 rounded-lg hover:bg-on-surface/[0.04] transition-colors">
      <Icon className="w-3.5 h-3.5 text-primary/60 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-label text-[11px] text-on-surface/70 font-medium">
            {rule.tool}
          </span>
          <span className="font-label text-[9px] text-on-surface-variant/40">
            {meta?.paramLabel || rule.parameter}
          </span>
          <span className="font-label text-[9px] text-on-surface-variant/30">
            {conditionLabel}
          </span>
        </div>
        <code className="font-mono text-[10px] text-primary/60 block truncate">
          {rule.pattern}
        </code>
        {rule.label && (
          <p className="font-label text-[9px] text-on-surface-variant/40 mt-0.5">
            {rule.label}
          </p>
        )}
      </div>
      <button
        onClick={onDelete}
        className="p-1 text-on-surface-variant/30 hover:text-error/70 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
        title="Delete rule"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}

function AddRuleForm({ onAdd }: { onAdd: (rule: ToolRule) => void }) {
  const [open, setOpen] = useState(false);
  const [tool, setTool] = useState("WebFetch");
  const [condition, setCondition] = useState<"matches" | "not_matches">("not_matches");
  const [pattern, setPattern] = useState("");
  const [label, setLabel] = useState("");

  const meta = getToolMeta(tool);
  const regexValid = pattern === "" || isValidRegex(pattern);

  const handleAdd = () => {
    if (!pattern || !regexValid) return;
    onAdd({
      id: generateId(),
      tool,
      parameter: meta?.parameter || "unknown",
      condition,
      action: "block",
      pattern,
      label: label || `${tool} ${condition === "not_matches" ? "allowlist" : "blocklist"}`,
    });
    setPattern("");
    setLabel("");
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 font-label text-[10px] text-primary/50 hover:text-primary/80 transition-colors mt-1 px-2 py-1 rounded hover:bg-on-surface/[0.04]"
      >
        <Plus className="w-3 h-3" />
        Add parameter rule
      </button>
    );
  }

  return (
    <div className="mt-2 p-3 rounded-lg bg-on-surface/[0.03] border border-outline-variant/30 space-y-2.5">
      {/* Tool selector */}
      <div>
        <label className="font-label text-[9px] text-on-surface-variant/40 uppercase tracking-wider block mb-1">
          Tool
        </label>
        <div className="flex flex-wrap gap-1">
          {TOOL_NAMES.filter((n) => n !== "Agent").map((name) => (
            <button
              key={name}
              onClick={() => setTool(name)}
              className={`font-label text-[10px] px-2 py-0.5 rounded transition-colors ${
                tool === name
                  ? "bg-primary/20 text-primary"
                  : "bg-on-surface/[0.04] text-on-surface-variant/60 hover:text-on-surface-variant"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Condition */}
      <div>
        <label className="font-label text-[9px] text-on-surface-variant/40 uppercase tracking-wider block mb-1">
          Condition on {meta?.paramLabel || "parameter"}
        </label>
        <div className="flex gap-1">
          <button
            onClick={() => setCondition("not_matches")}
            className={`font-label text-[10px] px-2 py-1 rounded transition-colors ${
              condition === "not_matches"
                ? "bg-primary/20 text-primary"
                : "bg-on-surface/[0.04] text-on-surface-variant/60 hover:text-on-surface-variant"
            }`}
          >
            Must match (allowlist)
          </button>
          <button
            onClick={() => setCondition("matches")}
            className={`font-label text-[10px] px-2 py-1 rounded transition-colors ${
              condition === "matches"
                ? "bg-primary/20 text-primary"
                : "bg-on-surface/[0.04] text-on-surface-variant/60 hover:text-on-surface-variant"
            }`}
          >
            Must not match (blocklist)
          </button>
        </div>
      </div>

      {/* Pattern */}
      <div>
        <label className="font-label text-[9px] text-on-surface-variant/40 uppercase tracking-wider block mb-1">
          Regex pattern
        </label>
        <input
          type="text"
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
          placeholder={meta?.placeholder || "pattern..."}
          className={`w-full bg-on-surface/[0.04] font-mono text-xs px-2.5 py-1.5 rounded border transition-colors focus:outline-none ${
            !regexValid
              ? "border-error/50 focus:border-error/70 text-error/80"
              : "border-outline-variant/30 focus:border-primary/40 text-on-surface/80"
          }`}
        />
        {!regexValid && (
          <p className="flex items-center gap-1 font-label text-[9px] text-error/60 mt-0.5">
            <AlertTriangle className="w-2.5 h-2.5" />
            Invalid regex
          </p>
        )}
      </div>

      {/* Label */}
      <div>
        <label className="font-label text-[9px] text-on-surface-variant/40 uppercase tracking-wider block mb-1">
          Description (optional)
        </label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Only allow arXiv and Scholar"
          className="w-full bg-on-surface/[0.04] font-label text-xs px-2.5 py-1.5 rounded border border-outline-variant/40 focus:border-primary/40 focus:outline-none text-on-surface/80 transition-colors"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={handleAdd}
          disabled={!pattern || !regexValid}
          className="flex items-center gap-1 font-label text-[11px] px-3 py-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Plus className="w-3 h-3" />
          Add rule
        </button>
        <button
          onClick={() => setOpen(false)}
          className="font-label text-[11px] px-3 py-1.5 rounded-lg text-on-surface-variant/60 hover:text-on-surface-variant hover:bg-on-surface/[0.04] transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface ToolPolicyEditorProps {
  onClose: () => void;
}

export default function ToolPolicyEditor({ onClose }: ToolPolicyEditorProps) {
  const [policy, setPolicy] = useState<ToolPolicy>({
    blocked_tools: [],
    rules: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch current policy on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/vault/config`);
        if (res.ok) {
          const config = await res.json();
          setPolicy({
            blocked_tools: config.toolPolicy?.blocked_tools || [],
            rules: config.toolPolicy?.rules || [],
            notes: config.toolPolicy?.notes,
          });
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Debounced save
  const savePolicy = useCallback(
    (updated: ToolPolicy) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        setSaving(true);
        try {
          const res = await fetch(`${BASE_URL}/api/vault/tool-policy`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updated),
          });
          if (res.ok) {
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
            window.dispatchEvent(new CustomEvent("tool-policy-updated"));
          } else {
            const err = await res.json().catch(() => ({}));
            showToast(err.error || "Failed to save policy", "error");
          }
        } catch {
          showToast("Failed to save policy", "error");
        } finally {
          setSaving(false);
        }
      }, 300);
    },
    []
  );

  const updatePolicy = useCallback(
    (updater: (prev: ToolPolicy) => ToolPolicy) => {
      setPolicy((prev) => {
        const next = updater(prev);
        savePolicy(next);
        return next;
      });
    },
    [savePolicy]
  );

  const toggleTool = useCallback(
    (tool: string) => {
      updatePolicy((prev) => {
        const blocked = new Set(prev.blocked_tools);
        if (blocked.has(tool)) {
          blocked.delete(tool);
        } else {
          blocked.add(tool);
        }
        return { ...prev, blocked_tools: [...blocked] };
      });
    },
    [updatePolicy]
  );

  const addRule = useCallback(
    (rule: ToolRule) => {
      updatePolicy((prev) => ({
        ...prev,
        rules: [...prev.rules, rule],
      }));
    },
    [updatePolicy]
  );

  const deleteRule = useCallback(
    (id: string) => {
      updatePolicy((prev) => ({
        ...prev,
        rules: prev.rules.filter((r) => r.id !== id),
      }));
    },
    [updatePolicy]
  );

  const applyPreset = useCallback(
    (key: string) => {
      const preset = PRESETS[key];
      if (!preset) return;
      updatePolicy(() => ({ ...preset.policy }));
      showToast(`Applied "${preset.label}" preset`, "success");
    },
    [updatePolicy]
  );

  const blockedTools = new Set(policy.blocked_tools);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/10 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-[460px] max-h-[85vh] rounded-xl bg-[#1a1b20] border border-outline-variant/40 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-outline-variant/30 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span className="font-label text-sm font-semibold text-on-surface">
              Tool Policy
            </span>
          </div>
          <div className="flex items-center gap-2">
            {saving && (
              <span className="font-label text-[10px] text-on-surface-variant/40 animate-pulse">
                Saving...
              </span>
            )}
            {saved && !saving && (
              <span className="flex items-center gap-1 font-label text-[10px] text-accent-success/70">
                <Check className="w-3 h-3" />
                Saved
              </span>
            )}
            <button
              onClick={onClose}
              className="p-1 text-on-surface-variant/40 hover:text-on-surface-variant transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <ShieldCheck className="w-8 h-8 text-on-surface-variant/15 mb-2 animate-pulse" />
              <p className="font-label text-[10px] text-on-surface-variant/30">
                Loading policy...
              </p>
            </div>
          ) : (
            <>
              {/* Presets */}
              <div>
                <label className="font-label text-[9px] text-on-surface-variant/40 uppercase tracking-wider block mb-2">
                  Presets
                </label>
                <div className="flex gap-1.5">
                  {Object.entries(PRESETS).map(([key, preset]) => {
                    const Icon = preset.icon;
                    return (
                      <button
                        key={key}
                        onClick={() => applyPreset(key)}
                        title={preset.description}
                        className="flex items-center gap-1.5 font-label text-[10px] px-2.5 py-1.5 rounded-lg bg-on-surface/[0.04] text-on-surface-variant/80 hover:bg-primary/15 hover:text-primary transition-colors"
                      >
                        <Icon className="w-3 h-3" />
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tool toggles */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-label text-[9px] text-on-surface-variant/40 uppercase tracking-wider">
                    Tool access
                  </label>
                  <span className="font-label text-[9px] text-on-surface-variant/30">
                    {TOOL_NAMES.length - blockedTools.size}/{TOOL_NAMES.length} allowed
                  </span>
                </div>
                <ToolToggleGrid blockedTools={blockedTools} onToggle={toggleTool} />
                {blockedTools.size > 0 && (
                  <p className="flex items-center gap-1 font-label text-[9px] text-error/40 mt-2">
                    <ShieldOff className="w-3 h-3" />
                    {blockedTools.size} tool{blockedTools.size > 1 ? "s" : ""} will be
                    blocked for all invocations
                  </p>
                )}
              </div>

              {/* Parameter rules */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-label text-[9px] text-on-surface-variant/40 uppercase tracking-wider">
                    Parameter rules
                  </label>
                  <span className="font-label text-[9px] text-on-surface-variant/30">
                    {policy.rules.length} rule{policy.rules.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <p className="font-label text-[9px] text-on-surface-variant/30 mb-2">
                  Fine-grained rules that inspect tool parameters before allowing execution.
                </p>

                {policy.rules.length > 0 && (
                  <div className="space-y-0.5 mb-1">
                    {policy.rules.map((rule) => (
                      <RuleRow
                        key={rule.id}
                        rule={rule}
                        onDelete={() => deleteRule(rule.id)}
                      />
                    ))}
                  </div>
                )}

                <AddRuleForm onAdd={addRule} />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-outline-variant/30 flex-shrink-0">
          <p className="font-label text-[9px] text-on-surface-variant/30 leading-relaxed">
            Policy changes take effect immediately for new tool calls. Active runs will
            pick up changes on their next tool invocation.
          </p>
        </div>
      </div>
    </div>
  );
}
