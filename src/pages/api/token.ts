import { AssemblyAI } from 'assemblyai';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ASSEMBLYAI_API_KEY || 'e8b8dacf2af741298f4482fa14d6fe3d';

  if (!apiKey) {
    console.error('AssemblyAI API key is not configured');
    return res.status(500).json({ error: 'API key configuration error' });
  }

  try {
    const client = new AssemblyAI({
      apiKey: apiKey,
    });

    const token = await client.realtime.createTemporaryToken({ expires_in: 480 });
    console.log('Token generated successfully');
    res.status(200).json({ token });
  } catch (error) {
    console.error('Error generating token:', error);
    res.status(500).json({ 
      error: 'Failed to generate token',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 