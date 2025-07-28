import { useState, useRef, useCallback, useEffect } from 'react';

interface VoiceRecordingState {
  isRecording: boolean;
  isProcessing: boolean;
  transcript: string;
  error: string | null;
  audioBlob: Blob | null;
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  speechRecognitionSupported: boolean;
  finalTranscript: string;
  interimTranscript: string;
}

export const useVoiceRecording = (language: string = 'en-US') => {
  const [state, setState] = useState<VoiceRecordingState>({
    isRecording: false,
    isProcessing: false,
    transcript: '',
    error: null,
    audioBlob: null,
    isMobile: false,
    isIOS: false,
    isAndroid: false,
    speechRecognitionSupported: false,
    finalTranscript: '',
    interimTranscript: '',
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const processedResultIndexRef = useRef<number>(0);

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isAndroid = /Android/.test(navigator.userAgent);
    const isMobile = isIOS || isAndroid;
    const speechRecognitionSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    
    setState(prev => ({ 
      ...prev, 
      isIOS,
      isAndroid,
      isMobile,
      speechRecognitionSupported: speechRecognitionSupported && !isMobile 
    }));
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setState(prev => ({ 
        ...prev, 
        error: null, 
        transcript: '', 
        isProcessing: false,
        finalTranscript: '',
        interimTranscript: ''
      }));
      
      if (state.isMobile) {
        const deviceType = state.isIOS ? 'iOS' : 'Android';
        setState(prev => ({ 
          ...prev, 
          error: `On ${deviceType}, please use the microphone button on your keyboard to dictate text directly into the explanation field.`,
          isRecording: false 
        }));
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
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

      if (state.speechRecognitionSupported) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = language;
        console.log('Setting speech recognition language to:', language);

        recognitionRef.current.onresult = (event) => {
          let finalTranscript = '';
          let interimTranscript = '';

          // Process all results to build the complete transcript
          for (let i = 0; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }

          setState(prev => ({ 
            ...prev, 
            finalTranscript: finalTranscript,
            interimTranscript: interimTranscript,
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
        };

        recognitionRef.current.start();
      }

      mediaRecorderRef.current.start();
      processedResultIndexRef.current = 0;
      setState(prev => ({ ...prev, isRecording: true }));

    } catch (error) {
      console.error('Error starting recording:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to start recording. Please check microphone permissions.',
        isRecording: false 
      }));
    }
  }, [state.isIOS, state.speechRecognitionSupported, language]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording) {
      setState(prev => ({ ...prev, isRecording: false, isProcessing: true }));
      
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      
      mediaRecorderRef.current.stop();
    }
  }, [state.isRecording]);

  const resetRecording = useCallback(() => {
    setState(prev => ({
      ...prev,
      isRecording: false,
      isProcessing: false,
      transcript: '',
      error: null,
      audioBlob: null,
      finalTranscript: '',
      interimTranscript: '',
    }));
    audioChunksRef.current = [];
  }, []);

  const isSupported = useCallback(() => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) || state.isMobile;
  }, [state.isMobile]);

  return {
    ...state,
    startRecording,
    stopRecording,
    resetRecording,
    isSupported: isSupported(),
  };
};