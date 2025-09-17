/**
 * 🚫 Supabase ist abgeschaltet.
 * Dieser Stub sorgt dafür, dass alle verbleibenden Aufrufe sofort auffallen.
 * Bitte stattdessen AWS-Services verwenden (RDS-Client, Lambda, Cognito, etc.).
 */

export const SUPABASE_URL = '';
export const FUNCTIONS_URL = '';

export const supabase: any = new Proxy({}, {
  get(_t, prop) {
    throw new Error(`[Supabase removed] Attempted to access supabase.${String(prop)}. Migrate this code to AWS services.`);
  },
  apply() {
    throw new Error('[Supabase removed] Attempted to call supabase as a function. Migrate this code to AWS services.');
  }
});

export default supabase;