import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

const STORAGE_KEY = 'matbakh_onboarding_data';
const STORAGE_VERSION = '1.0';

interface OnboardingData {
  version: string;
  currentStep: number;
  answers: Record<string, any>;
  timestamp: string;
}

export const useOnboardingPersistence = () => {
  const { toast } = useToast();
  const { t } = useTranslation('onboarding');
  const [isRestored, setIsRestored] = useState(false);

  const saveData = useCallback((step: number, answers: Record<string, any>) => {
    try {
      const data: OnboardingData = {
        version: STORAGE_VERSION,
        currentStep: step,
        answers,
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      
      // Show brief success indication (optional, only on major steps)
      if (step > 1) {
        toast({
          title: t('messages.dataSaved'),
          duration: 2000,
        });
      }
    } catch (error) {
      console.error('Failed to save onboarding data:', error);
    }
  }, [toast, t]);

  const loadData = useCallback((): { step: number; answers: Record<string, any> } | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const data: OnboardingData = JSON.parse(stored);
      
      // Check version compatibility
      if (data.version !== STORAGE_VERSION) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }

      // Check if data is not too old (24 hours)
      const age = Date.now() - new Date(data.timestamp).getTime();
      if (age > 24 * 60 * 60 * 1000) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }

      return {
        step: data.currentStep,
        answers: data.answers
      };
    } catch (error) {
      console.error('Failed to load onboarding data:', error);
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  }, []);

  const clearData = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear onboarding data:', error);
    }
  }, []);

  const restoreData = useCallback(() => {
    const stored = loadData();
    if (stored && !isRestored) {
      setIsRestored(true);
      toast({
        title: t('messages.dataRestored'),
        duration: 3000,
      });
      return stored;
    }
    return null;
  }, [loadData, isRestored, toast, t]);

  return {
    saveData,
    loadData,
    clearData,
    restoreData,
    isRestored
  };
};