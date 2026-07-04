import { useState, useCallback, useRef, useEffect } from "react";
import {
  File,
  Folder,
  FolderOpen,
  FolderPlus,
  FilePlus,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  AlertCircle,
  Loader2,
  Trash2,
  Download,
} from "lucide-react";
import {
  useVaultTree,
  createVaultFile,
  createVaultFolder,
  moveVaultFile,
  deleteVaultFile,
  downloadVault,
  type VaultNode,
} from "../../hooks/useVaultApi";

interface ConfirmDeleteModalProps {
  node: VaultNode;
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}

function ConfirmDeleteModal({
  node,
  onConfirm,
  onCancel,
  deleting,
}: ConfirmDeleteModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const isFolder = node.type === "directory";

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-on-surface/10 backdrop-blur-sm"
        onClick={onCancel}
      />
      {/* Modal */}
      <div
        ref={panelRef}
        className="relative w-80 rounded-xl bg-[#1a1b20] border border-outline-variant/40 shadow-2xl overflow-hidden"
      >
        <div className="px-4 pt-4 pb-3">
          <h3 className="font-label text-sm font-semibold text-on-surface mb-1">
            Delete {isFolder ? "folder" : "file"}
          </h3>
          <p className="font-label text-xs text-on-surface-variant/80 leading-relaxed">
            Are you sure you want to delete{" "}
            <span className="text-on-surface/88 font-mono">{node.name}</span>?
            {isFolder && " The folder must be empty to delete."}
            {" "}This cannot be undone.
          </p>
        </div>
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-outline-variant/30">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="font-label text-xs px-3 py-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-on-surface/[0.06] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="font-label text-xs font-semibold px-3 py-1.5 rounded-lg bg-error text-on-error hover:bg-error/80 transition-colors disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

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
  onDrop: (sourcePath: string, targetFolderPath: string) => void;
  onRequestDelete: (node: VaultNode) => void;
  creatingIn: string | null;
  creatingType: "file" | "folder" | null;
  newItemName: string;
  onNewItemNameChange: (name: string) => void;
  onCreateConfirm: () => void;
  onCreateCancel: () => void;
}

