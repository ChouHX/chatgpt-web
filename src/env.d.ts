declare global {
  namespace NodeJS {
    interface ProcessEnv {
      readonly OPENAI_API_KEY: string;
      readonly OPENAI_ACCESS_TOKEN: string;
      readonly OPENAI_API_HOST: string;
      readonly OPENAI_API_MODEL: string;

      readonly AZURE_SUBKEY: string;
      readonly AZURE_ORIGIN: string;

      readonly ACCESS_CODE: string;

      /** @deprecated */
      readonly PUBLIC_OPENAI_API_KEY: string;
      /** @deprecated */
      readonly PUBLIC_OPENAI_API_HOST: string;
      /** @deprecated */
      readonly PUBLIC_OPENAI_API_MODEL: string;
    }
  }
}
