import { useState } from "react";
import SessionConfigPanel from "../config/SessionConfigPanel";
import FilePreviewPanel from "../context/FilePreviewPanel";
import { useIsMobile } from "../../hooks/useIsMobile";
import { Settings2 } from "lucide-react";

interface ConfigViewProps {
  onOpenFile?: (path: string) => void;
}

export default function ConfigView({ onOpenFile }: ConfigViewProps) {
  const isMobile = useIsMobile();
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  const handleSelectFile = (path: string) => {
    if (isMobile) {
      onOpenFile?.(path);
    } else {
      setSelectedPath(path);
    }
  };

  if (isMobile) {
    return (
      <div className="h-full overflow-y-auto">
        <SessionConfigPanel
          onSelectFile={handleSelectFile}
          onOpenPolicyEditor={() => {}}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full gap-2 p-2">
      {/* Left panel — config tree */}
      <div className="w-72 flex-shrink-0 bark-card">
        <SessionConfigPanel
          onSelectFile={handleSelectFile}
          onOpenPolicyEditor={() => {}}
          selectedPath={selectedPath}
        />
      </div>

      {/* Right panel — detail view */}
      <div className="flex-1 h-full bark-card min-w-0">
        {selectedPath ? (
          <FilePreviewPanel filePath={selectedPath} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <Settings2 className="w-10 h-10 text-on-surface-variant/10 mb-3" />
            <p className="font-label text-sm text-on-surface-variant/65">
              Select a skill or hook to view details
            </p>
            <p className="font-label text-xs text-on-surface-variant/25 mt-1">
              Click an item in the list to preview its configuration
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
