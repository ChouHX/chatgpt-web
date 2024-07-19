export const ENV_KEY = process.env.OPENAI_API_KEY;
const ENV_HOST = process.env.OPENAI_API_HOST || 'https://api.openai.com';
const ENV_MODEL = process.env.OPENAI_API_MODEL || 'gpt-3.5-turbo';
const SUBKEY = process.env.AZURE_SUBKEY;
const REGION = process.env.AZURE_ORIGIN;
export const ENV_ACCESS_CODE = process.env.ACCESS_CODE;

export function getEnv() {
  const key = ENV_ACCESS_CODE ? '' : ENV_KEY;

  return {
    HOST: ENV_HOST,
    TOKEN: process.env.OPENAI_ACCESS_TOKEN,
    KEY: key,
    MODEL: ENV_MODEL,
  };
}

export function IsKey() {
  return ENV_KEY?.length !== 0;
}
export function IsHost() {
  return ENV_HOST?.length !== 0;
}
export function IsAccesscode() {
  return ENV_ACCESS_CODE?.length !== 0;
}

export function getAzure() {
  const AZURE_TOKEN_ENDPOINT = `https://${REGION}.api.cognitive.microsoft.com/sts/v1.0/issuetoken`;
  const AZURE_COGNITIVE_ENDPOINT = `https://${REGION}.tts.speech.microsoft.com/cognitiveservices/v1`;
  return {
    KEY: SUBKEY,
    TOKEN_ENDPOINT: AZURE_TOKEN_ENDPOINT,
    COGNITIVE_ENDPOINT: AZURE_COGNITIVE_ENDPOINT,
  };
}

export interface ResponseError {
  code: string;
  message?: string;
}

export function buildError(error: ResponseError, status = 400) {
  return new Response(JSON.stringify({ error }), { status });
}

/**
 * @return [error，验证成功]
 */
export function checkAccessCode(code?: string | null): [Response | null, boolean] {
  const accessCode = ENV_ACCESS_CODE;
  if (accessCode) {
    if (code) {
      return accessCode === code ? [null, true] : [buildError({ code: 'Access Code Error' }, 401), false];
    }
    else {
      return [null, false];
    }
  }
  return [null, false];
}
