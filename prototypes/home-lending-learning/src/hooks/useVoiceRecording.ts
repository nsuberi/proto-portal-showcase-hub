import { useState, useRef, useCallback } from 'react';

interface VoiceRecordingState {
  isRecording: boolean;
  isProcessing: boolean;
  transcript: string;
  error: string | null;
  audioBlob: Blob | null;
}

export const useVoiceRecording = (language: string = 'en-US') => {
  const [state, setState] = useState<VoiceRecordingState>({
    isRecording: false,
    isProcessing: false,
    transcript: '',
    error: null,
    audioBlob: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const startRecording = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null, transcript: '', isProcessing: false }));
      
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup MediaRecorder for audio recording
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setState(prev => ({ ...prev, audioBlob, isProcessing: false }));
        stream.getTracks().forEach(track => track.stop());
      };

      // Setup Speech Recognition for live transcription
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = language;
        console.log('Setting speech recognition language to:', language);

        recognitionRef.current.onresult = (event) => {
          let finalTranscript = '';
          let interimTranscript = '';

          for (let i = 0; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          setState(prev => ({ 
            ...prev, 
            transcript: finalTranscript + interimTranscript 
          }));
        };

        recognitionRef.current.onerror = (event) => {
          console.warn('Speech recognition error:', event.error, 'Language:', language);
          if (event.error === 'language-not-supported') {
            setState(prev => ({ 
              ...prev, 
              error: `Language ${language} is not supported. Try switching to English.`
            }));
          }
          // Don't set error state for other speech recognition issues, just continue with recording
        };

        recognitionRef.current.start();
      }

      // Start recording
      mediaRecorderRef.current.start();
      setState(prev => ({ ...prev, isRecording: true }));

    } catch (error) {
      console.error('Error starting recording:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to start recording. Please check microphone permissions.',
        isRecording: false 
      }));
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording) {
      setState(prev => ({ ...prev, isRecording: false, isProcessing: true }));
      
      // Stop speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      
      // Stop media recorder
      mediaRecorderRef.current.stop();
    }
  }, [state.isRecording]);

  const resetRecording = useCallback(() => {
    setState({
      isRecording: false,
      isProcessing: false,
      transcript: '',
      error: null,
      audioBlob: null,
    });
    audioChunksRef.current = [];
  }, []);

  const isSupported = useCallback(() => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }, []);

  return {
    ...state,
    startRecording,
    stopRecording,
    resetRecording,
    isSupported: isSupported(),
  };
};