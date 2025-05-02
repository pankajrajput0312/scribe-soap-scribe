import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

interface SourceRange {
  start: number;
  end: number;
}

interface Source {
  speaker: string;
  quote?: string;
  finding?: string;
  reasoning?: string;
  action?: string;
  range: SourceRange;
}

interface SectionData {
  content: string;
  sources: Source[];
}

interface SoapReportData {
  subjective: SectionData;
  objective: SectionData;
  assessment: SectionData;
  plan: SectionData;
}

interface SoapReportProps {
  transcript: string;
  soapReport: SoapReportData | null;
  setSoapReport: (report: SoapReportData | null) => void;
}

const SoapReport: React.FC<SoapReportProps> = ({
  transcript,
  soapReport,
  setSoapReport,
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const generateReport = async () => {
    if (!transcript.trim()) {
      toast({
        title: "No transcription available",
        description: "Please record some audio before generating a SOAP report.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3000/soap-report/generate-enhanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: transcript }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate report');
      }

      setSoapReport(data.data);
      toast({
        title: "SOAP Report Generated",
        description: "Your enhanced report has been successfully created.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate report",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sectionColors = {
    subjective: 'bg-blue-50 hover:bg-blue-100',
    objective: 'bg-green-50 hover:bg-green-100',
    assessment: 'bg-yellow-50 hover:bg-yellow-100',
    plan: 'bg-pink-50 hover:bg-pink-100',
  };

  const renderSection = (title: string, section: SectionData | undefined, type: keyof typeof sectionColors) => {
    if (!section) return null;

    return (
      <div className={`p-4 rounded-lg mb-4 ${sectionColors[type]}`}>
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
        <div className="space-y-4">
          {/* Main content */}
          <div className="border-b pb-2">
            <p className="text-base font-medium">{section.content}</p>
          </div>
          
          {/* Sources */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-600">Supporting Evidence:</h4>
            {section.sources.map((source, idx) => (
              <div
                key={idx}
                className="p-2 rounded hover:bg-white/50 transition-colors"
              >
                <p className="text-sm">
                  {source.quote || source.finding || source.reasoning || source.action}
                </p>
                <p className="text-xs text-gray-500 mt-1">- {source.speaker}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full mt-4">
      <CardHeader className="flex flex-row items-center justify-between space-x-4">
        <CardTitle className="text-primary">SOAP Report</CardTitle>
        <Button
          onClick={generateReport}
          disabled={isLoading || !transcript.trim()}
        >
          {isLoading ? "Generating..." : "Generate Report"}
        </Button>
      </CardHeader>
      <CardContent>
        {soapReport ? (
          <div className="space-y-4">
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Original Transcript</h3>
              <p className="text-sm whitespace-pre-wrap text-gray-900">
                {transcript}
              </p>
            </div>
            {renderSection('Subjective', soapReport.subjective, 'subjective')}
            {renderSection('Objective', soapReport.objective, 'objective')}
            {renderSection('Assessment', soapReport.assessment, 'assessment')}
            {renderSection('Plan', soapReport.plan, 'plan')}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            Click "Generate Report" to create a SOAP report from your transcription
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SoapReport;
