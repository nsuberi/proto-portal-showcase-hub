import { Mic, AlertCircle } from "lucide-react";

interface VoiceIndicatorProps {
  isRecording: boolean;
  isTranscribing: boolean;
  volumeLevel: number;
  error: string | null;
}

export default function VoiceIndicator({
  isRecording,
  isTranscribing,
  volumeLevel,
  error,
}: VoiceIndicatorProps) {
  if (error) {
    return (
      <span className="inline-flex items-center gap-1 font-label text-[10px] text-error/80">
        <AlertCircle className="w-3 h-3" />
        {error}
      </span>
    );
  }

  if (isTranscribing) {
    return (
      <span className="inline-flex items-center gap-1 font-label text-[10px] text-tertiary animate-pulse">
        <Mic className="w-3 h-3" />
        Transcribing...
      </span>
    );
  }

  if (isRecording) {
    // Scale the dot slightly with volume for visual feedback
    const scale = 1 + volumeLevel * 0.5;

    return (
      <span className="inline-flex items-center gap-1.5 font-label text-[10px] text-error">
        <span
          className="inline-block w-2 h-2 rounded-full bg-error animate-pulse"
          style={{ transform: `scale(${scale})` }}
        />
        Listening...
      </span>
    );
  }

  return null;
}
