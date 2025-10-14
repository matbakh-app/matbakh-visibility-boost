import { rdsClient } from '@/services/aws-rds-client';

/**
 * Get a boolean feature flag value from the database
 * @param key - The feature flag key
 * @param fallback - Default value if flag doesn't exist or error occurs
 * @returns Promise<boolean>
 */
export async function getFlagBool(key: string, fallback = false): Promise<boolean> {
  try {
    const data = await rdsClient.queryOne(
      'SELECT enabled, value FROM feature_flags WHERE flag_name = $1',
      [key]
    );
    
    if (!data) {
      console.warn(`Feature flag not found: ${key}`);
      return fallback;
    }
    
    // If flag is disabled, return false regardless of value
    if (!data.enabled) {
      return false;
    }
    
    // Parse the value
    const v = (data.value ?? '').toString().trim().toLowerCase();
    
    // Handle explicit boolean strings
    if (['true', '1', 'yes', 'on'].includes(v)) return true;
    if (['false', '0', 'no', 'off', ''].includes(v)) return false;
    
    // Handle numeric values
    const n = Number(v);
    if (!Number.isNaN(n)) return n !== 0;
    
    return fallback;
  } catch (error) {
    console.warn(`Feature flag exception for ${key}:`, error);
    return fallback;
  }
}

/**
 * Get a string feature flag value from the database
 * @param key - The feature flag key
 * @param fallback - Default value if flag doesn't exist or error occurs
 * @returns Promise<string>
 */
export async function getFlagString(key: string, fallback = ''): Promise<string> {
  try {
    const data = await rdsClient.queryOne(
      'SELECT enabled, value FROM feature_flags WHERE flag_name = $1',
      [key]
    );
    
    if (!data || !data.enabled) {
      return fallback;
    }
    
    return (data.value ?? '').toString();
  } catch {
    return fallback;
  }
}

/**
 * Get a numeric feature flag value from the database
 * @param key - The feature flag key
 * @param fallback - Default value if flag doesn't exist or error occurs
 * @returns Promise<number>
 */
export async function getFlagNumber(key: string, fallback = 0): Promise<number> {
  try {
    const data = await rdsClient.queryOne(
      'SELECT enabled, value FROM feature_flags WHERE flag_name = $1',
      [key]
    );
    
    if (!data || !data.enabled) {
      return fallback;
    }
    
    const n = Number(data.value);
    return Number.isNaN(n) ? fallback : n;
  } catch {
    return fallback;
  }
}