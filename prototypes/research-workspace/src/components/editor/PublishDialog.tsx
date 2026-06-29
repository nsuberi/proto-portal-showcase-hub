import { useState, useRef, useEffect, useMemo } from "react";
import { Globe, X, Plus, Sparkles } from "lucide-react";
import {
  publishToGallery,
  getExistingTags,
  suggestTagsFromContent,
} from "../../hooks/usePublishedContent";

interface PublishDialogProps {
  filePath: string;
  markdown: string;
  onClose: () => void;
  onPublished: () => void;
}

export default function PublishDialog({
  filePath,
  markdown,
  onClose,
  onPublished,
}: PublishDialogProps) {
  const [tags, setTags] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const existingTags = useMemo(() => getExistingTags(), []);
  const contentSuggestions = useMemo(
    () => suggestTagsFromContent(markdown),
    [markdown]
  );

  // All suggestions: existing tags first, then content-derived, deduplicated
  const allSuggestions = useMemo(() => {
    const seen = new Set(tags);
    const result: { tag: string; source: "existing" | "content" }[] = [];
    for (const t of existingTags) {
      if (!seen.has(t)) {
        result.push({ tag: t, source: "existing" });
        seen.add(t);
      }
    }
    for (const t of contentSuggestions) {
      if (!seen.has(t)) {
        result.push({ tag: t, source: "content" });
        seen.add(t);
      }
    }
    return result;
  }, [existingTags, contentSuggestions, tags]);

  // Filter suggestions by input
  const filtered = useMemo(() => {
    if (!input.trim()) return allSuggestions;
    const q = input.toLowerCase();
    return allSuggestions.filter((s) => s.tag.toLowerCase().includes(q));
  }, [allSuggestions, input]);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Focus input on open
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const addTag = (tag: string) => {
    const normalized = tag.trim().toLowerCase().replace(/\s+/g, "-");
    if (normalized && !tags.includes(normalized)) {
      setTags((prev) => [...prev, normalized]);
    }
    setInput("");
    inputRef.current?.focus();
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && input.trim()) {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePublish = async () => {
    setPublishing(true);
    setError(null);
    try {
      const finalTags = tags.length > 0 ? tags : ["published"];
      await publishToGallery(filePath, markdown, finalTags);
      onPublished();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish failed");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="absolute right-0 top-full mt-1 z-50" ref={panelRef}>
      <div className="w-72 rounded-xl bg-[#1a1b20] border border-outline-variant/40 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-outline-variant/30">
          <div className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-tertiary" />
            <span className="font-label text-xs font-semibold text-on-surface/88">
              Publish to Gallery
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-0.5 rounded hover:bg-on-surface/[0.08] text-on-surface-variant/65 hover:text-on-surface-variant"
          >
            <X className="w-3 h-3" />
          </button>
        </div>

        {/* Tag input area */}
        <div className="px-3 py-2">
          <label className="font-label text-[10px] text-on-surface-variant/80 uppercase tracking-wider mb-1.5 block">
            Tags
          </label>

          {/* Selected tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 font-label text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary"
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="hover:text-on-primary transition-colors"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={handleKeyDown}
              placeholder={tags.length > 0 ? "Add another..." : "Add tags..."}
              className="w-full bg-on-surface/[0.05] border border-outline-variant/30 rounded-lg px-2.5 py-1.5 font-label text-xs text-on-surface/88 placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary/40"
            />
          </div>

          {/* Suggestions */}
          {showSuggestions && filtered.length > 0 && (
            <div className="mt-1.5 max-h-32 overflow-y-auto">
              <div className="flex items-center gap-1 mb-1">
                <Sparkles className="w-2.5 h-2.5 text-on-surface-variant/60" />
                <span className="font-label text-[9px] text-on-surface-variant/60 uppercase tracking-wider">
                  Suggestions
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {filtered.map(({ tag, source }) => (
                  <button
                    key={tag}
                    onClick={() => addTag(tag)}
                    className={`inline-flex items-center gap-1 font-label text-[10px] px-2 py-0.5 rounded-full transition-colors ${
                      source === "existing"
                        ? "bg-on-surface/[0.06] text-on-surface-variant/80 hover:bg-on-surface/[0.12] hover:text-on-surface/85"
                        : "bg-tertiary/10 text-tertiary/60 hover:bg-tertiary/20 hover:text-tertiary/80"
                    }`}
                  >
                    <Plus className="w-2.5 h-2.5" />
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-3 py-2 border-t border-outline-variant/30 space-y-1.5">
          {error && (
            <p className="font-label text-[10px] text-error truncate">{error}</p>
          )}
          <div className="flex items-center justify-between">
            <span className="font-label text-[10px] text-on-surface-variant/60">
              {tags.length === 0 ? "No tags = \"published\"" : `${tags.length} tag${tags.length === 1 ? "" : "s"}`}
            </span>
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="font-label text-xs font-semibold px-3 py-1 rounded-lg bg-primary text-on-primary hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {publishing ? "Publishing..." : "Publish"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
