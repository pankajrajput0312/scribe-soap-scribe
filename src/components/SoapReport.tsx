
import React from "react";
import { Button } from "@/components/ui/button";

interface SoapReportProps {
  transcript: string;
  onGenerateReport: () => void;
  soapReport: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  } | null;
}

const SoapReport: React.FC<SoapReportProps> = ({
  transcript,
  onGenerateReport,
  soapReport,
}) => {
  if (!transcript) {
    return null;
  }

  if (!soapReport) {
    return (
      <div className="w-full mt-6 text-center">
        <Button onClick={onGenerateReport} className="bg-primary hover:bg-primary/90">
          Generate SOAP Report
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full mt-6 bg-white rounded-lg shadow-md p-4 border border-gray-200">
      <h2 className="text-xl font-semibold mb-4 text-primary">SOAP Report</h2>
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
      <div className="mt-4 text-right">
        <Button onClick={onGenerateReport} variant="outline" className="text-primary border-primary hover:bg-primary/10">
          Regenerate Report
        </Button>
      </div>
    </div>
  );
};

export default SoapReport;
