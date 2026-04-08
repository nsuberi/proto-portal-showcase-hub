import { useState, useEffect } from "react";
import { tokens } from "@/design-system/tokens";
import { useAppLogger } from "@/components/AppLogger";

interface ClassifiedDoc {
  name: string;
  type: string;
  icon: string;
  iconBg: string;
  confidence: number;
  level: "high" | "medium" | "low";
}

const sampleDocs: ClassifiedDoc[] = [
  { name: "W-2 Tax Form", type: "Income Verification", icon: "\u{1F4CB}", iconBg: "#0f1a2e", confidence: 97, level: "high" },
  { name: "Bank Statement Q4", type: "Asset Documentation", icon: "\u{1F3E6}", iconBg: "#261700", confidence: 94, level: "high" },
  { name: "Property Appraisal", type: "Collateral Valuation", icon: "\u{1F3E0}", iconBg: "#2e0f1a", confidence: 88, level: "medium" },
  { name: "Employment Letter", type: "Income Verification", icon: "\u{1F4BC}", iconBg: "#0f2e1a", confidence: 72, level: "medium" },
  { name: "Insurance Certificate", type: "Risk Documentation", icon: "\u{1F4DC}", iconBg: "#1a0f2e", confidence: 61, level: "low" },
  { name: "Title Deed", type: "Ownership Proof", icon: "\u{1F3DB}", iconBg: "#0f1a2e", confidence: 91, level: "high" },
  { name: "Pay Stub March", type: "Income Verification", icon: "\u{1F4B5}", iconBg: "#261700", confidence: 85, level: "medium" },
  { name: "Credit Report", type: "Credit Assessment", icon: "\u{1F4CA}", iconBg: "#2e0f1a", confidence: 79, level: "medium" },
];

const levelColors = {
  high: { bg: "#0f2e1a", text: "#27C93F" },
  medium: { bg: "#261700", text: tokens.color.tertiary },
  low: { bg: "#2e0f0f", text: tokens.color.error },
};

export default function LoanClassifierApp() {
  const { log } = useAppLogger();
  const [documents, setDocuments] = useState<ClassifiedDoc[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [filter, setFilter] = useState<"all" | "high" | "medium" | "low">("all");

  useEffect(() => {
    log("Loan Document Classifier initialized", "info");
    log("Pipeline ready: extraction \u2192 classification \u2192 confidence scoring", "info");
  }, [log]);

  const classify = () => {
    if (documents.length > 0) {
      setDocuments([]);
      setFilter("all");
      log("Document queue cleared", "action");
      return;
    }

    setIsProcessing(true);
    log("Processing document batch...", "action");

    const batch = sampleDocs.slice(0, 3 + Math.floor(Math.random() * 5));

    batch.forEach((doc, i) => {
      setTimeout(() => {
        setDocuments((prev) => [...prev, doc]);
        log(
          `Classified: ${doc.name} \u2192 ${doc.type} (${doc.confidence}%)`,
          doc.level === "high" ? "success" : doc.level === "medium" ? "warn" : "info",
        );
        if (i === batch.length - 1) {
          setIsProcessing(false);
          log(`Batch complete: ${batch.length} documents classified`, "success");
        }
      }, 400 * (i + 1));
    });
  };

  const handleFilter = (f: typeof filter) => {
    setFilter(f);
    log(`Filter applied: ${f === "all" ? "showing all" : f + " confidence only"}`, "action");
  };

  const filtered = filter === "all" ? documents : documents.filter((d) => d.level === filter);

  const stats = {
    total: documents.length,
    high: documents.filter((d) => d.level === "high").length,
    medium: documents.filter((d) => d.level === "medium").length,
    low: documents.filter((d) => d.level === "low").length,
  };

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: "0 auto" }}>
      <h2
        style={{
          fontFamily: tokens.font.headline,
          fontSize: 20,
          fontWeight: 600,
          color: tokens.color.onSurface,
          marginBottom: 4,
        }}
      >
        Document Classifier
      </h2>
      <p
        style={{
          fontFamily: tokens.font.body,
          fontSize: 13,
          color: tokens.color.outline,
          marginBottom: 20,
        }}
      >
        AI-powered loan document classification pipeline
      </p>

      {/* Drop zone */}
      <div
        onClick={classify}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          log("File dropped onto classifier", "action");
          classify();
        }}
        style={{
          border: `2px dashed ${dragOver ? tokens.color.primary : tokens.color.outlineVariant}`,
          borderRadius: 12,
          padding: 28,
          textAlign: "center",
          cursor: "pointer",
          transition: "all 0.2s",
          background: dragOver ? "rgba(187, 198, 226, 0.05)" : "transparent",
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.5 }}>
          {isProcessing ? "\u23F3" : documents.length > 0 ? "\u{1F5D1}" : "\u{1F4C4}"}
        </div>
        <p style={{ fontSize: 13, color: tokens.color.outline }}>
          {isProcessing
            ? "Classifying documents..."
            : documents.length > 0
              ? "Click to clear & reclassify"
              : "Drop documents here or click to classify"}
        </p>
      </div>

      {/* Stats bar */}
      {documents.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 16,
          }}
        >
          {(["all", "high", "medium", "low"] as const).map((f) => (
            <button
              key={f}
              onClick={() => handleFilter(f)}
              style={{
                flex: 1,
                padding: "8px 4px",
                borderRadius: 8,
                border: `1px solid ${filter === f ? tokens.color.primary : tokens.color.outlineVariant}`,
                background:
                  filter === f ? tokens.color.primaryContainer : tokens.color.surfaceContainerLow,
                color: filter === f ? tokens.color.primary : tokens.color.onSurfaceVariant,
                fontSize: 11,
                fontFamily: tokens.font.label,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              {f === "all" ? `All (${stats.total})` : `${f} (${stats[f]})`}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.map((doc, i) => (
          <div
            key={`${doc.name}-${i}`}
            onClick={() => {
              log(`Inspecting document: ${doc.name}`, "action");
            }}
            style={{
              background: tokens.color.surfaceContainerLow,
              borderRadius: 10,
              padding: "12px 14px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              animation: `slideIn 0.3s ease-out ${i * 0.08}s both`,
              cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = tokens.color.surfaceContainer)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = tokens.color.surfaceContainerLow)
            }
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                flexShrink: 0,
                background: doc.iconBg,
              }}
            >
              {doc.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: tokens.color.onSurface,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {doc.name}
              </div>
              <div style={{ fontSize: 11, color: tokens.color.outline, marginTop: 2 }}>
                {doc.type}
              </div>
              {/* Confidence bar */}
              <div
                style={{
                  height: 3,
                  background: tokens.color.surfaceContainerHighest,
                  borderRadius: 2,
                  overflow: "hidden",
                  marginTop: 6,
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${doc.confidence}%`,
                    borderRadius: 2,
                    background: levelColors[doc.level].text,
                    animation: `fillBar 1s ease-out ${i * 0.08}s both`,
                  }}
                />
              </div>
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: "4px 10px",
                borderRadius: 20,
                whiteSpace: "nowrap",
                background: levelColors[doc.level].bg,
                color: levelColors[doc.level].text,
              }}
            >
              {doc.confidence}%
            </span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fillBar {
          from { width: 0; }
        }
      `}</style>
    </div>
  );
}
