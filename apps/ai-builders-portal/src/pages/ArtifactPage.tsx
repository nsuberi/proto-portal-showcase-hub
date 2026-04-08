import { Suspense, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { tokens, phaseConfig } from "@/design-system/tokens";
import type { Phase } from "@/design-system/tokens";
import { AppLoggerProvider, AppLoggerPanel } from "@/components/AppLogger";
import { artifactComponents } from "@/artifacts/registry";

interface ArtifactMeta {
  id: string;
  title: string;
  author: string;
  challengeId: string;
  challengeTitle: string;
  submission: number;
  phase: Phase;
  tags: string[];
  videoPlaceholder: string;
}

const artifacts: Record<string, ArtifactMeta> = {
  "loan-classifier": {
    id: "loan-classifier",
    title: "Loan Document Classifier",
    author: "Jordan R.",
    challengeId: "brownfield-analysis",
    challengeTitle: "Brownfield analysis",
    submission: 1,
    phase: 1,
    tags: ["data", "AI", "Architecture"],
    videoPlaceholder: "Record a walkthrough of your classifier pipeline and analysis approach",
  },
  "rate-dashboard": {
    id: "rate-dashboard",
    title: "Rate Lock Dashboard",
    author: "Priya K.",
    challengeId: "sample-application",
    challengeTitle: "Sample application build",
    submission: 2,
    phase: 2,
    tags: ["design", "API", "Data Modeling"],
    videoPlaceholder: "Record a demo of the dashboard features and your design decisions",
  },
  "meeting-summarizer": {
    id: "meeting-summarizer",
    title: "AI Meeting Summarizer",
    author: "Rachel F.",
    challengeId: "communications-package",
    challengeTitle: "Communications package",
    submission: 7,
    phase: 3,
    tags: ["AI", "productivity", "Communication"],
    videoPlaceholder: "Record a 4-minute product introduction video for your summarizer",
  },
  "onboarding-wizard": {
    id: "onboarding-wizard",
    title: "Onboarding Wizard",
    author: "Sarah L.",
    challengeId: "prototype-build",
    challengeTitle: "Prototype and updated product definition",
    submission: 4,
    phase: 3,
    tags: ["UX", "building", "Design"],
    videoPlaceholder: "Record a walkthrough of the onboarding flow and your UX decisions",
  },
};

interface Comment {
  id: number;
  author: string;
  initials: string;
  time: string;
  text: string;
  reactions: number;
}

const mockComments: Comment[] = [
  {
    id: 1,
    author: "Marcus T.",
    initials: "MT",
    time: "2 hours ago",
    text: "Love the progressive disclosure here. The confidence bars are a nice touch — makes it easy to spot which docs need manual review.",
    reactions: 3,
  },
  {
    id: 2,
    author: "Priya K.",
    initials: "PK",
    time: "5 hours ago",
    text: "Did you consider adding a batch export? Would be useful for compliance workflows where you need to log all classifications.",
    reactions: 1,
  },
  {
    id: 3,
    author: "Kim W.",
    initials: "KW",
    time: "1 day ago",
    text: "Clean architecture — the pipeline pattern makes it easy to add new document types without touching the UI. Well done.",
    reactions: 5,
  },
];

export default function ArtifactPage() {
  const { id } = useParams<{ id: string }>();
  useEffect(() => { window.scrollTo(0, 0); }, [id]);
  const meta = id ? artifacts[id] : undefined;
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState(mockComments);
  const [reactedComments, setReactedComments] = useState<Set<number>>(new Set());

  if (!meta) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: tokens.color.surface,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <span style={{ fontSize: 48 }}>{"\u{1F50D}"}</span>
        <h2 style={{ fontFamily: tokens.font.headline, fontSize: 18, color: tokens.color.onSurface }}>
          Artifact not found
        </h2>
        <Link
          to="/showcase"
          style={{
            color: tokens.color.primary,
            fontFamily: tokens.font.label,
            fontSize: 13,
            textDecoration: "none",
          }}
        >
          &larr; Back to showcase
        </Link>
      </div>
    );
  }

  const ArtifactComponent = artifactComponents[meta.id];
  const phase = phaseConfig[meta.phase];

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    setComments((prev) => [
      {
        id: Date.now(),
        author: "You",
        initials: "YO",
        time: "Just now",
        text: commentText,
        reactions: 0,
      },
      ...prev,
    ]);
    setCommentText("");
  };

  const handleReact = (commentId: number) => {
    if (reactedComments.has(commentId)) return;
    setReactedComments((prev) => new Set([...prev, commentId]));
    setComments((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, reactions: c.reactions + 1 } : c)),
    );
  };

  return (
    <AppLoggerProvider>
      <div
        style={{
          minHeight: "100vh",
          background: tokens.color.surface,
          color: tokens.color.onSurface,
        }}
      >
        {/* Top bar */}
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 100,
            background: `${tokens.color.surfaceContainerLowest}ee`,
            backdropFilter: "blur(12px)",
            borderBottom: `1px solid ${tokens.color.outlineVariant}`,
          }}
          className="flex flex-col gap-1 px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-2.5"
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link
              to="/showcase"
              style={{
                color: tokens.color.onSurfaceVariant,
                textDecoration: "none",
                fontSize: 13,
                fontFamily: tokens.font.label,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                arrow_back
              </span>
              Showcase
            </Link>
            <span style={{ color: tokens.color.outlineVariant }}>/</span>
            <span className="truncate" style={{ fontFamily: tokens.font.headline, fontSize: 14, fontWeight: 600 }}>
              {meta.title}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                padding: "3px 10px",
                borderRadius: 20,
                background: phase.bg,
                color: phase.accent,
                fontFamily: tokens.font.label,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {phase.label}
            </span>
            <span style={{ fontSize: 12, color: tokens.color.outline, fontFamily: tokens.font.label }}>
              by {meta.author}
            </span>
          </div>
        </div>

        {/* Challenge context banner */}
        <div
          className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6"
          style={{
            background: phase.bg,
            borderBottom: `1px solid ${tokens.color.outlineVariant}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: phase.accent,
                fontFamily: tokens.font.label,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                opacity: 0.7,
              }}
            >
              Submission {meta.submission}
            </span>
            <Link
              to={`/challenges/${meta.challengeId}`}
              style={{
                fontSize: 13,
                color: phase.accent,
                fontFamily: tokens.font.label,
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              {meta.challengeTitle}
              <span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: "middle", marginLeft: 4 }}>
                open_in_new
              </span>
            </Link>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {meta.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  padding: "2px 8px",
                  borderRadius: 12,
                  background: `${phase.accent}15`,
                  color: phase.accent,
                  fontSize: 10,
                  fontFamily: tokens.font.label,
                  fontWeight: 500,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Main content: Artifact + Sidebar */}
        <div
          className="flex flex-col md:grid md:grid-cols-[1fr_360px]"
          style={{ minHeight: "calc(100vh - 100px)" }}
        >
          {/* Artifact app area */}
          <div
            style={{
              overflow: "auto",
            }}
            className="min-h-[40vh] md:min-h-0 md:border-r md:border-outline-variant"
            // design-token-lint-ignore
          >
            <Suspense fallback={
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200 }}>
                <span style={{ fontFamily: tokens.font.label, fontSize: 12, color: tokens.color.outline }}>Loading...</span>
              </div>
            }>
              {ArtifactComponent && <ArtifactComponent />}
            </Suspense>
          </div>

          {/* Right sidebar: Video + Comments */}
          <div
            style={{
              overflow: "auto",
              display: "flex",
              flexDirection: "column",
              borderTop: `1px solid ${tokens.color.outlineVariant}`,
            }}
            className="md:!border-t-0"
          >
            {/* Video section */}
            <div
              style={{
                padding: 20,
                borderBottom: `1px solid ${tokens.color.outlineVariant}`,
              }}
            >
              <h3
                style={{
                  fontFamily: tokens.font.label,
                  fontSize: 11,
                  fontWeight: 600,
                  color: tokens.color.onSurfaceVariant,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 12,
                }}
              >
                Demo Video
              </h3>
              <div
                style={{
                  background: tokens.color.surfaceContainerLow,
                  borderRadius: 10,
                  border: `1px dashed ${tokens.color.outlineVariant}`,
                  padding: "32px 20px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: tokens.color.surfaceContainer,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 12px",
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 24, color: tokens.color.outline }}
                  >
                    videocam
                  </span>
                </div>
                <p
                  style={{
                    fontSize: 12,
                    color: tokens.color.outline,
                    lineHeight: 1.5,
                    marginBottom: 12,
                    fontFamily: tokens.font.body,
                  }}
                >
                  {meta.videoPlaceholder}
                </p>
                <button
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: `1px solid ${tokens.color.outlineVariant}`,
                    background: tokens.color.surfaceContainer,
                    color: tokens.color.onSurfaceVariant,
                    fontSize: 12,
                    fontFamily: tokens.font.label,
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 14, verticalAlign: "middle", marginRight: 4 }}
                  >
                    upload
                  </span>
                  Upload video
                </button>
              </div>
            </div>

            {/* Comments section */}
            <div style={{ padding: 20, flex: 1, display: "flex", flexDirection: "column" }}>
              <h3
                style={{
                  fontFamily: tokens.font.label,
                  fontSize: 11,
                  fontWeight: 600,
                  color: tokens.color.onSurfaceVariant,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                Community Feedback
                <span style={{ fontSize: 10, fontWeight: 500, color: tokens.color.outline, textTransform: "none", letterSpacing: 0 }}>
                  {comments.length} comments
                </span>
              </h3>

              {/* New comment input */}
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: tokens.color.primaryContainer,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    fontWeight: 700,
                    color: tokens.color.primary,
                    fontFamily: tokens.font.label,
                    flexShrink: 0,
                  }}
                >
                  YO
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Share feedback or ask a question..."
                    style={{
                      width: "100%",
                      background: tokens.color.surfaceContainerLow,
                      border: `1px solid ${tokens.color.outlineVariant}`,
                      borderRadius: 8,
                      padding: "8px 10px",
                      fontSize: 12,
                      color: tokens.color.onSurface,
                      fontFamily: tokens.font.body,
                      resize: "none",
                      outline: "none",
                      minHeight: 48,
                      lineHeight: 1.5,
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.metaKey) handleAddComment();
                    }}
                  />
                  {commentText.trim() && (
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <button
                        onClick={handleAddComment}
                        style={{
                          padding: "5px 12px",
                          borderRadius: 6,
                          border: "none",
                          background: tokens.color.primary,
                          color: tokens.color.primaryContainer,
                          fontSize: 11,
                          fontWeight: 600,
                          fontFamily: tokens.font.label,
                          cursor: "pointer",
                        }}
                      >
                        Comment
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Comment list */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    style={{
                      display: "flex",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: tokens.color.surfaceContainerHigh,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                        fontWeight: 700,
                        color: tokens.color.onSurfaceVariant,
                        fontFamily: tokens.font.label,
                        flexShrink: 0,
                      }}
                    >
                      {comment.initials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: tokens.color.onSurface,
                            fontFamily: tokens.font.label,
                          }}
                        >
                          {comment.author}
                        </span>
                        <span style={{ fontSize: 10, color: tokens.color.outline }}>
                          {comment.time}
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize: 12,
                          lineHeight: 1.5,
                          color: tokens.color.onSurfaceVariant,
                          fontFamily: tokens.font.body,
                          marginBottom: 6,
                        }}
                      >
                        {comment.text}
                      </p>
                      <button
                        onClick={() => handleReact(comment.id)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "2px 8px",
                          borderRadius: 12,
                          border: `1px solid ${reactedComments.has(comment.id) ? tokens.color.primary : tokens.color.outlineVariant}`,
                          background: reactedComments.has(comment.id)
                            ? tokens.color.primaryContainer
                            : "transparent",
                          color: reactedComments.has(comment.id)
                            ? tokens.color.primary
                            : tokens.color.outline,
                          fontSize: 10,
                          fontFamily: tokens.font.label,
                          cursor: reactedComments.has(comment.id) ? "default" : "pointer",
                          transition: "all 0.2s",
                        }}
                      >
                        {"\u{1F44D}"} {comment.reactions}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Logger panel overlay */}
        <AppLoggerPanel />
      </div>
    </AppLoggerProvider>
  );
}
