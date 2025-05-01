import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TranscriptionDisplayProps {
  transcript: string;
  isRecording: boolean;
}

const TranscriptionDisplay: React.FC<TranscriptionDisplayProps> = ({
  transcript,
  isRecording,
}) => {
  if (!transcript) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-primary">Transcription</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] w-full rounded-md border p-4">
          <div className="whitespace-pre-wrap text-gray-700">
            {transcript}
            {isRecording && (
              <span className="animate-pulse text-primary">...</span>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default TranscriptionDisplay;
