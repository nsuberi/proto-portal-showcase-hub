import { useState, useRef, useEffect } from "react";
import { FolderTree, Check, Plus, ChevronDown } from "lucide-react";
import { useProjects } from "../../hooks/useProjects";

/**
 * Top-bar project switcher. A project is an isolated workspace — its own tree,
 * leaves, and sources. Lets you switch between projects and create new ones, so
 * ideas land in the right "second brain".
 */
export default function ProjectSwitcher() {
  const { projects, active, activeId, switchProject, createProject } = useProjects();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const submitCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    await createProject(trimmed);
    setName("");
    setCreating(false);
    setOpen(false);
  };

  const label = active?.name || activeId || "Default";

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 max-w-[12rem] px-2.5 py-1.5 rounded-lg hover:bg-surface-container-high transition-colors"
        aria-label="Switch project"
        aria-expanded={open}
      >
        <FolderTree className="w-4 h-4 text-primary shrink-0" />
        <span className="font-headline text-sm text-on-surface truncate">{label}</span>
        <ChevronDown className="w-3.5 h-3.5 text-on-surface-variant shrink-0" />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-64 bark-card z-50 p-1.5">
          <div className="px-2 py-1.5 font-label text-[11px] uppercase tracking-wide text-on-surface-variant">
            Projects
          </div>
          <ul className="max-h-64 overflow-y-auto">
            {projects.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => {
                    switchProject(p.id);
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-surface-container-high transition-colors text-left"
                >
                  <span className="w-4 shrink-0">
                    {p.id === activeId && <Check className="w-4 h-4 text-primary" />}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-label text-sm text-on-surface truncate">
                      {p.name}
                    </span>
                    <span className="block font-label text-[11px] text-on-surface-variant">
                      {p.itemCount} {p.itemCount === 1 ? "item" : "items"} ·{" "}
                      {p.sourceCount} {p.sourceCount === 1 ? "source" : "sources"}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <div className="border-t border-outline-variant mt-1.5 pt-1.5">
            {creating ? (
              <div className="flex items-center gap-1.5 px-1.5 pb-1">
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitCreate();
                    if (e.key === "Escape") setCreating(false);
                  }}
                  placeholder="New project name"
                  className="flex-1 min-w-0 px-2 py-1.5 rounded-md bg-surface-container border border-outline-variant font-label text-sm text-on-surface focus:outline-none focus:border-primary"
                />
                <button
                  onClick={submitCreate}
                  className="px-2.5 py-1.5 rounded-md bg-primary text-on-primary font-label text-xs font-semibold hover:bg-primary/90 transition-colors"
                >
                  Add
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCreating(true)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-surface-container-high transition-colors text-left"
              >
                <Plus className="w-4 h-4 text-primary" />
                <span className="font-label text-sm text-on-surface">New project</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
