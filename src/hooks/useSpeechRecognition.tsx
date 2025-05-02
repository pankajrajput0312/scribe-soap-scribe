import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RealtimeTranscriber } from 'assemblyai';
import { debounce } from 'lodash';

interface TranscriptionSegment {
  text: string;
  isFinal: boolean;
  id: string;
}

interface SpeakerSegment {
  speaker: string;
  text: string;
}

interface UseSpeechRecognitionReturn {
  transcript: string;
  transcriptSegments: TranscriptionSegment[];
  isRecording: boolean;
  toggleRecording: () => Promise<void>;
  error: string | null;
  isInitialized: boolean;
  isInitializing: boolean;
  browserSupportsSpeechRecognition: boolean;
  enhancedTranscript: SpeakerSegment[];
  selectedSpeakers: string[];
  setSelectedSpeakers: (speakers: string[]) => void;
}

export const useSpeechRecognition = (): UseSpeechRecognitionReturn => {
  const [transcript, setTranscript] = useState<string>('');
  const [transcriptSegments, setTranscriptSegments] = useState<TranscriptionSegment[]>([]);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const [enhancedTranscript, setEnhancedTranscript] = useState<SpeakerSegment[]>([]);
  const [selectedSpeakers, setSelectedSpeakers] = useState<string[]>(['Doctor', 'Patient']);
  const isInitializedRef = useRef<boolean>(false);
  const isRecordingRef = useRef<boolean>(false);
  const lastInterimId = useRef<string | null>(null);
  const recentAudioCache = useRef<Set<string>>(new Set());
  
  const transcriberRef = useRef<RealtimeTranscriber | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Keep track of the last final text to avoid duplicates
  const lastFinalTextRef = useRef<string>('');

  // Add socket status tracking
  const [isSocketConnected, setIsSocketConnected] = useState<boolean>(false);
  const socketCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const checkSocketConnection = useCallback(() => {
    // Use our tracked state and initialization status
    return isInitializedRef.current && isSocketConnected;
  }, [isSocketConnected]);

  // Update transcript from segments with duplicate prevention
  useEffect(() => {
    // Get all final segments
    const finalSegments = transcriptSegments.filter(segment => segment.isFinal);
    
    // Get the latest interim segment
    const latestInterim = transcriptSegments
      .filter(segment => !segment.isFinal)
      .pop();

    // Build final text without duplicates
    const finalText = finalSegments
      .map(segment => segment.text)
      .join(' ')
      .trim();

    // Only include interim if it's not part of the final text
    const interimText = latestInterim?.text || '';
    const shouldShowInterim = interimText && !finalText.endsWith(interimText);

    setTranscript(
      `${finalText}${shouldShowInterim ? ' ' + interimText : ''}`
    );
  }, [transcriptSegments]);

  // Handle transcript updates with duplicate prevention
  const updateTranscript = useCallback((message: any) => {
    if (!message?.text?.trim()) return;

    const text = message.text.trim();
    const isFinal = message.message_type === 'FinalTranscript';
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // For final transcripts, check if it's not a duplicate
    if (isFinal) {
      // If this final text is already included in our last final text, skip it
      if (lastFinalTextRef.current.includes(text)) {
        return;
      }
      lastFinalTextRef.current = text;
    }

    setTranscriptSegments(prevSegments => {
      // Remove any interim segments that are now part of this final text
      const filteredSegments = isFinal
        ? prevSegments.filter(s => s.isFinal)
        : prevSegments.filter(s => s.isFinal || s.id === lastInterimId.current);

      // If this is an interim result, store its ID
      if (!isFinal) {
        lastInterimId.current = id;
      } else {
        lastInterimId.current = null;
      }

      // Add new segment
      return [...filteredSegments, { text, isFinal, id }];
    });
  }, []);

  // Debounced version for interim results with longer delay
  const debouncedUpdateTranscript = useCallback(
    debounce((message: any) => {
      if (message.message_type !== 'FinalTranscript') {
        updateTranscript(message);
      }
    }, 500), 
    [updateTranscript]
  );

  const getToken = async () => {
    try {
      console.log('Fetching token...');
      const response = await fetch('https://automationapi.getmentore.com/soap-report/token');
      console.log('Token response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to get token: ${errorData.error || response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Token received:', data);
      return data.token;
    } catch (error) {
      console.error('Error getting token:', error);
      setError(error instanceof Error ? error.message : 'Failed to get token');
      throw error;
    }
  };

  const processTranscriptWithSpeakers = async (text: string) => {
    try {
      const response = await fetch('http://localhost:3000/soap-report/speaker-labeled', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          speakers: selectedSpeakers,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to process transcript');
      }

      setEnhancedTranscript(data.data.conversation);
    } catch (error) {
      console.error('Error processing transcript:', error);
      setError(error instanceof Error ? error.message : 'Failed to process transcript');
    }
  };

  const stopRecording = useCallback(() => {
    console.log('Stopping recording...');
    isRecordingRef.current = false;
    setIsRecording(false);
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Process transcript with speakers when recording stops
    if (transcript.trim()) {
      processTranscriptWithSpeakers(transcript);
    }
    
    console.log('Recording stopped');
  }, [transcript]);

  const initializeTranscriber = async () => {
    try {
      if (transcriberRef.current) {
        try {
          await transcriberRef.current.close();
        } catch (error) {
          console.log('Error closing existing transcriber:', error);
        }
        transcriberRef.current = null;
      }

      const token = await getToken();
      const transcriber = new RealtimeTranscriber({
        token,
        sampleRate: 16000,
        wordBoost: ['patient', 'doctor', 'medical', 'health', 'symptoms', 'treatment'],
        encoding: 'pcm_s16le'
      });

      transcriber.on('open', ({ sessionId }) => {
        console.log(`Session opened: ${sessionId}`);
        isInitializedRef.current = true;
        setIsInitialized(true);
        setIsSocketConnected(true);
      });

      transcriber.on('error', (error) => {
        console.error('Transcription error:', error);
        setError(error.message);
        setIsSocketConnected(false);
      });

      transcriber.on('close', () => {
        console.log('Socket connection closed');
        setIsSocketConnected(false);
      });

      transcriber.on('transcript', (message) => {
        if (message?.text?.trim()) {
          if (message.message_type === 'FinalTranscript') {
            updateTranscript(message);
          } else {
            debouncedUpdateTranscript(message);
          }
        }
      });

      transcriberRef.current = transcriber;
      await transcriber.connect();

      // Wait for initialization with timeout
      const startTime = Date.now();
      while (!isInitializedRef.current && Date.now() - startTime < 5000) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      if (!isInitializedRef.current) {
        throw new Error('Initialization timeout');
      }
    } catch (error) {
      console.error('Initialization error:', error);
      throw error;
    }
  };

  // Initialize transcriber on component mount
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsInitializing(true);
        await initializeTranscriber();
        setIsInitializing(false);
      } catch (error) {
        console.error('Failed to initialize on mount:', error);
        setError(error instanceof Error ? error.message : 'Initialization failed');
        setIsInitializing(false);
      }
    };

    initialize();

    // Cleanup on unmount
    return () => {
      stopRecording();
      if (transcriberRef.current) {
        transcriberRef.current.close();
      }
      if (socketCheckTimeoutRef.current) {
        clearTimeout(socketCheckTimeoutRef.current);
      }
    };
  }, []);

  const toggleRecording = async () => {
    try {
      if (isRecording) {
        console.log('Stopping current recording...');
        stopRecording();
      } else {
        console.log('Starting new recording...');
        setError(null);

        // Check socket connection before starting
        if (!isSocketConnected || !checkSocketConnection()) {
          console.log('Socket not connected, reinitializing...');
          setIsInitializing(true);
          try {
            await initializeTranscriber();
          } catch (error) {
            console.error('Failed to reinitialize transcriber:', error);
            setError(error instanceof Error ? error.message : 'Initialization failed');
            setIsInitializing(false);
            return;
          }
          setIsInitializing(false);
        }

        try {
          console.log('Requesting microphone access...');
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              sampleRate: 16000,
              channelCount: 1,
              echoCancellation: true,
              noiseSuppression: true,
            }
          });

          // Set up audio processing
          await setupAudioProcessing(stream);
          
          // Only set recording state after everything is set up
          isRecordingRef.current = true;
          setIsRecording(true);
        } catch (error) {
          console.error('Setup error:', error);
          stopRecording();
          setError(error instanceof Error ? error.message : 'Setup failed');
          throw error;
        }
      }
    } catch (err) {
      console.error('Error in toggleRecording:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      stopRecording();
      setIsInitialized(false);
    }
  };

  // New helper function to set up audio processing
  const setupAudioProcessing = async (stream: MediaStream) => {
    console.log('Setting up audio processing...');
    mediaStreamRef.current = stream;

    const audioContext = new AudioContext({ 
      sampleRate: 16000,
      latencyHint: 'interactive'
    });
    audioContextRef.current = audioContext;

    // Load and register the audio worklet
    await audioContext.audioWorklet.addModule('/audio-processor.js');
    
    const source = audioContext.createMediaStreamSource(stream);
    const workletNode = new AudioWorkletNode(audioContext, 'audio-processor', {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      channelCount: 1,
      processorOptions: {
        sampleRate: audioContext.sampleRate
      }
    });

    // Set up worklet message handling
    workletNode.port.onmessage = (event) => {
      const { type, data, bufferInfo } = event.data;
      if (type === 'audio') {
        handleAudioData(data, bufferInfo);
      }
    };

    // Connect the audio nodes
    source.connect(workletNode);
    workletNode.connect(audioContext.destination);
    console.log('Audio processing setup complete');
  };

  const handleAudioData = async (audioData: Int16Array, bufferInfo: any) => {
    if (!transcriberRef.current || !isInitializedRef.current || !isRecordingRef.current) {
      return;
    }

    try {
      // Check if this is an end of speech marker
      if (bufferInfo.isEndOfSpeech) {
        console.log('End of speech detected, duration:', bufferInfo.silenceDuration);
        return;
      }

      // Generate cache key based on first few samples
      const cacheKey = Array.from(audioData.slice(0, 10)).join(',');
      if (recentAudioCache.current.has(cacheKey)) {
        return;
      }

      // Add to cache and remove old entries
      recentAudioCache.current.add(cacheKey);
      if (recentAudioCache.current.size > 100) {
        recentAudioCache.current.clear();
      }

      // Send raw buffer to AssemblyAI
      await transcriberRef.current.sendAudio(audioData.buffer);
    } catch (error) {
      console.error('Error processing audio data:', error);
      if (error.message.includes('Socket is not open')) {
        setIsSocketConnected(false);
      }
    }
  };

  return {
    transcript,
    transcriptSegments,
    isRecording,
    toggleRecording,
    error,
    isInitialized,
    isInitializing,
    browserSupportsSpeechRecognition: typeof window !== 'undefined' && 
      'mediaDevices' in navigator && 
      'getUserMedia' in navigator.mediaDevices,
    enhancedTranscript,
    selectedSpeakers,
    setSelectedSpeakers,
  };
};
