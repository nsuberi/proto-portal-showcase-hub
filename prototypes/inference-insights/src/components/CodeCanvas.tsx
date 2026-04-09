import { useState } from "react";
import { Play, Check } from "lucide-react";
import type { CodeCell } from "../types";

interface Props {
  cell: CodeCell;
}

export default function CodeCanvas({ cell }: Props) {
  const [showOutput, setShowOutput] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = () => {
    setIsRunning(true);
    // Simulate execution delay
    setTimeout(() => {
      setIsRunning(false);
      setShowOutput(true);
    }, 800 + Math.random() * 600);
  };

  return (
    <div className="rounded-lg border border-outline-variant/20 overflow-hidden bg-surface-container-lowest">
      {/* Code */}
      <div className="relative">
        <div
          className="p-4 font-mono text-sm leading-relaxed overflow-x-auto"
          dangerouslySetInnerHTML={{ __html: cell.code_html }}
        />
        <button
          onClick={handleRun}
          disabled={isRunning}
          className="absolute top-3 right-3 inline-flex items-center gap-1.5 font-label text-xs px-3 py-1.5 rounded-md bg-domain-ml/20 text-domain-ml hover:bg-domain-ml/30 disabled:opacity-50 transition-colors"
        >
          {isRunning ? (
            <span className="w-3 h-3 border-2 border-domain-ml/40 border-t-domain-ml rounded-full animate-spin" />
          ) : showOutput ? (
            <Check className="w-3 h-3" />
          ) : (
            <Play className="w-3 h-3" />
          )}
          {isRunning ? "Running..." : showOutput ? "Done" : "Run"}
        </button>
      </div>

      {/* Output */}
      {showOutput && (
        <div className="border-t border-outline-variant/20 bg-surface-container-low p-4">
          <p className="font-label text-[10px] text-on-surface-variant/50 uppercase tracking-wider mb-2">
            Output ({cell.mock_output.type})
          </p>
          <pre className="font-mono text-sm text-on-surface-variant whitespace-pre-wrap leading-relaxed">
            {cell.mock_output.content}
          </pre>
        </div>
      )}
    </div>
  );
}
