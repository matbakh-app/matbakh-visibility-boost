import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { onboardingStorage } from '@/utils/localStorage';

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
      const data = {
        version: STORAGE_VERSION,
        currentStep: step,
        answers,
        timestamp: new Date().toISOString()
      };
      
      onboardingStorage.save(step, data);
      
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
      const data = onboardingStorage.restore();
      if (!data) return null;
      
      // Check version compatibility
      if (data.version !== STORAGE_VERSION) {
        onboardingStorage.clear();
        return null;
      }

      return {
        step: data.currentStep,
        answers: data.answers
      };
    } catch (error) {
      console.error('Failed to load onboarding data:', error);
      onboardingStorage.clear();
      return null;
    }
  }, []);

  const clearData = useCallback(() => {
    onboardingStorage.clear();
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