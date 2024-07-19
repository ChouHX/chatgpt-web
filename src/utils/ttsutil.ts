import { getAzure } from '@/utils';

const env = getAzure();
let cachedToken: string | null = null;
let tokenExpiration: Date | null = null;

export interface Config {
  voiceName: string;
  rate: number;
}

export function saveAs(blob: Blob, name: string) {
  const a = document.createElement('a');
  document.body.appendChild(a);
  a.setAttribute('style', 'display: none');
  const url = window.URL.createObjectURL(blob);
  a.href = url;
  a.download = name;
  a.click();
  window.URL.revokeObjectURL(url);
}

export function base64AudioToBlobUrl(base64Audio: string) {
  const binaryString = atob(base64Audio);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const blob = new Blob([bytes], { type: 'audio/mp3' });
  return URL.createObjectURL(blob);
}

export function generateSSML(message: string, voiceName: string, rate: number): string {
  const SSML = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="zh-CN">
        <voice name="${voiceName}">
            <mstts:express-as styleDegree="1">
                <prosody volume="0%" rate="${rate}" pitch="0%">
                    ${message}
                </prosody>
            </mstts:express-as>
        </voice>
    </speak>`;
  return SSML;
}

export async function fetchToken(): Promise<string> {
  if (!cachedToken || !tokenExpiration || tokenExpiration <= new Date()) {
    const res = await fetch(env.TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': env.KEY!,
      },
    });

    if (!res.ok) {
      throw new Error(`Error fetching token. Error code: ${res.status}`);
    }

    cachedToken = await res.text();
    tokenExpiration = new Date(new Date().getTime() + 20 * 1000); // 20s
  }

  return cachedToken;
}
