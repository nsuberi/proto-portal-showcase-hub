import { useEffect, useRef, useState, useCallback } from "react";

interface MilkdownEditorProps {
  content: string;
  onChange: (content: string) => void;
}

/**
 * Milkdown WYSIWYG markdown editor with textarea fallback.
 *
 * Attempts to load Milkdown dynamically. If it fails (version mismatch,
 * missing peer deps, etc.), falls back to a plain textarea that still
 * provides full editing capability.
 */
export default function MilkdownEditor({
  content,
  onChange,
}: MilkdownEditorProps) {
  const [useFallback, setUseFallback] = useState(false);
  const [milkdownReady, setMilkdownReady] = useState(false);
  const editorDivRef = useRef<HTMLDivElement>(null);
  const editorInstanceRef = useRef<unknown>(null);
  const contentRef = useRef(content);

  // Keep contentRef in sync for the listener callback
  contentRef.current = content;

  // Try to initialize Milkdown
  useEffect(() => {
    let cancelled = false;

    async function initMilkdown() {
      try {
        const [
          { Editor, rootCtx, defaultValueCtx },
          { commonmark },
          { gfm },
          { listener, listenerCtx },
          { nord },
        ] = await Promise.all([
          import("@milkdown/core"),
          import("@milkdown/preset-commonmark"),
          import("@milkdown/preset-gfm"),
          import("@milkdown/plugin-listener"),
          import("@milkdown/theme-nord"),
        ]);

        if (cancelled || !editorDivRef.current) return;

        const editor = await Editor.make()
          .config((ctx) => {
            ctx.set(rootCtx, editorDivRef.current!);
            ctx.set(defaultValueCtx, contentRef.current);
            ctx.get(listenerCtx).markdownUpdated((_ctx, markdown) => {
              onChange(markdown);
            });
          })
          .config(nord)
          .use(commonmark)
          .use(gfm)
          .use(listener)
          .create();

        if (cancelled) {
          editor.destroy();
          return;
        }

        editorInstanceRef.current = editor;
        setMilkdownReady(true);

        // Open links in a new tab on click (ProseMirror swallows clicks for editing)
        editorDivRef.current!.addEventListener("click", (e) => {
          const target = (e.target as HTMLElement).closest("a");
          if (target && target.href) {
            e.preventDefault();
            window.open(target.href, "_blank", "noopener,noreferrer");
          }
        });
      } catch (err) {
        console.warn("Milkdown failed to initialize, using fallback editor:", err);
        if (!cancelled) {
          setUseFallback(true);
        }
      }
    }

    initMilkdown();

    return () => {
      cancelled = true;
      if (editorInstanceRef.current) {
        try {
          (editorInstanceRef.current as { destroy: () => void }).destroy();
        } catch {
          // cleanup best-effort
        }
        editorInstanceRef.current = null;
      }
    };
    // Only init once per mount; content updates handled separately
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fallback textarea editor
  if (useFallback) {
    return <FallbackEditor content={content} onChange={onChange} />;
  }

  return (
    <div className="h-full flex flex-col">
      {!milkdownReady && (
        <div className="flex items-center justify-center h-full text-white/40 font-label text-sm">
          Loading editor...
        </div>
      )}
      <div
        ref={editorDivRef}
        className={`milkdown-editor-root flex-1 overflow-y-auto min-h-0 ${
          milkdownReady ? "" : "hidden"
        }`}
      />
    </div>
  );
}

/** Plain textarea fallback that works without any third-party editor lib. */
function FallbackEditor({
  content,
  onChange,
}: {
  content: string;
  onChange: (content: string) => void;
}) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-1 text-xs font-label text-white/40 border-b border-white/[0.06]">
        Markdown editor (plain text mode)
      </div>
      <textarea
        value={content}
        onChange={handleChange}
        spellCheck={false}
        className="flex-1 w-full bg-transparent text-white font-mono text-sm p-4 resize-none focus:outline-none border-none leading-relaxed placeholder:text-white/30"
        placeholder="Start writing markdown..."
      />
    </div>
  );
}
