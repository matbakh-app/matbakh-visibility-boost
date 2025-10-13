/**
 * Safe environment variable access for Vite/Jest compatibility
 */
export function viteEnv<T = any>(key: string, fallback?: T): T | undefined {
  try {
    // Try import.meta.env first (Vite)
    if (typeof window !== 'undefined' && (window as any).import?.meta?.env) {
      return (window as any).import.meta.env[key] ?? fallback;
    }
    
    // Try global import.meta.env (Jest mock)
    if (typeof globalThis !== 'undefined' && (globalThis as any).import?.meta?.env) {
      return (globalThis as any).import.meta.env[key] ?? fallback;
    }
    
    // Fallback to process.env
    return (process.env[key] as T) ?? fallback;
  } catch {
    return fallback;
  }
}