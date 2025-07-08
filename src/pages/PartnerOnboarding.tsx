
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '@/components/Header';
import { SmartOnboardingWizard } from '@/components/onboarding/SmartOnboardingWizard';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const PartnerOnboarding: React.FC = () => {
  const { t } = useTranslation('onboarding');
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleOnboardingComplete = async (answers: Record<string, any>) => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: t('error.notAuthenticated', 'Nicht angemeldet'),
          description: t('error.pleaseLogin', 'Bitte melden Sie sich an'),
          variant: 'destructive'
        });
        return;
      }

      // Create or update business partner
      const { data: partner, error: partnerError } = await supabase
        .from('business_partners')
        .upsert({
          user_id: user.id,
          company_name: answers.business_name,
          contact_email: answers.gmail_account || user.email,
          contact_phone: answers.business_phone,
          website: answers.business_website,
          services_selected: answers.selected_services || [],
          onboarding_completed: true,
          status: 'active'
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (partnerError) throw partnerError;

      // Create or update business profile
      const { error: profileError } = await supabase
        .from('business_profiles')
        .upsert({
          partner_id: partner.id,
          business_name: answers.business_name,
          address: answers.business_address,
          phone: answers.business_phone,
          website: answers.business_website,
          business_description: answers.business_description,
          gmb_category_id: answers.business_category,
          google_connected: answers.google_connected || false,
          gmb_setup_completed: false
        }, {
          onConflict: 'partner_id'
        });

      if (profileError) throw profileError;

      // Save onboarding steps
      const onboardingSteps = [
        { step_name: 'business_data', data: answers, completed: true },
        { step_name: 'service_selection', data: { services: answers.selected_services }, completed: true },
        { step_name: 'qualification', data: { has_gmail: answers.has_gmail }, completed: true },
        { step_name: 'google_connection', data: { connected: answers.google_connected }, completed: !!answers.google_connected }
      ];

      for (const step of onboardingSteps) {
        await supabase
          .from('partner_onboarding_steps')
          .upsert({
            partner_id: partner.id,
            ...step,
            completed_at: step.completed ? new Date().toISOString() : null
          }, {
            onConflict: 'partner_id,step_name'
          });
      }

      toast({
        title: t('onboarding:messages.success'),
        description: t('onboarding:messages.successDescription'),
      });

      // Redirect to dashboard
      setTimeout(() => {
        navigate('/partner/dashboard');
      }, 2000);

    } catch (error) {
      console.error('Onboarding error:', error);
      toast({
        title: t('onboarding:messages.errorTitle'),
        description: t('onboarding:messages.errorDescription'),
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <SmartOnboardingWizard onComplete={handleOnboardingComplete} />
    </div>
  );
};

export default PartnerOnboarding;
