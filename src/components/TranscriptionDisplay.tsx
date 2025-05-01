
import React from "react";

interface TranscriptionDisplayProps {
  transcript: string;
  isRecording: boolean;
}

const TranscriptionDisplay: React.FC<TranscriptionDisplayProps> = ({
  transcript,
  isRecording,
}) => {
  return (
    <div className="w-full bg-white rounded-lg shadow-md p-4 min-h-[200px] max-h-[400px] overflow-y-auto border border-gray-200">
      <h2 className="text-lg font-medium mb-2 text-gray-700 flex items-center">
        Transcription
        {isRecording && (
          <span className="ml-2 h-2 w-2 bg-red-500 rounded-full inline-block recording-pulse"></span>
        )}
      </h2>
      <div className="text-gray-700 whitespace-pre-wrap">
        {transcript || (
          <span className="text-gray-400 italic">
            {isRecording
              ? "Listening... Start speaking"
              : "Click 'Start Recording' to begin transcription"}
          </span>
        )}
      </div>
    </div>
  );
};

export default TranscriptionDisplay;
