/// <reference types="vite/client" />

interface ImportMetaEnv {
  // AWS Configuration (Supabase fully migrated)
  readonly VITE_AWS_REGION: string;
  readonly VITE_COGNITO_USER_POOL_ID: string;
  readonly VITE_COGNITO_USER_POOL_CLIENT_ID: string;
  readonly VITE_FRONTEND_BASE_URL: string;
  readonly VITE_METRICS_ENDPOINT?: string;
  readonly VITE_ENABLE_METRICS?: string;
  readonly VITE_METRICS_SAMPLE_RATE?: string;
  readonly VITE_APP_VERSION?: string;
  readonly DEV: boolean;
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
