import React from "react";
import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RecordingButtonProps {
  isRecording: boolean;
  onToggleRecording: () => void;
  disabled?: boolean;
}

const RecordingButton: React.FC<RecordingButtonProps> = ({
  isRecording,
  onToggleRecording,
  disabled = false,
}) => {
  return (
    <Button
      onClick={onToggleRecording}
      size="lg"
      disabled={disabled}
      className={cn(
        "flex items-center justify-center gap-2 text-white px-6 py-6 h-auto rounded-full transition-all",
        isRecording
          ? "bg-red-500 hover:bg-red-600 recording-pulse"
          : "bg-primary hover:bg-primary/90",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      aria-label={isRecording ? "Stop recording" : "Start recording"}
    >
      {isRecording ? (
        <>
          <MicOff className="h-6 w-6" /> Stop Recording
        </>
      ) : (
        <>
          <Mic className="h-6 w-6" /> {disabled ? "Initializing..." : "Start Recording"}
        </>
      )}
    </Button>
  );
};

export default RecordingButton;
