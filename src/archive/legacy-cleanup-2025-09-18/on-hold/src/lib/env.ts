/**
 * Safe environment variable access for Vite/Jest compatibility
 */
export function viteEnv<T = any>(key: string, fallback?: T): T | undefined {
  try {
    // @ts-ignore - in Vite vorhanden, in Jest meist nicht
    return (typeof import.meta !== 'undefined' ? (import.meta as any).env?.[key] : undefined) ?? fallback;
  } catch {
    return fallback;
  }
}