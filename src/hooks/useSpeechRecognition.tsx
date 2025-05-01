import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RealtimeTranscriber } from 'assemblyai';

interface UseSpeechRecognitionReturn {
  transcript: string;
  isRecording: boolean;
  toggleRecording: () => Promise<void>;
  error: string | null;
  isInitialized: boolean;
  browserSupportsSpeechRecognition: boolean;
}

export const useSpeechRecognition = (): UseSpeechRecognitionReturn => {
  const [transcript, setTranscript] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const isInitializedRef = useRef<boolean>(false);
  const isRecordingRef = useRef<boolean>(false);
  
  const transcriberRef = useRef<RealtimeTranscriber | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorNodeRef = useRef<ScriptProcessorNode | null>(null);

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
    
    console.log('Recording stopped');
  }, []);

  const initializeTranscriber = async () => {
    try {
      if (transcriberRef.current) {
        console.log('Closing existing transcriber...');
        await transcriberRef.current.close();
        transcriberRef.current = null;
        isInitializedRef.current = false;
        setIsInitialized(false);
      }

      const token = await getToken();
      console.log('Got token, initializing transcriber...');

      const transcriber = new RealtimeTranscriber({
        token,
        sampleRate: 16000,
        wordBoost: ['patient', 'doctor', 'medical', 'health', 'symptoms', 'treatment'],
        encoding: 'pcm_s16le'
      });

      // Set up event listeners before connecting
      transcriber.on('open', ({ sessionId }) => {
        console.log(`Transcription session opened with ID: ${sessionId}`);
        isInitializedRef.current = true;
        setIsInitialized(true);
      });

      transcriber.on('error', (error) => {
        console.error('Transcription error:', error);
        setError(error.message);
        isInitializedRef.current = false;
        setIsInitialized(false);
        stopRecording();
      });

      transcriber.on('close', (code, reason) => {
        console.log('Transcription session closed:', code, reason);
        setIsRecording(false);
        isInitializedRef.current = false;
        setIsInitialized(false);
      });

      transcriber.on('transcript', (message) => {
        console.log('Raw transcript message:', message);
        
        if (message && typeof message === 'object') {
          const text = message.text || '';
          const messageType = message.message_type || '';
          
          console.log(`Received ${messageType}:`, text);
          
          if (text.trim()) {
            setTranscript(prev => {
              if (messageType === 'FinalTranscript') {
                return `${prev}${prev ? '. ' : ''}${text}`;
              }
              return `${prev.split('.').slice(0, -1).join('.')}${prev ? '. ' : ''}${text}`;
            });
          }
        }
      });

      transcriberRef.current = transcriber;
      
      // Connect and wait for initialization
      console.log('Connecting to AssemblyAI...');
      await transcriber.connect();
      
      // Wait for the initialized state to be true using the ref
      const timeout = 10000; // 10 seconds timeout
      const startTime = Date.now();
      
      while (!isInitializedRef.current && Date.now() - startTime < timeout) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      if (!isInitializedRef.current) {
        throw new Error('Transcriber failed to initialize within timeout');
      }
      
      console.log('Transcriber initialized and connected successfully');
      return transcriber;
    } catch (error) {
      console.error('Error initializing transcriber:', error);
      setError(error instanceof Error ? error.message : 'Failed to initialize transcriber');
      isInitializedRef.current = false;
      setIsInitialized(false);
      throw error;
    }
  };

  const toggleRecording = async () => {
    try {
      if (isRecording) {
        console.log('Stopping current recording...');
        stopRecording();
        if (transcriberRef.current) {
          await transcriberRef.current.close();
          isInitializedRef.current = false;
          setIsInitialized(false);
        }
      } else {
        console.log('Starting new recording...');
        setError(null);
        setTranscript('');

        // Set recording state early
        isRecordingRef.current = true;
        setIsRecording(true);

        // Initialize transcriber and wait for it to be ready
        console.log('Initializing transcriber...');
        await initializeTranscriber();
        
        if (!transcriberRef.current || !isInitializedRef.current) {
          isRecordingRef.current = false;
          setIsRecording(false);
          throw new Error('Transcriber initialization failed');
        }

        console.log('Requesting microphone access...');
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: 16000,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
          }
        });
        console.log('Microphone access granted');
        mediaStreamRef.current = stream;

        console.log('Creating audio context...');
        const audioContext = new AudioContext({ 
          sampleRate: 16000,
          latencyHint: 'interactive'
        });
        audioContextRef.current = audioContext;
        console.log('Audio context created with sample rate:', audioContext.sampleRate);

        try {
          // Load and register the audio worklet
          console.log('Loading audio worklet...');
          await audioContext.audioWorklet.addModule('/audio-processor.js');
          console.log('Audio worklet loaded successfully');
        } catch (error) {
          console.error('Failed to load audio worklet:', error);
          stopRecording();
          throw error;
        }
        
        // Create audio source
        const source = audioContext.createMediaStreamSource(stream);
        console.log('Audio source created');
        
        // Create audio worklet node
        console.log('Creating audio worklet node...');
        const workletNode = new AudioWorkletNode(audioContext, 'audio-processor', {
          numberOfInputs: 1,
          numberOfOutputs: 1,
          channelCount: 1,
          processorOptions: {
            sampleRate: audioContext.sampleRate
          }
        });
        console.log('Audio worklet node created');

        // Handle audio data from the worklet
        workletNode.port.onmessage = (event) => {
          const { type, data, bufferInfo } = event.data;
          
          if (type === 'debug') {
            console.log('Worklet debug:', event.data);
            return;
          }
          
          if (type === 'audio') {
            console.log('Received audio data from worklet:', {
              type,
              dataLength: data?.length,
              bufferInfo
            });
            
            // Data is already Int16Array from the worklet
            handleAudioData(data, bufferInfo);
          }
        };

        // Handle worklet errors
        workletNode.onprocessorerror = (error) => {
          console.error('Audio worklet processing error:', error);
        };

        // Connect the audio nodes
        console.log('Connecting audio nodes...');
        source.connect(workletNode);
        workletNode.connect(audioContext.destination);
        
        console.log('Audio processing setup complete');
      }
    } catch (err) {
      console.error('Error in toggleRecording:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      stopRecording();
      setIsInitialized(false);
    }
  };

  const handleAudioData = async (audioData: Int16Array, bufferInfo: any) => {
    if (!transcriberRef.current || !isInitializedRef.current || !isRecordingRef.current) {
      console.log('Skipping audio processing - not ready', {
        hasTranscriber: !!transcriberRef.current,
        isInitialized: isInitializedRef.current,
        isRecording: isRecordingRef.current
      });
      return;
    }

    try {
      // Log audio stats
      console.log('Processing audio data:', {
        format: '16-bit PCM',
        sampleRate: bufferInfo.sampleRate || 16000,
        duration: bufferInfo.duration,
        samples: audioData.length,
        maxValue: Math.max(...Array.from(audioData).map(Math.abs)),
        bufferInfo
      });

      // Send raw buffer to AssemblyAI
      await transcriberRef.current.sendAudio(audioData.buffer);
      
      console.log('Sent audio data to AssemblyAI:', {
        byteLength: audioData.byteLength,
        duration: bufferInfo.duration,
        maxValue: bufferInfo.maxPcmValue
      });
    } catch (error) {
      console.error('Error processing audio data:', error);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      if (transcriberRef.current) {
        transcriberRef.current.close();
      }
    };
  }, [stopRecording]);

  return {
    transcript,
    isRecording,
    toggleRecording,
    error,
    isInitialized,
    browserSupportsSpeechRecognition: typeof window !== 'undefined' && 
      'mediaDevices' in navigator && 
      'getUserMedia' in navigator.mediaDevices
  };
};
