
// Fix: Removed the problematic triple-slash reference to 'vite/client' which was causing a 'Cannot find type definition file' error.
// The necessary ImportMeta and ImportMetaEnv interfaces are defined manually below to support environment variables in this environment.

interface ImportMetaEnv {
  readonly VITE_NEON_DATABASE_URL: string;
  readonly VITE_GEMINI_API_KEY: string;
  readonly VITE_ADMIN_ID: string;
  readonly VITE_ADMIN_PASSWORD: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
