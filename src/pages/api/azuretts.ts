import { Buffer } from 'node:buffer';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { buildError, getAzure } from '@/utils';
import { fetchToken } from '@/utils/ttsutil';

export const runtime = 'edge';

export async function fetchAudio(token: string, SSML: string): Promise<any> {
  const res = await fetch(getAzure().COGNITIVE_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/ssml+xml',
      'X-MICROSOFT-OutputFormat': 'audio-16khz-32kbitrate-mono-mp3',
    },
    body: SSML,
  });

  return res;
}

// export default async function handler(req: NextRequest) {
//     try {
//         const token = await fetchToken();

//         const data = await req.text();

//         const audioResponse = await fetchAudio(token, data);

//         if (!audioResponse.ok) {
//             return NextResponse.json(
//                 { error: 'Error fetching audio. Error code: ' + audioResponse.status },
//                 { status: audioResponse.status }
//             );
//         }

//         const arrayBuffer = await audioResponse.arrayBuffer();
//         const base64Audio = Buffer.from(arrayBuffer).toString('base64');
//         return NextResponse.json({ base64Audio });
//     } catch (error) {
//         console.error('Error in audio POST handler:', error);
//         return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
//     }
// }

export async function handler(req: NextRequest) {
  try {
    const token = await fetchToken();

    const data = await req.json();
    const ssml = data.message;
    console.log(ssml);
    const audioResponse = await fetchAudio(token, ssml);

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
