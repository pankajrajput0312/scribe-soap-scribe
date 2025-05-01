
import { useState, useEffect, useCallback } from 'react';

interface SpeechRecognitionHook {
  transcript: string;
  isRecording: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  toggleRecording: () => void;
  resetTranscript: () => void;
  browserSupportsSpeechRecognition: boolean;
}

export const useSpeechRecognition = (): SpeechRecognitionHook => {
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);

  const browserSupportsSpeechRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

  // Initialize speech recognition
  useEffect(() => {
    if (!browserSupportsSpeechRecognition) return;

    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let currentTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      setTranscript(currentTranscript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setIsRecording(false);
      }
    };

    recognition.onend = () => {
      if (isRecording) {
        recognition.start();
      }
    };

    setRecognitionInstance(recognition);

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [browserSupportsSpeechRecognition]);

  const startRecording = useCallback(() => {
    if (recognitionInstance && browserSupportsSpeechRecognition) {
      recognitionInstance.start();
      setIsRecording(true);
    }
  }, [recognitionInstance, browserSupportsSpeechRecognition]);

  const stopRecording = useCallback(() => {
    if (recognitionInstance) {
      recognitionInstance.stop();
      setIsRecording(false);
    }
  }, [recognitionInstance]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return {
    transcript,
    isRecording,
    startRecording,
    stopRecording,
    toggleRecording,
    resetTranscript,
    browserSupportsSpeechRecognition,
  };
};

export default useSpeechRecognition;
