import React from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { Button } from './ui/button';

export const SpeechRecorder: React.FC = () => {
  const {
    transcript,
    isRecording,
    toggleRecording,
    error,
    isInitialized
  } = useSpeechRecognition();

  return (
    <div className="p-4">
      <div className="mb-4">
        <Button 
          onClick={toggleRecording}
          variant={isRecording ? "destructive" : "default"}
          className="min-w-[120px]"
        >
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </Button>
        
        {error && (
          <div className="text-red-500 mt-2">
            Error: {error}
          </div>
        )}
        
        {isInitialized && (
          <div className="text-green-500 mt-2">
            {isRecording ? 'Recording...' : 'Ready to record'}
          </div>
        )}
      </div>

      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2">Transcript:</h3>
        <div className="p-4 bg-gray-100 rounded min-h-[100px] whitespace-pre-wrap">
          {transcript || 'No transcript yet...'}
        </div>
      </div>
    </div>
  );
}; 