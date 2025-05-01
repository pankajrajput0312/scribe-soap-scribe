import React, { useState } from 'react';
import { useToast } from "@/components/ui/use-toast";
import RecordingButton from '@/components/RecordingButton';
import TranscriptionDisplay from '@/components/TranscriptionDisplay';
import SoapReport from '@/components/SoapReport';
import {useSpeechRecognition} from '@/hooks/useSpeechRecognition';

const Index = () => {
  const { toast } = useToast();
  const {
    transcript,
    isRecording,
    toggleRecording,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();
  
  const [soapReport, setSoapReport] = useState<{
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  } | null>(null);

  React.useEffect(() => {
    if (!browserSupportsSpeechRecognition) {
      toast({
        title: "Browser Compatibility Issue",
        description: "Your browser doesn't support speech recognition. Please use Chrome, Edge, or Safari.",
        variant: "destructive",
      });
    }
  }, [browserSupportsSpeechRecognition, toast]);

  const generateSoapReport = () => {
    if (!transcript.trim()) {
      toast({
        title: "No transcription available",
        description: "Please record some audio before generating a SOAP report.",
        variant: "destructive",
      });
      return;
    }

    // Split transcript into lines
    const lines = transcript.split(/\.\s+|\n+/).filter(line => line.trim().length > 0);
    
    let report = {
      subjective: '',
      objective: '',
      assessment: '',
      plan: '',
    };

    if (lines.length >= 1) {
      report.subjective = lines.slice(0, Math.min(2, lines.length)).join('. ');
    }
    
    if (lines.length >= 3) {
      report.objective = lines.slice(2, Math.min(4, lines.length)).join('. ');
    }
    
    if (lines.length >= 5) {
      report.assessment = lines[4];
    }
    
    if (lines.length >= 6) {
      report.plan = lines.slice(5).join('. ');
    }
    
    setSoapReport(report);
    
    toast({
      title: "SOAP Report Generated",
      description: "Your report has been successfully created.",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 md:p-8">
      <header className="w-full max-w-3xl text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-primary">
          Patient Meeting Transcriber
        </h1>
        <p className="text-gray-600 mt-2">
          Record patient conversations and generate SOAP reports
        </p>
      </header>

      <main className="w-full max-w-3xl flex flex-col items-center space-y-8">
        <div className="flex justify-center w-full">
          <RecordingButton 
            isRecording={isRecording} 
            onToggleRecording={toggleRecording} 
          />
        </div>

        <TranscriptionDisplay 
          transcript={transcript} 
          isRecording={isRecording} 
        />

        <SoapReport 
          transcript={transcript}
          soapReport={soapReport}
          setSoapReport={setSoapReport}
        />
      </main>

      <footer className="mt-auto pt-8 text-center text-gray-500 text-sm">
        <p>© 2025 Patient Meeting Transcriber</p>
      </footer>
    </div>
  );
};

export default Index;
