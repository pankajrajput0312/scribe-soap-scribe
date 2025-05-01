import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";

interface TranscriptionSegment {
  text: string;
  isFinal: boolean;
  id: string;
}

interface TranscriptionDisplayProps {
  transcript: string;
  transcriptSegments: TranscriptionSegment[];
  isRecording: boolean;
  isInitialized: boolean;
  isInitializing: boolean;
}

const TranscriptionDisplay: React.FC<TranscriptionDisplayProps> = ({
  transcript,
  transcriptSegments,
  isRecording,
  isInitialized,
  isInitializing,
}) => {
  const getStatusMessage = () => {
    if (isInitializing) return "Initializing...";
    if (isRecording) return "Recording...";
    if (isInitialized) return "Ready to record";
    return "Click 'Start Recording' to begin";
  };

  // Only show final segments and the latest interim segment
  const visibleSegments = React.useMemo(() => {
    const finalSegments = transcriptSegments.filter(s => s.isFinal);
    const latestInterim = transcriptSegments
      .filter(s => !s.isFinal)
      .pop();

    return latestInterim 
      ? [...finalSegments, latestInterim]
      : finalSegments;
  }, [transcriptSegments]);

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-x-4">
        <CardTitle className="text-primary">Transcription</CardTitle>
        <div 
          className={`text-sm ${
            isInitializing 
              ? 'text-yellow-500' 
              : isRecording 
                ? 'text-red-500' 
                : 'text-green-500'
          }`}
        >
          {getStatusMessage()}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] w-full rounded-md border p-4">
          <div className="whitespace-pre-wrap text-gray-700 relative">
            <AnimatePresence mode="popLayout">
              {visibleSegments.map((segment, index) => (
                <motion.span
                  key={segment.id}
                  initial={{ opacity: 0 }}
                  animate={{ 
                    opacity: segment.isFinal ? 1 : 0.6,
                    y: 0 
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ 
                    duration: segment.isFinal ? 0.3 : 0.15,
                    ease: "easeOut"
                  }}
                  className={`inline ${
                    segment.isFinal 
                      ? 'text-gray-900 font-normal' 
                      : 'text-gray-700 font-light'
                  }`}
                >
                  {index > 0 ? ' ' : ''}{segment.text}
                </motion.span>
              ))}
              {isRecording && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ 
                    repeat: Infinity,
                    duration: 1.5
                  }}
                  className="inline-block ml-1 text-primary"
                >
                  ●
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default TranscriptionDisplay;
