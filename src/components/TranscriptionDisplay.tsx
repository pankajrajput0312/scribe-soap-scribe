import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusCircle, X } from "lucide-react";

interface TranscriptionSegment {
  text: string;
  isFinal: boolean;
  id: string;
}

interface SpeakerSegment {
  speaker: string;
  text: string;
}

interface TranscriptionDisplayProps {
  transcript: string;
  transcriptSegments: TranscriptionSegment[];
  isRecording: boolean;
  isInitialized: boolean;
  isInitializing: boolean;
  enhancedTranscript: SpeakerSegment[];
  selectedSpeakers: string[];
  setSelectedSpeakers: (speakers: string[]) => void;
}

const AVAILABLE_SPEAKERS = [
  'Doctor',
  'Patient',
  'Nurse',
  'Family Member',
  'Other'
];

const TranscriptionDisplay: React.FC<TranscriptionDisplayProps> = ({
  transcript,
  transcriptSegments,
  isRecording,
  isInitialized,
  isInitializing,
  enhancedTranscript,
  selectedSpeakers,
  setSelectedSpeakers,
}) => {
  const getStatusMessage = () => {
    if (isInitializing) return "Initializing...";
    if (isRecording) return "Recording...";
    if (isInitialized) return "Ready to record";
    return "Click 'Start Recording' to begin";
  };

  const handleAddSpeaker = (speaker: string) => {
    if (!selectedSpeakers.includes(speaker)) {
      setSelectedSpeakers([...selectedSpeakers, speaker]);
    }
  };

  const handleRemoveSpeaker = (speaker: string) => {
    if (speaker !== 'Doctor' && speaker !== 'Patient') {
      setSelectedSpeakers(selectedSpeakers.filter(s => s !== speaker));
    }
  };

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
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2">Speakers</h3>
          <div className="flex flex-wrap gap-2 mb-2">
            {selectedSpeakers.map(speaker => (
              <Badge key={speaker} variant="secondary" className="text-sm">
                {speaker}
                {speaker !== 'Doctor' && speaker !== 'Patient' && (
                  <button
                    onClick={() => handleRemoveSpeaker(speaker)}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Select
              onValueChange={handleAddSpeaker}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Add speaker" />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_SPEAKERS.filter(speaker => !selectedSpeakers.includes(speaker)).map(speaker => (
                  <SelectItem key={speaker} value={speaker}>
                    {speaker}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="raw" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="raw">Raw Transcript</TabsTrigger>
            <TabsTrigger value="enhanced">Speaker Identified Transcript</TabsTrigger>
          </TabsList>
          
          <TabsContent value="raw">
            <ScrollArea className="h-[300px] w-full rounded-md border p-4">
              <div className="whitespace-pre-wrap text-gray-700 relative">
                {visibleSegments.length === 0 ? (
                  <div className="text-center text-gray-500 py-4">
                    Recorded transcription will be visible here. Click on Start Recording to begin.
                  </div>
                ) : (
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
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="enhanced">
            <ScrollArea className="h-[300px] w-full rounded-md border p-4">
              <div className="space-y-4">
                {enhancedTranscript.length > 0 ? (
                  enhancedTranscript.map((segment, idx) => (
                    <div key={idx} className="flex gap-2">
                      <span className="font-medium text-primary whitespace-nowrap">
                        {segment.speaker}:
                      </span>
                      <span className="text-gray-700">
                        {segment.text}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500 text-center py-4">
                    {isRecording ? (
                      "Speaker identified transcript will be generated once you click on stop recording button"
                    ) : (
                      "No speaker identified transcript available yet"
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TranscriptionDisplay;
