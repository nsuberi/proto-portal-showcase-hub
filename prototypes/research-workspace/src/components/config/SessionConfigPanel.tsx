import { useState, useEffect } from "react";
import {
  Settings2,
  Sparkles,
  Wrench,
  Webhook,
  ShieldCheck,
  ShieldOff,
  ChevronRight,
  RefreshCw,
  FileText,
  Pencil,
  Terminal,
  Search,
  Globe,
  Activity,
} from "lucide-react";

interface Skill {
  id: string;
  name: string;
  description: string;
  path: string;
}

interface Hook {
  matcher: string;
  command: string;
  filePath: string | null;
}

interface SessionConfig {
  skills: Skill[];
  hooks: Record<string, Hook[]>;
  toolPolicy: { blocked_tools: string[]; notes?: string };
}

const BASE_URL = import.meta.env.DEV
  ? "http://localhost:8080"
  : "/prototypes/research-workspace/vault";

const CLAUDE_TOOLS = [
  { name: "Read", icon: FileText, description: "Read files" },
  { name: "Write", icon: Pencil, description: "Write files" },
  { name: "Edit", icon: Pencil, description: "Edit files" },
  { name: "Bash", icon: Terminal, description: "Run commands" },
  { name: "Glob", icon: Search, description: "Find files" },
  { name: "Grep", icon: Search, description: "Search content" },
  { name: "WebFetch", icon: Globe, description: "Fetch URLs" },
  { name: "WebSearch", icon: Globe, description: "Web search" },
  { name: "Agent", icon: Activity, description: "Sub-agents" },
];

function SectionHeader({
  icon: Icon,
  label,
  count,
  expanded,
  onToggle,
}: {
  icon: typeof Settings2;
  label: string;
  count: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-white/[0.04] transition-colors text-left cursor-pointer"
    >
      <ChevronRight
        className={`w-2.5 h-2.5 text-white/20 flex-shrink-0 transition-transform ${
          expanded ? "rotate-90" : ""
        }`}
      />
      <Icon className="w-3 h-3 text-on-surface-variant/50" />
      <span className="font-label text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant/50 flex-1">
        {label}
      </span>
      <span className="font-label text-[9px] text-white/25 bg-white/[0.06] px-1.5 py-0.5 rounded-full">
        {count}
      </span>
    </button>
  );
}

interface SessionConfigPanelProps {
  onSelectFile?: (path: string) => void;
}

export default function SessionConfigPanel({ onSelectFile }: SessionConfigPanelProps) {
  const [config, setConfig] = useState<SessionConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [skillsOpen, setSkillsOpen] = useState(true);
  const [toolsOpen, setToolsOpen] = useState(true);
  const [hooksOpen, setHooksOpen] = useState(true);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/vault/config`);
      if (res.ok) {
        setConfig(await res.json());
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const blockedTools = new Set(config?.toolPolicy?.blocked_tools || []);
  const hookCount = config
    ? Object.values(config.hooks).reduce((sum, arr) => sum + arr.length, 0)
    : 0;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="glass-header flex items-center justify-between px-3 py-1.5">
        <div className="flex items-center gap-1.5">
          <Settings2 className="w-3.5 h-3.5 text-on-surface-variant/60" />
          <span className="font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant/60">
            Session Config
          </span>
        </div>
        <button
          onClick={fetchConfig}
          className="p-0.5 text-white/30 hover:text-white/60 transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && !config && (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <Settings2 className="w-8 h-8 text-white/10 mb-2 animate-pulse" />
            <p className="font-label text-[10px] text-white/25">
              Loading config...
            </p>
          </div>
        )}

        {config && (
          <>
            {/* Skills section */}
            <div className="border-b border-white/[0.04]">
              <SectionHeader
                icon={Sparkles}
                label="Skills"
                count={config.skills.length}
                expanded={skillsOpen}
                onToggle={() => setSkillsOpen(!skillsOpen)}
              />
              {skillsOpen && (
                <div className="px-3 pb-2">
                  {config.skills.length === 0 ? (
                    <p className="font-label text-[10px] text-white/20 pl-5">
                      No skills configured
                    </p>
                  ) : (
                    config.skills.map((skill) => (
                      <button
                        key={skill.id}
                        onClick={() => onSelectFile?.(skill.path)}
                        className="flex items-start gap-2 py-1 pl-5 w-full text-left hover:bg-white/[0.04] rounded transition-colors cursor-pointer group"
                      >
                        <Sparkles className="w-3 h-3 text-tertiary/70 flex-shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="font-label text-[11px] text-white/70 truncate group-hover:text-white/90">
                            {skill.name}
                          </p>
                          {skill.description && (
                            <p className="font-label text-[9px] text-white/30 leading-tight line-clamp-2">
                              {skill.description}
                            </p>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Hooks section */}
            <div className="border-b border-white/[0.04]">
              <SectionHeader
                icon={Webhook}
                label="Hooks"
                count={hookCount}
                expanded={hooksOpen}
                onToggle={() => setHooksOpen(!hooksOpen)}
              />
              {hooksOpen && (
                <div className="px-3 pb-2">
                  {hookCount === 0 ? (
                    <p className="font-label text-[10px] text-white/20 pl-5">
                      No hooks configured
                    </p>
                  ) : (
                    Object.entries(config.hooks).map(([event, hooks]) =>
                      hooks.map((hook, i) => (
                        <button
                          key={`${event}-${i}`}
                          onClick={() =>
                            hook.filePath && onSelectFile?.(hook.filePath)
                          }
                          className="flex items-start gap-2 py-1 pl-5 w-full text-left hover:bg-white/[0.04] rounded transition-colors cursor-pointer group"
                        >
                          <Webhook className="w-3 h-3 text-accent-success/70 flex-shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <p className="font-label text-[11px] text-white/70 group-hover:text-white/90">
                              {event}
                            </p>
                            <p className="font-mono text-[9px] text-white/30 truncate">
                              {hook.matcher || "*"} &rarr;{" "}
                              {hook.command.split("/").pop()}
                            </p>
                          </div>
                        </button>
                      ))
                    )
                  )}
                </div>
              )}
            </div>

            {/* Tools section */}
            <div className="border-b border-white/[0.04]">
              <SectionHeader
                icon={Wrench}
                label="Tools"
                count={CLAUDE_TOOLS.length - blockedTools.size}
                expanded={toolsOpen}
                onToggle={() => setToolsOpen(!toolsOpen)}
              />
              {toolsOpen && (
                <div className="px-3 pb-2 pl-5">
                  <div className="flex flex-wrap gap-1">
                    {CLAUDE_TOOLS.map(({ name, icon: Icon }) => {
                      const blocked = blockedTools.has(name);
                      return (
                        <span
                          key={name}
                          title={
                            blocked ? `${name} — blocked by policy` : name
                          }
                          className={`inline-flex items-center gap-1 font-label text-[9px] px-1.5 py-0.5 rounded transition-colors ${
                            blocked
                              ? "bg-error/10 text-error/50 line-through"
                              : "bg-white/[0.04] text-white/50"
                          }`}
                        >
                          {blocked ? (
                            <ShieldOff className="w-2.5 h-2.5" />
                          ) : (
                            <Icon className="w-2.5 h-2.5" />
                          )}
                          {name}
                        </span>
                      );
                    })}
                  </div>
                  {blockedTools.size > 0 && (
                    <p className="font-label text-[9px] text-error/40 mt-1.5 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      {blockedTools.size} tool
                      {blockedTools.size > 1 ? "s" : ""} blocked by policy
                    </p>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
