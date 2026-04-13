import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import type { ContentItem, ContentType, Domain } from "../types";
import ContentCard from "../components/ContentCard";
import ContentTypeTabs from "../components/ContentTypeTabs";
import DomainFilter from "../components/DomainFilter";
import TopicRequestForm from "../components/TopicRequestForm";
import { useFeedback } from "../hooks/useFeedback";
import { Lock, Shield, Key, Database, Eye, Users, Server } from "lucide-react";

export default function GalleryPage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [activeTab, setActiveTab] = useState<ContentType | "all">("all");
  const [activeDomains, setActiveDomains] = useState<Domain[]>([]);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const { requestTopic } = useFeedback();

  useEffect(() => {
    fetch(import.meta.env.BASE_URL + "data/content-index.json")
      .then((r) => r.json())
      .then((data) => setItems(data))
      .catch(() => setItems([]));
  }, []);

  const allTags = [...new Set(items.flatMap((i) => i.tags))].sort();

  const counts: Record<ContentType | "all", number> = {
    all: items.length,
    insight: items.filter((i) => i.type === "insight").length,
    synthesis: items.filter((i) => i.type === "synthesis").length,
    architecture: items.filter((i) => i.type === "architecture").length,
  };

  const filtered = items
    .filter((item) => {
      if (activeTab === "all") return true;
      return item.type === activeTab;
    })
    .filter((item) => {
      if (activeDomains.length === 0) return true;
      return item.domains.some((d) =>
        activeDomains.includes(d.domain as Domain)
      );
    })
    .filter((item) => {
      if (!activeTag) return true;
      return item.tags.includes(activeTag);
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  const toggleDomain = (d: Domain) =>
    setActiveDomains((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="border-b border-outline-variant/30 bg-surface-container-low/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="font-headline text-2xl sm:text-3xl font-bold text-on-surface">
                Research Workspace
              </h1>
              <p className="font-label text-sm text-on-surface-variant mt-1">
                Insights, syntheses &amp; architecture diagrams connecting inference engineering to distributed systems, music &amp; architecture
              </p>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="/prototypes/research-workspace/vault/"
                className="inline-flex items-center gap-1.5 font-label text-sm text-tertiary hover:text-tertiary/80 transition-colors"
              >
                <Lock className="w-3.5 h-3.5" />
                Sign in to publish
              </a>
              <a
                href="/"
                className="font-label text-sm text-primary hover:text-primary/80 transition-colors"
              >
                &larr; Portfolio
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Content Type Tabs */}
        <div className="mb-6">
          <ContentTypeTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            counts={counts}
          />
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          <DomainFilter active={activeDomains} onToggle={toggleDomain} />

          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                  className={`font-label text-xs px-3 py-1.5 rounded-full transition-colors ${
                    activeTag === tag
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container-high text-on-surface-variant hover:bg-surface-bright"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Gallery Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {filtered.map((item) => (
              <Link key={item.id} to={`/content/${item.id}`}>
                <ContentCard item={item} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="font-headline text-xl text-on-surface-variant mb-2">
              {items.length === 0
                ? "No content yet"
                : "No content matches your filters"}
            </p>
            <p className="font-body text-on-surface-variant/60">
              {items.length === 0
                ? "The research loop hasn\u2019t run yet. Content will appear here automatically."
                : "Try adjusting your content type, domain, or tag filters."}
            </p>
          </div>
        )}

        {/* Security Architecture */}
        <section className="mb-12 rounded-xl border border-outline-variant/20 bg-surface-container-low/50 p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="font-headline text-lg text-on-surface">Workspace Security Architecture</h2>
          </div>
          <p className="font-body text-sm text-on-surface-variant/70 mb-6 max-w-2xl">
            Your credentials and files are protected by multiple layers of isolation. Here's how the workspace handles security for authenticated sessions.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="rounded-lg border border-outline-variant/15 bg-surface-container/50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="font-label text-sm font-semibold text-on-surface">Per-User Isolation</span>
              </div>
              <p className="font-body text-xs text-on-surface-variant/60 leading-relaxed">
                Each user gets an isolated vault directory scoped by Cognito identity. Your files, intentions, and activity logs are invisible to other users. Path traversal is blocked by server-side validation.
              </p>
            </div>

            <div className="rounded-lg border border-outline-variant/15 bg-surface-container/50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Key className="w-4 h-4 text-tertiary" />
                <span className="font-label text-sm font-semibold text-on-surface">OAuth Token Security</span>
              </div>
              <p className="font-body text-xs text-on-surface-variant/60 leading-relaxed">
                Your Claude Max plan OAuth token is stored in your private vault with owner-only permissions (chmod 600). API keys are stripped from agent processes — Claude authenticates via your per-user OAuth. One-click revocation available.
              </p>
            </div>

            <div className="rounded-lg border border-outline-variant/15 bg-surface-container/50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-4 h-4 text-domain-ml" />
                <span className="font-label text-sm font-semibold text-on-surface">Encrypted Storage</span>
              </div>
              <p className="font-body text-xs text-on-surface-variant/60 leading-relaxed">
                Files stored on AWS EFS with AES-256 encryption at rest and TLS in transit. IAM-enforced access — only the workspace's ECS task role can mount the filesystem. No other services or containers can access your data.
              </p>
            </div>

            <div className="rounded-lg border border-outline-variant/15 bg-surface-container/50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-4 h-4 text-secondary" />
                <span className="font-label text-sm font-semibold text-on-surface">Tool Activity Auditing</span>
              </div>
              <p className="font-body text-xs text-on-surface-variant/60 leading-relaxed">
                Every Claude Code tool invocation is logged via PreToolUse hooks. A configurable policy file can block specific tools (e.g., deny Bash for read-only agents). Activity is visible in real-time in the workspace.
              </p>
            </div>

            <div className="rounded-lg border border-outline-variant/15 bg-surface-container/50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Server className="w-4 h-4 text-on-surface-variant" />
                <span className="font-label text-sm font-semibold text-on-surface">Minimal IAM Scope</span>
              </div>
              <p className="font-body text-xs text-on-surface-variant/60 leading-relaxed">
                The container's IAM role has only EFS mount permissions — no access to S3, DynamoDB, Secrets Manager, or any other AWS service. Even the AWS CLI (installed for research tasks) has no usable credentials.
              </p>
            </div>

            <div className="rounded-lg border border-outline-variant/15 bg-surface-container/50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4 text-error" />
                <span className="font-label text-sm font-semibold text-on-surface">Authentication</span>
              </div>
              <p className="font-body text-xs text-on-surface-variant/60 leading-relaxed">
                All workspace access requires GitHub OAuth via AWS Cognito at the ALB layer. Unauthenticated requests are redirected to login. Sessions last 12 hours before re-authentication.
              </p>
            </div>
          </div>
        </section>

        {/* Enterprise Controls — PreToolUse Hooks */}
        <section className="mb-12 rounded-xl border border-tertiary/20 bg-surface-container-low/50 p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="w-5 h-5 text-tertiary" />
            <h2 className="font-headline text-lg text-on-surface">Enterprise Controls via PreToolUse Hooks</h2>
          </div>
          <p className="font-body text-sm text-on-surface-variant/70 mb-6 max-w-3xl">
            This workspace is a <strong className="text-on-surface">Claude Code native application</strong> — it uses Claude Code's skills, tools, and session management as the core engine for research automation. To make this safe for enterprise deployment, we implement observability and policy enforcement through Claude Code's hook system.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* How it works */}
            <div>
              <h3 className="font-label text-sm font-semibold text-on-surface mb-3">How PreToolUse Hooks Work</h3>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <span className="font-mono text-xs text-tertiary bg-tertiary/10 rounded px-2 py-1 h-fit">1</span>
                  <p className="font-body text-xs text-on-surface-variant/60">
                    Claude Code invokes a tool (Read, Write, Bash, WebFetch, etc.) during a research session
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="font-mono text-xs text-tertiary bg-tertiary/10 rounded px-2 py-1 h-fit">2</span>
                  <p className="font-body text-xs text-on-surface-variant/60">
                    <strong className="text-on-surface-variant">Before execution</strong>, the PreToolUse hook fires — a shell script receives the tool name and input as JSON on stdin
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="font-mono text-xs text-tertiary bg-tertiary/10 rounded px-2 py-1 h-fit">3</span>
                  <p className="font-body text-xs text-on-surface-variant/60">
                    The hook checks against a configurable <code className="text-tertiary bg-tertiary/5 px-1 rounded">tool-policy.json</code> — if the tool is blocked, it returns <code className="text-error bg-error/5 px-1 rounded">{'"decision":"block"'}</code> and Claude skips it
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="font-mono text-xs text-tertiary bg-tertiary/10 rounded px-2 py-1 h-fit">4</span>
                  <p className="font-body text-xs text-on-surface-variant/60">
                    Every invocation is logged to a per-user activity file with timestamp, tool, input, and decision — visible in real-time in the workspace's <strong className="text-on-surface-variant">Hooks & Activity</strong> panel
                  </p>
                </div>
              </div>
            </div>

            {/* Why it matters */}
            <div>
              <h3 className="font-label text-sm font-semibold text-on-surface mb-3">Why This Matters for Enterprise</h3>
              <div className="space-y-2">
                <div className="rounded-lg border border-outline-variant/15 bg-surface-container/50 p-3">
                  <p className="font-label text-xs font-semibold text-on-surface mb-1">Full Observability</p>
                  <p className="font-body text-xs text-on-surface-variant/60">
                    Every action the AI agent takes is audited before it happens. Compliance teams can review what tools were used, what files were accessed, and what commands were executed — per user, per session.
                  </p>
                </div>
                <div className="rounded-lg border border-outline-variant/15 bg-surface-container/50 p-3">
                  <p className="font-label text-xs font-semibold text-on-surface mb-1">Configurable Policy Enforcement</p>
                  <p className="font-body text-xs text-on-surface-variant/60">
                    Admins can create per-user or organization-wide tool policies. Block shell access for read-only analysts, restrict file writes for reviewers, or deny network access entirely — all through a JSON config, no code changes.
                  </p>
                </div>
                <div className="rounded-lg border border-outline-variant/15 bg-surface-container/50 p-3">
                  <p className="font-label text-xs font-semibold text-on-surface mb-1">Native Integration, Not a Wrapper</p>
                  <p className="font-body text-xs text-on-surface-variant/60">
                    Unlike API-level guardrails that only see prompts and responses, PreToolUse hooks intercept at the <em>action</em> layer — the moment Claude decides to use a tool. This is the same mechanism available to any Claude Code native application.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-outline-variant/15 pt-4">
            <p className="font-body text-xs text-on-surface-variant/40 max-w-2xl">
              This pattern — Claude Code as an application engine with hooks for governance — applies to any domain: code review pipelines, document generation, data analysis, customer support automation. The hooks are the control plane; the skills and tools are the data plane.
            </p>
          </div>
        </section>

        {/* Topic Request */}
        <TopicRequestForm onSubmit={requestTopic} />
      </main>
    </div>
  );
}
