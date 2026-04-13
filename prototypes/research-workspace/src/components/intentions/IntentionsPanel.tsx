import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  BookOpen,
  GitMerge,
  ClipboardCheck,
  Trash2,
  ChevronDown,
  ChevronRight,
  Loader2,
  FileText,
  X,
  Repeat,
  KeyRound,
  Play,
  Pencil,
  Check,
} from "lucide-react";
import { useVaultTree, type VaultNode } from "../../hooks/useVaultApi";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type IntentionType = "research" | "synthesis" | "review";

interface RecurringSchedule {
  timesPerDay: number;
  endDate?: string; // ISO date — omit for indefinite
}

interface Intention {
  id: string;
  type: IntentionType;
  title: string;
  description: string;
  schedule?: RecurringSchedule;
  status: "pending" | "in_progress" | "completed";
  documents?: string[]; // file paths — for review type
  createdAt: string;
}

const BASE_URL = import.meta.env.DEV
  ? "http://localhost:8080"
  : "/prototypes/research-workspace/vault";

const INTENTIONS_PATH = ".intentions.json";

// ---------------------------------------------------------------------------
// Data helpers — stored as a JSON file in the vault
// ---------------------------------------------------------------------------

async function loadIntentions(): Promise<Intention[]> {
  try {
    const res = await fetch(
      `${BASE_URL}/api/vault/files/${encodeURIComponent(INTENTIONS_PATH)}`
    );
    if (!res.ok) return [];
    const text = await res.text();
    return JSON.parse(text) as Intention[];
  } catch {
    return [];
  }
}

async function saveIntentions(items: Intention[]): Promise<void> {
  await fetch(
    `${BASE_URL}/api/vault/files/${encodeURIComponent(INTENTIONS_PATH)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(items, null, 2),
    }
  );
}

// ---------------------------------------------------------------------------
// Type metadata
// ---------------------------------------------------------------------------

const TYPE_META: Record<
  IntentionType,
  { label: string; icon: typeof BookOpen; color: string; desc: string }
> = {
  research: {
    label: "Research",
    icon: BookOpen,
    color: "text-primary",
    desc: "Which papers to research next",
  },
  synthesis: {
    label: "Synthesis",
    icon: GitMerge,
    color: "text-tertiary",
    desc: "Synthesize findings across papers",
  },
  review: {
    label: "Review",
    icon: ClipboardCheck,
    color: "text-secondary",
    desc: "Review docs, produce code & diagrams",
  },
};

const FREQUENCY_OPTIONS = [
  { value: 1, label: "1x / day" },
  { value: 2, label: "2x / day" },
  { value: 4, label: "4x / day" },
  { value: 8, label: "8x / day" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function flattenFiles(node: VaultNode, acc: string[] = []): string[] {
  if (node.type === "file") acc.push(node.path);
  if (node.children) for (const child of node.children) flattenFiles(child, acc);
  return acc;
}

function formatSchedule(s: RecurringSchedule): string {
  const freq = `${s.timesPerDay}x/day`;
  if (s.endDate) return `${freq} until ${new Date(s.endDate).toLocaleDateString()}`;
  return `${freq}, ongoing`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function buildPrompt(item: Intention): string {
  const parts: string[] = [];

  if (item.type === "research") {
    parts.push(`Use the research skill to analyze: ${item.title}.`);
    if (item.description) parts.push(item.description);
    parts.push("Save the review to reviews/ in the vault.");
  } else if (item.type === "synthesis") {
    parts.push(`Use the research skill to synthesize findings: ${item.title}.`);
    if (item.description) parts.push(item.description);
    parts.push("Read existing reviews in reviews/, produce a synthesis in syntheses/. Include Mermaid architecture diagrams.");
  } else if (item.type === "review") {
    const docs = item.documents?.join(", ") || "all files in reviews/";
    parts.push(`Use the research skill to review these documents: ${docs}.`);
    parts.push(`Objective: ${item.title}.`);
    if (item.description) parts.push(item.description);
    parts.push("Produce: comparative analysis, code assets in assets/, and Mermaid architecture diagrams showing how the pieces fit together.");
  }

  return parts.join(" ");
}

const RUN_BASE = import.meta.env.DEV
  ? "http://localhost:8080"
  : "/prototypes/research-workspace/vault";

async function triggerResearch(item: Intention) {
  const prompt = buildPrompt(item);
  // Spawn a background run via the server (PTY-based)
  const res = await fetch(`${RUN_BASE}/api/vault/runs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      title: item.title,
      intentionId: item.id,
    }),
  });
  if (!res.ok) {
    console.error("[run] Failed to start:", await res.text());
    return;
  }
  const data = await res.json();
  // Tell TerminalPanel to open a new tab for this run
  window.dispatchEvent(
    new CustomEvent("run-started", {
      detail: { runId: data.runId, title: item.title },
    })
  );
}

