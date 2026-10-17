
interface ImportMetaEnv {
  readonly VITE_NEON_DATABASE_URL: string;
  readonly VITE_GEMINI_API_KEY: string;
  readonly VITE_ADMIN_ID: string;
  readonly VITE_ADMIN_PASSWORD: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
