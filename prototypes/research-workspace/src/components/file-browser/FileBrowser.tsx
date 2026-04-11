import { useState, useCallback } from "react";
import {
  File,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Plus,
  RefreshCw,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useVaultTree, createVaultFile, type VaultNode } from "../../hooks/useVaultApi";

interface FileBrowserProps {
  onSelectFile: (path: string) => void;
  selectedFile: string | null;
}

interface TreeNodeProps {
  node: VaultNode;
  depth: number;
  selectedFile: string | null;
  onSelectFile: (path: string) => void;
  expandedFolders: Set<string>;
  toggleFolder: (path: string) => void;
}

function TreeNode({
  node,
  depth,
  selectedFile,
  onSelectFile,
  expandedFolders,
  toggleFolder,
}: TreeNodeProps) {
  const isDirectory = node.type === "directory";
  const isExpanded = expandedFolders.has(node.path);
  const isSelected = selectedFile === node.path;

  const handleClick = () => {
    if (isDirectory) {
      toggleFolder(node.path);
    } else {
      onSelectFile(node.path);
    }
  };

  const paddingLeft = 8 + depth * 16;

  return (
    <>
      <button
        onClick={handleClick}
        className={`w-full flex items-center gap-1.5 py-1 px-2 text-left text-sm font-label transition-colors hover:bg-surface-container-high/60 ${
          isSelected
            ? "bg-primary-container text-primary"
            : "text-on-surface-variant"
        }`}
        style={{ paddingLeft }}
      >
        {isDirectory ? (
          <>
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
            )}
            {isExpanded ? (
              <FolderOpen className="w-4 h-4 flex-shrink-0 text-tertiary/80" />
            ) : (
              <Folder className="w-4 h-4 flex-shrink-0 text-tertiary/80" />
            )}
          </>
        ) : (
          <>
            <span className="w-3.5 flex-shrink-0" />
            <File className="w-4 h-4 flex-shrink-0 opacity-60" />
          </>
        )}
        <span className="truncate">{node.name}</span>
      </button>

      {isDirectory && isExpanded && node.children && (
        <div>
          {sortNodes(node.children).map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              selectedFile={selectedFile}
              onSelectFile={onSelectFile}
              expandedFolders={expandedFolders}
              toggleFolder={toggleFolder}
            />
          ))}
        </div>
      )}
    </>
  );
}

/** Sort directories first, then files, both alphabetically. */
function sortNodes(nodes: VaultNode[]): VaultNode[] {
  return [...nodes].sort((a, b) => {
    if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

export default function FileBrowser({
  onSelectFile,
  selectedFile,
}: FileBrowserProps) {
  const { tree, loading, error, refetch } = useVaultTree();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );
  const [creating, setCreating] = useState(false);
  const [newFileName, setNewFileName] = useState("");

  const toggleFolder = useCallback((path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const handleCreateFile = useCallback(async () => {
    if (!newFileName.trim()) return;
    try {
      await createVaultFile(newFileName.trim());
      setNewFileName("");
      setCreating(false);
      refetch();
      onSelectFile(newFileName.trim());
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create file");
    }
  }, [newFileName, refetch, onSelectFile]);

  return (
    <div className="h-full flex flex-col bg-surface-container-low border-r border-outline-variant/20">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-outline-variant/20">
        <span className="font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant/60">
          Files
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={refetch}
            className="p-1 rounded hover:bg-surface-container-high transition-colors text-on-surface-variant/60 hover:text-on-surface-variant"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setCreating(!creating)}
            className="p-1 rounded hover:bg-surface-container-high transition-colors text-on-surface-variant/60 hover:text-on-surface-variant"
            title="New file"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* New file input */}
      {creating && (
        <div className="px-3 py-2 border-b border-outline-variant/20">
          <input
            type="text"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateFile();
              if (e.key === "Escape") {
                setCreating(false);
                setNewFileName("");
              }
            }}
            placeholder="path/to/file.md"
            autoFocus
            className="w-full bg-surface-container-lowest text-on-surface text-xs font-mono px-2 py-1.5 rounded border border-outline-variant/30 focus:border-primary/50 focus:outline-none placeholder:text-on-surface-variant/40"
          />
        </div>
      )}

      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-1">
        {loading && (
          <div className="flex items-center gap-2 px-3 py-4 text-on-surface-variant/60">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="font-label text-xs">Loading files...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 px-3 py-4 text-error">
            <AlertCircle className="w-4 h-4" />
            <span className="font-label text-xs">{error}</span>
          </div>
        )}

        {!loading && !error && tree && tree.children && (
          <>
            {sortNodes(tree.children).map((child) => (
              <TreeNode
                key={child.path}
                node={child}
                depth={0}
                selectedFile={selectedFile}
                onSelectFile={onSelectFile}
                expandedFolders={expandedFolders}
                toggleFolder={toggleFolder}
              />
            ))}
          </>
        )}

        {!loading && !error && tree && (!tree.children || tree.children.length === 0) && (
          <div className="px-3 py-4 text-center">
            <p className="font-label text-xs text-on-surface-variant/60">
              Vault is empty
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
