
/*
 * Layout-Struktur zentralisiert – keine eigenen Layout-Komponenten mehr verwenden. 
 * Änderungen nur nach Rücksprache.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SimpleOnboardingForm } from '@/components/onboarding/SimpleOnboardingForm';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { OnboardingService } from '@/services/OnboardingService';

const PartnerOnboarding: React.FC = () => {
  const { t } = useTranslation('onboarding');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const handleOnboardingComplete = async (answers: Record<string, any>) => {
    try {
      // Check if user is authenticated
      if (!user) {
        toast({
          title: t('error.notAuthenticated', 'Nicht angemeldet'),
          description: t('error.pleaseLogin', 'Bitte melden Sie sich an'),
          variant: 'destructive'
        });
        return;
      }

      // Complete onboarding using AWS RDS
      const result = await OnboardingService.completeOnboarding(
        user.id, 
        user.email || '', 
        answers
      );

      if (!result.success) {
        throw new Error(result.error || 'Onboarding failed');
      }

      toast({
        title: t('messages.success'),
        description: t('messages.successDescription'),
      });

      // Redirect to dashboard
      setTimeout(() => {
        // 🔧 NUR nach Onboarding weiterleiten
        const currentPath = window.location.pathname;
        if (currentPath.includes('/onboarding')) {
          navigate('/dashboard');
        } else {
          console.log('PartnerOnboarding: Staying on current path:', currentPath);
        }
      }, 2000);

    } catch (error) {
      console.error('Onboarding error:', error);
      toast({
        title: t('messages.errorTitle'),
        description: t('messages.errorDescription'),
        variant: 'destructive'
      });
    }
  };

  return (
    <SimpleOnboardingForm onComplete={handleOnboardingComplete} />
  );
};

export default PartnerOnboarding;