function IntentionCard({
  item,
  onDelete,
  onUpdate,
}: {
  item: Intention;
  onDelete: () => void;
  onUpdate: (updated: Intention) => void;
}) {
  const [launching, setLaunching] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(item.title);
  const [editDesc, setEditDesc] = useState(item.description);
  const meta = TYPE_META[item.type];
  const Icon = meta.icon;

  const handleRun = async () => {
    setLaunching(true);
    await triggerResearch(item);
    setTimeout(() => setLaunching(false), 2000);
  };

  const handleSaveEdit = () => {
    onUpdate({ ...item, title: editTitle.trim(), description: editDesc.trim() });
    setEditing(false);
  };

  return (
    <div className="border-b border-white/[0.04]">
      {/* Collapsed row */}
      <div className="group flex items-start gap-2 px-3 py-2 hover:bg-white/[0.03] transition-colors cursor-pointer"
        onClick={() => !editing && setExpanded(!expanded)}
      >
        <Icon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${meta.color}`} />
        <div className="flex-1 min-w-0">
          <p className="font-label text-xs text-white truncate">{item.title}</p>
          {!expanded && item.description && (
            <p className="font-body text-[10px] text-white/50 mt-0.5 line-clamp-1">
              {item.description}
            </p>
          )}
          {!expanded && (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
              <span className={`font-label text-[9px] uppercase tracking-wider ${meta.color}/60`}>
                {meta.label}
              </span>
              {item.schedule && (
                <span className="flex items-center gap-0.5 font-label text-[9px] text-white/40">
                  <Repeat className="w-2.5 h-2.5" />
                  {formatSchedule(item.schedule)}
                </span>
              )}
              {item.documents && item.documents.length > 0 && (
                <span className="flex items-center gap-0.5 font-label text-[9px] text-white/40">
                  <FileText className="w-2.5 h-2.5" />
                  {item.documents.length} docs
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
          <button onClick={handleRun} disabled={launching}
            className={`p-0.5 transition-all ${launching ? "text-primary animate-pulse" : "opacity-0 group-hover:opacity-100 text-white/30 hover:text-primary"}`}
            title="Run now">
            {launching ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
          </button>
          <button onClick={() => { setEditing(!editing); setExpanded(true); }}
            className="opacity-0 group-hover:opacity-100 p-0.5 text-white/30 hover:text-tertiary transition-all"
            title="Edit">
            <Pencil className="w-3 h-3" />
          </button>
          <button onClick={onDelete}
            className="opacity-0 group-hover:opacity-100 p-0.5 text-white/30 hover:text-error transition-all">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Expanded detail / edit */}
      {expanded && (
        <div className="px-3 pb-2 pl-8 space-y-1.5">
          {editing ? (
            <>
              <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                className="w-full bg-white/[0.04] text-white text-xs font-body px-2 py-1 rounded border border-white/[0.08] focus:border-primary/40 focus:outline-none" />
              <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={3}
                className="w-full bg-white/[0.04] text-white text-xs font-body px-2 py-1 rounded border border-white/[0.08] focus:border-primary/40 focus:outline-none resize-none" />
              <div className="flex justify-end gap-1">
                <button onClick={() => setEditing(false)}
                  className="px-2 py-0.5 text-[10px] font-label text-white/40 hover:text-white/60">Cancel</button>
                <button onClick={handleSaveEdit}
                  className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-label text-primary bg-primary/10 rounded hover:bg-primary/20">
                  <Check className="w-2.5 h-2.5" />Save
                </button>
              </div>
            </>
          ) : (
            <>
              {item.description && (
                <p className="font-body text-[10px] text-white/60 leading-relaxed whitespace-pre-wrap">
                  {item.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                <span className={`font-label text-[9px] uppercase tracking-wider ${meta.color}/60`}>
                  {meta.label}
                </span>
                {item.schedule && (
                  <span className="flex items-center gap-0.5 font-label text-[9px] text-white/40">
                    <Repeat className="w-2.5 h-2.5" />
                    {formatSchedule(item.schedule)}
                  </span>
                )}
              </div>
              {item.documents && item.documents.length > 0 && (
                <div className="mt-1">
                  <span className="font-label text-[9px] text-white/30 uppercase tracking-wider">Documents:</span>
                  <ul className="mt-0.5 space-y-0.5">
                    {item.documents.map((d) => (
                      <li key={d} className="font-mono text-[10px] text-white/50 truncate">{d}</li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="font-mono text-[9px] text-white/20 mt-1">
                Created {new Date(item.createdAt).toLocaleString()}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function DocumentPicker({
  files,
  selected,
  onToggle,
}: {
  files: string[];
  selected: Set<string>;
  onToggle: (path: string) => void;
}) {
  return (
    <div className="max-h-28 overflow-y-auto border border-white/[0.08] rounded-md mt-1">
      {files.length === 0 && (
        <p className="px-2 py-1.5 text-[10px] text-white/30 font-label">
          No files in vault
        </p>
      )}
      {files.map((f) => (
        <label
          key={f}
          className="flex items-center gap-1.5 px-2 py-1 text-[11px] text-white/70 hover:bg-white/[0.04] cursor-pointer"
        >
          <input
            type="checkbox"
            checked={selected.has(f)}
            onChange={() => onToggle(f)}
            className="rounded border-white/20 bg-transparent text-primary focus:ring-0 focus:ring-offset-0 w-3 h-3"
          />
          <span className="truncate font-mono">{f}</span>
        </label>
      ))}
    </div>
  );
}

function CreateForm({
  onSubmit,
  onCancel,
  vaultFiles,
}: {
  onSubmit: (item: Omit<Intention, "id" | "createdAt" | "status">) => void;
  onCancel: () => void;
  vaultFiles: string[];
}) {
  const [type, setType] = useState<IntentionType>("research");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timesPerDay, setTimesPerDay] = useState(1);
  const [endDate, setEndDate] = useState("");
  const [hasEndDate, setHasEndDate] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());

  const toggleDoc = useCallback((path: string) => {
    setSelectedDocs((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({
      type,
      title: title.trim(),
      description: description.trim(),
      schedule: {
        timesPerDay,
        endDate: hasEndDate && endDate ? endDate : undefined,
      },
      documents: type === "review" ? Array.from(selectedDocs) : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="px-3 py-2 space-y-2 border-b border-white/[0.06]">
      {/* Type selector */}
      <div className="flex gap-1">
        {(Object.keys(TYPE_META) as IntentionType[]).map((t) => {
          const m = TYPE_META[t];
          const Icon = m.icon;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-label transition-colors ${
                type === t
                  ? "bg-white/10 text-white"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              <Icon className="w-3 h-3" />
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Title */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={
          type === "research"
            ? "Paper title or arXiv URL..."
            : type === "synthesis"
              ? "Synthesis focus area..."
              : "Review objective..."
        }
        autoFocus
        className="w-full bg-white/[0.04] text-white text-xs font-body px-2 py-1.5 rounded border border-white/[0.08] focus:border-primary/40 focus:outline-none placeholder:text-white/25"
      />

      {/* Description */}
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder={
          type === "research"
            ? "What to focus on, key questions..."
            : type === "synthesis"
              ? "What threads to connect, what to produce..."
              : "Compare these papers, produce code assets & architecture diagrams..."
        }
        rows={2}
        className="w-full bg-white/[0.04] text-white text-xs font-body px-2 py-1.5 rounded border border-white/[0.08] focus:border-primary/40 focus:outline-none placeholder:text-white/25 resize-none"
      />

      {/* Recurring schedule */}
      <div className="space-y-1.5">
        <span className="font-label text-[10px] text-white/40 uppercase tracking-wider flex items-center gap-1">
          <Repeat className="w-2.5 h-2.5" />
          Recurring schedule
        </span>

        {/* Frequency */}
        <div className="flex gap-1">
          {FREQUENCY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTimesPerDay(opt.value)}
              className={`px-2 py-1 rounded text-[10px] font-label transition-colors ${
                timesPerDay === opt.value
                  ? "bg-primary/20 text-primary"
                  : "text-white/30 hover:text-white/50 bg-white/[0.03]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* End date toggle + picker */}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={hasEndDate}
              onChange={(e) => setHasEndDate(e.target.checked)}
              className="rounded border-white/20 bg-transparent text-primary focus:ring-0 focus:ring-offset-0 w-3 h-3"
            />
            <span className="font-label text-[10px] text-white/50">
              End date
            </span>
          </label>
          {hasEndDate && (
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="flex-1 bg-white/[0.04] text-white text-[10px] font-body px-2 py-1 rounded border border-white/[0.08] focus:border-primary/40 focus:outline-none [color-scheme:dark]"
            />
          )}
          {!hasEndDate && (
            <span className="font-label text-[10px] text-white/25 italic">
              Runs indefinitely
            </span>
          )}
        </div>
      </div>

      {/* Document picker — only for review */}
      {type === "review" && (
        <div>
          <span className="font-label text-[10px] text-white/40 uppercase tracking-wider">
            Select documents to review
          </span>
          <DocumentPicker
            files={vaultFiles}
            selected={selectedDocs}
            onToggle={toggleDoc}
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-1.5 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="px-2 py-1 text-[10px] font-label text-white/40 hover:text-white/60 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!title.trim()}
          className="px-3 py-1 text-[10px] font-label rounded bg-primary/20 text-primary hover:bg-primary/30 disabled:opacity-30 transition-colors"
        >
          Create
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Auth info note
// ---------------------------------------------------------------------------

function AuthNote() {
  const [dismissed, setDismissed] = useState(() =>
    localStorage.getItem("rw-auth-note-dismissed") === "1"
  );
  const [revoking, setRevoking] = useState(false);

  const handleRevoke = async () => {
    if (!confirm("This will delete all stored auth tokens. You will need to re-authenticate. Continue?")) return;
    setRevoking(true);
    try {
      const res = await fetch(`${RUN_BASE}/api/vault/auth`, { method: "DELETE" });
      const data = await res.json();
      alert(data.message || "Tokens revoked.");
    } catch {
      alert("Failed to revoke tokens.");
    }
    setRevoking(false);
  };

  if (dismissed) return null;

  return (
    <div className="mx-3 my-2 space-y-1.5">
      {/* Auth duration note */}
      <div className="px-2.5 py-2 rounded-md bg-primary/[0.06] border border-primary/10">
        <div className="flex items-start gap-1.5">
          <KeyRound className="w-3 h-3 mt-0.5 text-primary/60 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-label text-[10px] text-white/60 leading-relaxed">
              <span className="text-white/80 font-semibold">Auth &amp; token storage:</span>{" "}
              Claude Code Max plan OAuth tokens stay active for{" "}
              <span className="text-primary">~90 days</span>. Tokens are stored
              on an encrypted EFS volume (AES-256 at rest) with{" "}
              <span className="text-white/80">owner-only file permissions</span>{" "}
              (chmod 600). The volume is private to your workspace &mdash; no
              other users or containers can access it.
            </p>
            <p className="font-label text-[10px] text-white/40 leading-relaxed mt-1">
              <span className="text-error/80 font-semibold">Security warning:</span>{" "}
              Your OAuth token grants access to your Anthropic Max plan. If you
              suspect compromise, revoke tokens immediately using the button
              below, then re-authenticate. Do not share workspace access with
              untrusted parties. For maximum security, use a scoped API key
              (via environment variable) instead of OAuth for automated
              recurring tasks.
            </p>
          </div>
          <button
            onClick={() => {
              setDismissed(true);
              localStorage.setItem("rw-auth-note-dismissed", "1");
            }}
            className="text-white/20 hover:text-white/40 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Revoke button */}
      <button
        onClick={handleRevoke}
        disabled={revoking}
        className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-[10px] font-label text-error/60 bg-error/[0.05] border border-error/10 hover:bg-error/10 hover:text-error transition-colors disabled:opacity-50"
      >
        <KeyRound className="w-3 h-3" />
        {revoking ? "Revoking..." : "Revoke stored tokens"}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function IntentionsPanel() {
  const [intentions, setIntentions] = useState<Intention[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [expandedTypes, setExpandedTypes] = useState<Set<IntentionType>>(
    new Set(["research", "synthesis", "review"])
  );

  const { tree } = useVaultTree();
  const vaultFiles = tree ? flattenFiles(tree) : [];

  useEffect(() => {
    loadIntentions().then((items) => {
      setIntentions(items);
      setLoading(false);
    });
  }, []);

  const toggleType = useCallback((type: IntentionType) => {
    setExpandedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }, []);

  const handleCreate = useCallback(
    async (data: Omit<Intention, "id" | "createdAt" | "status">) => {
      const item: Intention = {
        ...data,
        id: crypto.randomUUID(),
        status: "pending",
        createdAt: new Date().toISOString(),
      };
      const next = [...intentions, item];
      setIntentions(next);
      setCreating(false);
      await saveIntentions(next);
    },
    [intentions]
  );

  const handleUpdate = useCallback(
    async (updated: Intention) => {
      const next = intentions.map((i) => (i.id === updated.id ? updated : i));
      setIntentions(next);
      await saveIntentions(next);
    },
    [intentions]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      const next = intentions.filter((i) => i.id !== id);
      setIntentions(next);
      await saveIntentions(next);
    },
    [intentions]
  );

  const grouped = {
    research: intentions.filter((i) => i.type === "research"),
    synthesis: intentions.filter((i) => i.type === "synthesis"),
    review: intentions.filter((i) => i.type === "review"),
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="glass-header flex items-center justify-between px-3 py-2">
        <span className="font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant/60">
          Intentions
        </span>
        <button
          onClick={() => setCreating(!creating)}
          className="p-1 rounded hover:bg-white/[0.08] transition-colors text-on-surface-variant/60 hover:text-white"
        >
          {creating ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Auth note */}
      <AuthNote />

      {/* Create form */}
      {creating && (
        <CreateForm
          onSubmit={handleCreate}
          onCancel={() => setCreating(false)}
          vaultFiles={vaultFiles}
        />
      )}

      {/* Intention list */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center gap-2 px-3 py-4 text-white/40">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="font-label text-xs">Loading...</span>
          </div>
        )}

        {!loading &&
          (Object.keys(TYPE_META) as IntentionType[]).map((type) => {
            const meta = TYPE_META[type];
            const items = grouped[type];
            const isExpanded = expandedTypes.has(type);
            const Icon = meta.icon;

            return (
              <div key={type}>
                <button
                  onClick={() => toggleType(type)}
                  className="w-full flex items-center gap-1.5 px-3 py-1.5 text-left hover:bg-white/[0.03] transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-3 h-3 text-white/30" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-white/30" />
                  )}
                  <Icon className={`w-3 h-3 ${meta.color}`} />
                  <span className="font-label text-[11px] text-white/70 flex-1">
                    {meta.label}
                  </span>
                  {items.length > 0 && (
                    <span className="font-label text-[9px] text-white/30 bg-white/[0.06] px-1.5 py-0.5 rounded-full">
                      {items.length}
                    </span>
                  )}
                </button>

                {isExpanded && (
                  <div>
                    {items.length === 0 && (
                      <p className="px-3 pl-8 py-1.5 text-[10px] text-white/20 font-label">
                        No {meta.label.toLowerCase()} intentions yet
                      </p>
                    )}
                    {items.map((item) => (
                      <IntentionCard
                        key={item.id}
                        item={item}
                        onDelete={() => handleDelete(item.id)}
                        onUpdate={handleUpdate}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
