import axios from 'axios';

interface SoapReportResponse {
  success: boolean;
  data: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  };
  message: string;
}

// export const generateSoapReport = async (text: string): Promise<SoapReportResponse> => {
//   try {
//     const response = await axios.post<SoapReportResponse>(
//       'https://automationapi.getmentore.com/soap-report/generate',
//       { text }
//     );
//     return response.data;
//   } catch (error) {
//     if (axios.isAxiosError(error)) {
//       throw new Error(error.response?.data?.message || 'Failed to generate SOAP report');
//     }
//     throw new Error('An unexpected error occurred');
//   }
// }; 

  
export const soapReportService = {
  
    generateSoapReport: async (text: string): Promise<SoapReportResponse> => {
        try {
          // Clean and format the text
          const formattedText = text
            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
            .replace(/\n+/g, '. ') // Replace newlines with periods
            .replace(/\.+/g, '.') // Replace multiple periods with single period
            .trim();

          const response = await fetch('http://localhost:3000/soap-report/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: formattedText })
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          
          // Validate the response structure
          if (!data.success || !data.data) {
            throw new Error(data.message || 'Invalid response format');
          }

          return data;
        } catch (error) {
          if (error instanceof Error) {
            throw new Error(error.message);
          }
          throw new Error('An unexpected error occurred');
        }
      },
  
  }; 