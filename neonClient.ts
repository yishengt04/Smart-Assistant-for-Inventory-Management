import { neon } from 'https://esm.sh/@neondatabase/serverless@0.10.4';

/* Paste Neon URL */
const DB_URL: string = ''; 

/* Gets the database URL from hardcoded variable, environment, or localStorage. */
export const getDatabaseUrl = () => {
  // 1. Highest Priority: The hardcoded variable above
  if (DB_URL && DB_URL.trim() !== "") {
    return DB_URL.trim();
  }

  try {
    // 2. Safe check for Vite-style environment variables
    const meta = import.meta as any;
    if (meta && meta.env && meta.env.VITE_NEON_DATABASE_URL) {
      return meta.env.VITE_NEON_DATABASE_URL;
    }

    // 3. Safe check for Node-style environment variables
    if (typeof process !== 'undefined' && process.env) {
      const procEnv = (process.env as any).VITE_NEON_DATABASE_URL;
      if (procEnv) return procEnv;
    }
  } catch (e) {
    // Silently fail if environment access is restricted
  }

  // 4. Last Resort: Browser local storage (from the setup UI)
  return localStorage.getItem('NEON_DATABASE_URL');
};

/**
 * A proxy function for the Neon SQL client that resolves the connection string 
 * at execution time.
 */
export const sql = (strings: TemplateStringsArray, ...params: any[]): Promise<any[]> => {
  const url = getDatabaseUrl();
  
  if (!url) {
    const error = "No Database URL found. Please paste your URL into 'DB_URL' in neonClient.ts";
    console.warn(error);
    return Promise.reject(new Error(error));
  }
  
  try {
    const client = neon(url);
    return client(strings, ...params);
  } catch (e) {
    console.error("Neon Connection Error:", e);
    return Promise.reject(new Error("Failed to connect to Neon. Check your URL in neonClient.ts."));
  }
};