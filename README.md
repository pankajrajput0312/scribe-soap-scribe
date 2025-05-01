# Auto SOAP Generator

A web application that transcribes audio recordings and automatically generates SOAP (Subjective, Objective, Assessment, Plan) reports for healthcare professionals.

## Table of Contents
- [Demo](#demo)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [Technology Stack](#technology-stack)
- [API Referene](#api-reference)
- [Contributing](#contributing)

## Demo

Visit the deployed application: [asha-health.lovable.app](https://asha-health.lovable.app/)

## Features

- Real-time audio recording and transcription
- Automatic generation of structured SOAP reports from transcriptions
- User-friendly interface for healthcare professionals
- Fast and accurate processing

## Prerequisites

Before installing the application, ensure you have the following installed on your system:

- Node.js (v14 or later)
- npm (v6 or later)

## Installation

### Option 1: Use the Deployed Version

Simply visit [asha-health.lovable.app](https://asha-health.lovable.app/) to use the application without any installation.

### Option 2: Local Installation

1. Clone the repository:
   ```bash
   git clone [repository-url]
   cd scribe-soap
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:8080/
   ```

## Usage

1. **Start Recording**:
   - Click the "Start Recording" button
   - Speak clearly into your microphone
   - The real-time transcription will appear in the text block

2. **End Recording**:
   - Click the "Stop Recording" button when you've finished speaking

3. **Generate SOAP Report**:
   - Click the "Generate SOAP Report" button
   - The application will process your transcription and generate a structured SOAP report
   - Review the generated report in the designated area

## Technology Stack

### Backend
- **Node.js** with **TypeScript** - Server-side runtime and language
- **Zod** - Schema validation library

### Frontend
- **React** with **Vite.js** - UI framework and build tool

### Services
- **AssemblyAI** - Streaming audio transcription service
- **OpenAI GPT-3.5 Turbo** - Natural language processing for SOAP report generation

## Architecture Flow

```mermaid
graph TD
    A[Browser UI] -->|WebSocket Audio Stream| B(AssemblyAI)
    B -->|Real-time Transcript| A
    A -->|HTTP POST Transcript| C[Node.js Backend]
    C -->|API Call| D[OpenAI GPT-3.5]
    C -->|Validation| E[Zod Schemas]
    D -->|SOAP Note| C
    E -->|Validated Data| C
    C -->|JSON Response| A
```

## API Reference

The backend is deployed at: **https://automationapi.getmentore.com/**

### API Endpoints

#### Generate SOAP Report
```
POST https://automationapi.getmentore.com/soap-report/generate
```
This endpoint processes the transcription and generates a structured SOAP report using OpenAI's GPT-3.5 Turbo.

#### Generate AssemblyAI Token
```
GET https://automationapi.getmentore.com/soap-report/token
```
This endpoint generates a token for authenticating with the AssemblyAI service for audio transcription.

### API Documentation
For detailed API documentation, visit:
```
https://automationapi.getmentore.com/rapidoc#post-/soap-report/generate
```


## Code References

The majority of the backend code is written in the following file:
```
https://github.com/pankajrajput0312/automation-backend/blob/main/src/controllers/soap-report.ts
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.


