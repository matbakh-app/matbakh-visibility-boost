/**
 * Generic useLocalStorage Hook
 * 
 * JTBD: "Store and retrieve typed data in localStorage with error handling and expiration"
 * 
 * This hook consolidates all localStorage patterns used throughout the app:
 * - useUIMode (UI_MODE_KEY)
 * - useLanguage (via i18n persistence)
 * - onboardingStorage (ONBOARDING_STORAGE_KEY)
 * 
 * @version 2.0.0
 * @since 2025-01-09
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Options for localStorage behavior
 */
export interface UseLocalStorageOptions {
  /** Expiration time in hours (optional) */
  expirationHours?: number;
  /** Serialize function (default: JSON.stringify) */
  serialize?: (value: any) => string;
  /** Deserialize function (default: JSON.parse) */
  deserialize?: (value: string) => any;
  /** Error handler for localStorage operations */
  onError?: (error: Error, operation: 'get' | 'set' | 'remove') => void;
}

/**
 * Storage data wrapper with metadata
 */
interface StorageData<T> {
  value: T;
  timestamp: string;
  version?: string;
  expirationHours?: number;
}

/**
 * Default error handler
 */
const defaultErrorHandler = (error: Error, operation: string) => {
  console.warn(`localStorage ${operation} failed:`, error);
};

/**
 * Generic localStorage hook with expiration and error handling
 * 
 * @param key - localStorage key
 * @param defaultValue - default value if nothing stored
 * @param options - configuration options
 * @returns [value, setValue, removeValue, isLoading]
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
  options: UseLocalStorageOptions = {}
): [T, (value: T | ((prev: T) => T)) => void, () => void, boolean] {
  const {
    expirationHours,
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    onError = defaultErrorHandler
  } = options;

  const [storedValue, setStoredValue] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize value from localStorage
  useEffect(() => {
    try {
      if (typeof window === 'undefined') {
        setIsLoading(false);
        return;
      }

      const item = localStorage.getItem(key);
      if (!item) {
        setStoredValue(defaultValue);
        setIsLoading(false);
        return;
      }

      const parsed: StorageData<T> = deserialize(item);
      
      // Check expiration if configured
      if (expirationHours || parsed.expirationHours) {
        const timestamp = new Date(parsed.timestamp);
        const now = new Date();
        const hoursDiff = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);
        const maxHours = expirationHours || parsed.expirationHours || 24;
        
        if (hoursDiff > maxHours) {
          localStorage.removeItem(key);
          setStoredValue(defaultValue);
          setIsLoading(false);
          return;
        }
      }

      // Handle legacy data (direct value without wrapper)
      const value = parsed.value !== undefined ? parsed.value : parsed as T;
      setStoredValue(value);
    } catch (error) {
      onError(error as Error, 'get');
      localStorage.removeItem(key); // Clean up corrupted data
      setStoredValue(defaultValue);
    } finally {
      setIsLoading(false);
    }
  }, [key, defaultValue, expirationHours, deserialize, onError]);

  // Set value in localStorage
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      const storageData: StorageData<T> = {
        value: valueToStore,
        timestamp: new Date().toISOString(),
        version: '2.0',
        ...(expirationHours && { expirationHours })
      };

      localStorage.setItem(key, serialize(storageData));
      setStoredValue(valueToStore);
    } catch (error) {
      onError(error as Error, 'set');
    }
  }, [key, storedValue, serialize, onError, expirationHours]);

  // Remove value from localStorage
  const removeValue = useCallback(() => {
    try {
      localStorage.removeItem(key);
      setStoredValue(defaultValue);
    } catch (error) {
      onError(error as Error, 'remove');
    }
  }, [key, defaultValue, onError]);

  return [storedValue, setValue, removeValue, isLoading];
}

/**
 * Specialized hook for UI mode with system preference detection
 */
export function useUIMode() {
  type UIMode = "standard" | "invisible" | "system";
  
  const [mode, setMode, removeMode] = useLocalStorage<UIMode>("matbakh_ui_mode", "system");
  const [effectiveMode, setEffectiveMode] = useState<UIMode>("standard");

  useEffect(() => {
    let effective: UIMode = "standard";
    
    if (mode === "system") {
      const preferReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const isMobile = window.matchMedia("(max-width: 768px)").matches;
      effective = (preferReduced || isMobile) ? "invisible" : "standard";
    } else {
      effective = mode;
    }
    
    setEffectiveMode(effective);
  }, [mode]);

  const setUIMode = useCallback((newMode: UIMode) => {
    setMode(newMode);
    
    // Fire analytics event
    try {
      window.dispatchEvent(new CustomEvent("analytics", { 
        detail: { 
          name: "ui_mode_changed", 
          from: mode, 
          to: newMode, 
          source: "settings" 
        } 
      }));
    } catch {}
  }, [mode, setMode]);

  return {
    mode,
    effectiveMode,
    setUIMode,
    removeMode,
    isInvisible: effectiveMode === "invisible",
    isStandard: effectiveMode === "standard",
  };
}

/**
 * Specialized hook for onboarding data with 24-hour expiration
 */
export function useOnboardingStorage() {
  interface OnboardingData {
    version: string;
    currentStep: number;
    answers: any;
  }

  const [data, setData, clearData] = useLocalStorage<OnboardingData | null>(
    "matbakh_onboarding_data",
    null,
    { expirationHours: 24 }
  );

  const saveOnboarding = useCallback((step: number, answers: any, version = '1.0') => {
    setData({
      version,
      currentStep: step,
      answers
    });
  }, [setData]);

  return {
    data,
    saveOnboarding,
    clearOnboarding: clearData,
    hasData: data !== null
  };
}

/**
 * Utility function to clear all expired localStorage data
 */
export const clearExpiredLocalStorage = () => {
  try {
    const keys = Object.keys(localStorage);
    
    for (const key of keys) {
      try {
        const item = localStorage.getItem(key);
        if (!item) continue;

        const parsed = JSON.parse(item);
        
        // Check if it's our storage format with expiration
        if (parsed.timestamp && parsed.expirationHours) {
          const timestamp = new Date(parsed.timestamp);
          const now = new Date();
          const hoursDiff = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);
          
          if (hoursDiff > parsed.expirationHours) {
            localStorage.removeItem(key);
            console.log(`Expired localStorage item cleared: ${key}`);
          }
        }
      } catch {
        // Skip items that aren't our format
        continue;
      }
    }
  } catch (error) {
    console.error('Failed to clear expired localStorage:', error);
  }
};

/**
 * Type exports for external use
 */
export type { UseLocalStorageOptions };