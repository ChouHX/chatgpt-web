import { Buffer } from 'node:buffer';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { buildError, getEnv } from '@/utils';

export const runtime = 'edge';

export async function fetchAudio(message: string, voice: string): Promise<any> {
  const env = getEnv();
  const res = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tts-1-hd',
      input: message,
      voice,
    }),
  });

  return res;
}

export async function handler(req: NextRequest) {
  try {
    const data = await req.json();
    const audioResponse = await fetchAudio(data.message, data.voice);

    if (!audioResponse.ok) {
      return buildError(
        {
          message: 'Error fetching audio.',
          code: audioResponse.status,
        },
        audioResponse.status,
      );
    }

    const arrayBuffer = await audioResponse.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString('base64');
    return NextResponse.json(
      { message: base64Audio },
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
  }
  catch (error) {
    console.error('Error in audio POST handler:', error);
    return buildError(
      {
        message: 'Internal Server Error.',
        code: '500',
      },
      500,
    );
  }
}

export default handler;
