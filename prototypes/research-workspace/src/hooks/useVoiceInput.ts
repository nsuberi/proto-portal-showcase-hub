import { useEffect, useRef, useState, useCallback, type RefObject } from "react";
import type { Terminal } from "@xterm/xterm";

type VoiceState = "idle" | "waiting" | "recording" | "transcribing";

export interface UseVoiceInputResult {
  isRecording: boolean;
  isTranscribing: boolean;
  volumeLevel: number;
  error: string | null;
}

interface UseVoiceInputOptions {
  terminalRef: RefObject<Terminal | null>;
  wsRef: RefObject<WebSocket | null>;
  enabled?: boolean;
  /** Flip this when the terminal instance is ready (triggers handler attachment). */
  ready?: boolean;
}

// Minimum hold duration (ms) before activating voice vs typing a space
const HOLD_THRESHOLD_MS = 300;

/**
 * Adds hold-spacebar-to-dictate to an xterm.js terminal.
 *
 * Quick space press (<300ms) → sends " " to terminal.
 * Long hold (≥300ms) → records from mic, transcribes via Web Speech API,
 * then injects the text into the terminal WebSocket.
 */
export function useVoiceInput({
  terminalRef,
  wsRef,
  enabled = true,
  ready = true,
}: UseVoiceInputOptions): UseVoiceInputResult {
  const [state, setState] = useState<VoiceState>("idle");
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const stateRef = useRef<VoiceState>("idle");
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const setVoiceState = useCallback((next: VoiceState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  // Cleanup everything on unmount
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      recognitionRef.current?.abort();
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
      audioCtxRef.current?.close();
    };
  }, []);

  // Start mic + speech recognition
  const startRecording = useCallback(async () => {
    setError(null);

    // Check for Web Speech API support
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Voice input not supported in this browser");
      setVoiceState("idle");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Set up volume metering via AnalyserNode
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Animate volume level
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      function updateVolume() {
        if (stateRef.current !== "recording") return;
        analyser.getByteFrequencyData(dataArray);
        const avg =
          dataArray.reduce((sum, v) => sum + v, 0) / dataArray.length;
        setVolumeLevel(Math.min(1, avg / 128));
        animFrameRef.current = requestAnimationFrame(updateVolume);
      }
      updateVolume();

      // Start speech recognition
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = "en-US";
      recognitionRef.current = recognition;

      let transcript = "";

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            transcript += event.results[i][0].transcript;
          }
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (event.error === "no-speech") {
          // Silence — not an error, just no input detected
          return;
        }
        console.warn("[voice] recognition error:", event.error);
        setError(`Speech error: ${event.error}`);
      };

      recognition.onend = () => {
        // Recognition ended (either we stopped it or it timed out)
        if (stateRef.current === "transcribing" || stateRef.current === "recording") {
          // Inject transcript into terminal
          const ws = wsRef.current;
          if (transcript && ws && ws.readyState === WebSocket.OPEN) {
            ws.send(transcript);
          } else if (transcript && !ws) {
            setError("WebSocket not connected");
          }

          // Cleanup
          stream.getTracks().forEach((t) => t.stop());
          mediaStreamRef.current = null;
          audioCtx.close();
          audioCtxRef.current = null;
          analyserRef.current = null;
          setVolumeLevel(0);
          setVoiceState("idle");

          if (!transcript) {
            setError("No speech detected");
            setTimeout(() => setError(null), 2000);
          } else {
            setError(null);
          }
        }
      };

      recognition.start();
      setVoiceState("recording");
    } catch (err) {
      const msg =
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Microphone permission denied"
          : "Could not access microphone";
      setError(msg);
      setVoiceState("idle");
    }
  }, [wsRef, setVoiceState]);

  // Stop recording → triggers transcription via recognition.onend
  const stopRecording = useCallback(() => {
    setVoiceState("transcribing");
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    recognitionRef.current?.stop();
  }, [setVoiceState]);

  // Attach xterm key handler
  // attachCustomKeyEventHandler returns void and replaces the previous handler,
  // so we use a ref-based enabled flag to effectively "detach" on cleanup.
  const handlerActiveRef = useRef(false);

  useEffect(() => {
    const term = terminalRef.current;
    if (!term || !enabled) return;

    handlerActiveRef.current = true;

    term.attachCustomKeyEventHandler((event: KeyboardEvent): boolean => {
      if (!handlerActiveRef.current) return true;

      // Only intercept unmodified Space
      if (event.code !== "Space" || event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) {
        return true; // pass through
      }

      // For printable characters like Space, xterm.js v5 processes input
      // through the textarea's `input` event (not keydown). Returning false
      // from this handler suppresses xterm's keydown processing, but the
      // browser still inserts the character into the textarea → onData fires.
      // So we do NOT manually send the space — onData handles it.

      if (event.type === "keydown") {
        if (stateRef.current === "idle") {
          // Start the hold timer — if released quickly, the space goes
          // through the normal onData path. If held, recording starts.
          holdTimerRef.current = setTimeout(() => {
            holdTimerRef.current = null;
            startRecording();
          }, HOLD_THRESHOLD_MS);
          return false;
        }
        // If already recording/waiting, suppress repeats
        return false;
      }

      if (event.type === "keyup") {
        if (stateRef.current === "idle" && holdTimerRef.current) {
          // Quick tap — cancel hold timer, space already sent via onData
          clearTimeout(holdTimerRef.current);
          holdTimerRef.current = null;
          return false;
        }

        if (stateRef.current === "recording") {
          stopRecording();
          return false;
        }

        return false;
      }

      return true;
    });

    return () => {
      handlerActiveRef.current = false;
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
      }
    };
  }, [terminalRef, wsRef, enabled, ready, startRecording, stopRecording]);

  return {
    isRecording: state === "recording",
    isTranscribing: state === "transcribing",
    volumeLevel,
    error,
  };
}