function TreeNode({
  node,
  depth,
  selectedFile,
  onSelectFile,
  expandedFolders,
  toggleFolder,
  onDrop,
  onRequestDelete,
  creatingIn,
  creatingType,
  newItemName,
  onNewItemNameChange,
  onCreateConfirm,
  onCreateCancel,
}: TreeNodeProps) {
  const isDirectory = node.type === "directory";
  const isExpanded = expandedFolders.has(node.path);
  const isSelected = selectedFile === node.path;
  const [dragOver, setDragOver] = useState(false);

  const handleClick = () => {
    if (isDirectory) {
      toggleFolder(node.path);
    } else {
      onSelectFile(node.path);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", node.path);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!isDirectory) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDropOnNode = (e: React.DragEvent) => {
    if (!isDirectory) return;
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const sourcePath = e.dataTransfer.getData("text/plain");
    if (sourcePath && sourcePath !== node.path) {
      onDrop(sourcePath, node.path);
    }
  };

  const paddingLeft = 8 + depth * 16;
  const showInlineCreate = isDirectory && creatingIn === node.path;

  return (
    <>
      <div
        className={`group w-full flex items-center py-1 px-2 text-sm font-label transition-colors hover:bg-surface-container-high/60 ${
          isSelected
            ? "bg-primary-container text-primary"
            : "text-on-surface-variant"
        } ${dragOver ? "bg-primary/20 outline outline-1 outline-primary/40" : ""}`}
        style={{ paddingLeft }}
        draggable
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDropOnNode}
      >
        <button
          onClick={handleClick}
          className="flex-1 min-w-0 flex items-center gap-1.5 text-left"
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
        <div className={`flex items-center gap-0.5 flex-shrink-0 transition-opacity ${
          isSelected ? "opacity-100" : "opacity-50 group-hover:opacity-100"
        }`}>
          {isDirectory && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                downloadVault(node.path).catch((err) => alert(err.message));
              }}
              className="p-1.5 rounded hover:bg-primary/20 text-on-surface-variant hover:text-primary transition-colors"
              title={`Download ${node.name} as ZIP`}
            >
              <Download className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRequestDelete(node);
            }}
            className="p-1.5 rounded hover:bg-error/20 text-on-surface-variant hover:text-error transition-colors"
            title={`Delete ${isDirectory ? "folder" : "file"}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isDirectory && isExpanded && (
        <div>
          {showInlineCreate && (
            <div
              className="flex items-center gap-1.5 py-1 px-2"
              style={{ paddingLeft: paddingLeft + 16 }}
            >
              {creatingType === "folder" ? (
                <Folder className="w-4 h-4 flex-shrink-0 text-tertiary/80" />
              ) : (
                <File className="w-4 h-4 flex-shrink-0 opacity-60" />
              )}
              <input
                type="text"
                value={newItemName}
                onChange={(e) => onNewItemNameChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onCreateConfirm();
                  if (e.key === "Escape") onCreateCancel();
                }}
                placeholder={
                  creatingType === "folder" ? "folder name" : "file.md"
                }
                autoFocus
                className="flex-1 min-w-0 bg-surface-container-lowest text-on-surface text-xs font-mono px-2 py-1 rounded border border-outline-variant/30 focus:border-primary/50 focus:outline-none placeholder:text-on-surface-variant/65"
              />
            </div>
          )}
          {node.children &&
            sortNodes(node.children).map((child) => (
              <TreeNode
                key={child.path}
                node={child}
                depth={depth + 1}
                selectedFile={selectedFile}
                onSelectFile={onSelectFile}
                expandedFolders={expandedFolders}
                toggleFolder={toggleFolder}
                onDrop={onDrop}
                onRequestDelete={onRequestDelete}
                creatingIn={creatingIn}
                creatingType={creatingType}
                newItemName={newItemName}
                onNewItemNameChange={onNewItemNameChange}
                onCreateConfirm={onCreateConfirm}
                onCreateCancel={onCreateCancel}
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

  // Root-level creation state (when no folder context)
  const [creatingRoot, setCreatingRoot] = useState<"file" | "folder" | null>(
    null
  );
  const [rootNewName, setRootNewName] = useState("");

  // In-folder creation state
  const [creatingIn, setCreatingIn] = useState<string | null>(null);
  const [creatingType, setCreatingType] = useState<"file" | "folder" | null>(
    null
  );
  const [newItemName, setNewItemName] = useState("");

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<VaultNode | null>(null);
  const [deleting, setDeleting] = useState(false);

  const treeContainerRef = useRef<HTMLDivElement>(null);

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

  // Start creating a file or folder at the root or inside a selected folder
  const startCreating = useCallback(
    (type: "file" | "folder") => {
      // If a folder is currently selected, create inside it
      if (selectedFile) {
        const selectedNode = findNode(tree, selectedFile);
        if (selectedNode && selectedNode.type === "directory") {
          setCreatingIn(selectedNode.path);
          setCreatingType(type);
          setNewItemName("");
          // Expand the folder so the input is visible
          setExpandedFolders((prev) => new Set(prev).add(selectedNode.path));
          setCreatingRoot(null);
          setRootNewName("");
          return;
        }
      }
      // Otherwise create at root
      setCreatingRoot(type);
      setRootNewName("");
      setCreatingIn(null);
      setCreatingType(null);
      setNewItemName("");
    },
    [selectedFile, tree]
  );

  const cancelCreate = useCallback(() => {
    setCreatingRoot(null);
    setRootNewName("");
    setCreatingIn(null);
    setCreatingType(null);
    setNewItemName("");
  }, []);

  const handleRootCreate = useCallback(async () => {
    const name = rootNewName.trim();
    if (!name || !creatingRoot) return;
    try {
      if (creatingRoot === "folder") {
        await createVaultFolder(name);
      } else {
        await createVaultFile(name);
        onSelectFile(name);
      }
      cancelCreate();
      refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create");
    }
  }, [rootNewName, creatingRoot, refetch, onSelectFile, cancelCreate]);

  const handleInFolderCreate = useCallback(async () => {
    const name = newItemName.trim();
    if (!name || !creatingIn || !creatingType) return;
    const fullPath = creatingIn ? `${creatingIn}/${name}` : name;
    try {
      if (creatingType === "folder") {
        await createVaultFolder(fullPath);
      } else {
        await createVaultFile(fullPath);
        onSelectFile(fullPath);
      }
      cancelCreate();
      refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create");
    }
  }, [
    newItemName,
    creatingIn,
    creatingType,
    refetch,
    onSelectFile,
    cancelCreate,
  ]);

  // Drag-and-drop handler: move source into target folder
  const handleDrop = useCallback(
    async (sourcePath: string, targetFolderPath: string) => {
      const sourceName = sourcePath.split("/").pop() || sourcePath;
      const newPath = targetFolderPath
        ? `${targetFolderPath}/${sourceName}`
        : sourceName;
      if (newPath === sourcePath) return;
      // Don't allow dropping a folder into itself or a descendant
      if (targetFolderPath.startsWith(sourcePath + "/")) return;
      try {
        await moveVaultFile(sourcePath, newPath);
        refetch();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to move");
      }
    },
    [refetch]
  );

  // Drop on the root area (tree container background)
  const handleRootDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const sourcePath = e.dataTransfer.getData("text/plain");
      if (!sourcePath) return;
      // Moving to root means stripping the parent path
      const sourceName = sourcePath.split("/").pop() || sourcePath;
      if (sourceName === sourcePath) return; // already at root
      handleDrop(sourcePath, "");
    },
    [handleDrop]
  );

  const handleRootDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteVaultFile(deleteTarget.path);
      // Clear selection if the deleted item was open
      if (selectedFile === deleteTarget.path) {
        onSelectFile("");
      }
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, selectedFile, onSelectFile, refetch]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="glass-header flex items-center justify-between px-3 py-2">
        <span className="font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant/80">
          Files
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={refetch}
            className="p-1 rounded hover:bg-surface-container-high transition-colors text-on-surface-variant/80 hover:text-on-surface-variant"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => startCreating("file")}
            className="p-1 rounded hover:bg-surface-container-high transition-colors text-on-surface-variant/80 hover:text-on-surface-variant"
            title="New file"
          >
            <FilePlus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => startCreating("folder")}
            className="p-1 rounded hover:bg-surface-container-high transition-colors text-on-surface-variant/80 hover:text-on-surface-variant"
            title="New folder"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
          <span className="w-px h-4 bg-on-surface-variant/20 mx-0.5" />
          <button
            onClick={() =>
              downloadVault().catch((err) => alert(err.message))
            }
            className="p-1 rounded hover:bg-primary/20 transition-colors text-on-surface-variant/80 hover:text-primary"
            title="Download vault as ZIP"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Root-level new item input */}
      {creatingRoot && (
        <div className="px-3 py-2 border-b border-outline-variant/30 flex items-center gap-1.5">
          {creatingRoot === "folder" ? (
            <Folder className="w-4 h-4 flex-shrink-0 text-tertiary/80" />
          ) : (
            <File className="w-4 h-4 flex-shrink-0 opacity-60" />
          )}
          <input
            type="text"
            value={rootNewName}
            onChange={(e) => setRootNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRootCreate();
              if (e.key === "Escape") cancelCreate();
            }}
            placeholder={
              creatingRoot === "folder" ? "folder name" : "path/to/file.md"
            }
            autoFocus
            className="flex-1 min-w-0 bg-surface-container-lowest text-on-surface text-xs font-mono px-2 py-1.5 rounded border border-outline-variant/30 focus:border-primary/50 focus:outline-none placeholder:text-on-surface-variant/65"
          />
        </div>
      )}

      {/* Tree */}
      <div
        ref={treeContainerRef}
        className="flex-1 overflow-y-auto py-1"
        onDragOver={handleRootDragOver}
        onDrop={handleRootDrop}
      >
        {loading && (
          <div className="flex items-center gap-2 px-3 py-4 text-on-surface-variant/80">
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
                onDrop={handleDrop}
                onRequestDelete={setDeleteTarget}
                creatingIn={creatingIn}
                creatingType={creatingType}
                newItemName={newItemName}
                onNewItemNameChange={setNewItemName}
                onCreateConfirm={handleInFolderCreate}
                onCreateCancel={cancelCreate}
              />
            ))}
          </>
        )}

        {!loading &&
          !error &&
          tree &&
          (!tree.children || tree.children.length === 0) && (
            <div className="px-3 py-4 text-center">
              <p className="font-label text-xs text-on-surface-variant/80">
                Vault is empty
              </p>
            </div>
          )}
      </div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <ConfirmDeleteModal
          node={deleteTarget}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}
    </div>
  );
}

/** Find a node by path in the tree. */
function findNode(tree: VaultNode | null, targetPath: string): VaultNode | null {
  if (!tree) return null;
  if (tree.path === targetPath) return tree;
  if (tree.children) {
    for (const child of tree.children) {
      const found = findNode(child, targetPath);
      if (found) return found;
    }
  }
  return null;
}
