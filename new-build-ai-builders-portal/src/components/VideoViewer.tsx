import { cn } from "@/lib/utils";

interface VideoViewerProps {
  loomUrl: string;
  caption?: string;
  className?: string;
}

function extractId(url: string): string | null {
  const match = url.match(/loom\.com\/(?:share|embed)\/([a-f0-9]+)/);
  return match ? match[1] : null;
}

export function VideoViewer({ loomUrl, caption, className }: VideoViewerProps) {
  const videoId = extractId(loomUrl);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl bg-surface-container-low",
        className,
      )}
    >
      {/* 16:9 aspect ratio container */}
      <div
        className="relative w-full bg-surface-container-lowest"
        style={{ paddingBottom: "56.25%" }}
      >
        {videoId ? (
          <iframe
            className="absolute inset-0 h-full w-full border-0"
            src={`https://www.loom.com/embed/${videoId}?hide_owner=true&hide_share=true&hide_title=true`}
            allow="fullscreen"
            title="Loom video"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-label text-sm text-on-primary-container">
              Invalid Loom URL
            </span>
          </div>
        )}
      </div>

      {/* Optional caption */}
      {caption && (
        <p className="m-0 px-4 py-2 font-label text-xs text-on-primary-container">{caption}</p>
      )}
    </div>
  );
}
