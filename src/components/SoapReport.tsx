import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { soapReportService } from "@/services/soapReport";

interface SoapReportProps {
  transcript: string;
  soapReport: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  } | null;
  setSoapReport: (report: SoapReportProps['soapReport']) => void;
}

const SoapReport: React.FC<SoapReportProps> = ({
  transcript,
  soapReport,
  setSoapReport,
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateReport = async () => {
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
      const response = await soapReportService.generateSoapReport(transcript);
      if (response.success) {
        setSoapReport(response.data);
        toast({
          title: "SOAP Report Generated",
          description: "Your report has been successfully created.",
        });
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate SOAP report",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!transcript) {
    return null;
  }

  if (!soapReport) {
    return (
      <div className="w-full mt-6 text-center">
        <Button 
          onClick={handleGenerateReport} 
          className="bg-primary hover:bg-primary/90"
          disabled={isLoading}
        >
          {isLoading ? "Generating..." : "Generate SOAP Report"}
        </Button>
      </div>
    );
  }

  return (
    <Card className="w-full mt-6">
      <CardHeader>
        <CardTitle className="text-primary">SOAP Report</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium text-gray-700">S: Subjective</h3>
            <p className="text-gray-600 whitespace-pre-wrap">{soapReport.subjective}</p>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-700">O: Objective</h3>
            <p className="text-gray-600 whitespace-pre-wrap">{soapReport.objective}</p>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-700">A: Assessment</h3>
            <p className="text-gray-600 whitespace-pre-wrap">{soapReport.assessment}</p>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-700">P: Plan</h3>
            <p className="text-gray-600 whitespace-pre-wrap">{soapReport.plan}</p>
          </div>
        </div>
        <div className="flex justify-end">
          <Button 
            onClick={handleGenerateReport} 
            variant="outline" 
            className="text-primary border-primary hover:bg-primary/10"
            disabled={isLoading}
          >
            {isLoading ? "Regenerating..." : "Regenerate Report"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SoapReport;
