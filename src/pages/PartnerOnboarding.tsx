
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
          company_name: answers.companyName,
          contact_email: user.email,
          contact_phone: answers.phone,
          website: answers.website,
          services_selected: answers.selectedServices || [],
          onboarding_completed: true,
          status: 'active',
          category_ids: answers.categories || []
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
          business_name: answers.companyName,
          address: answers.address,
          phone: answers.phone,
          website: answers.website,
          google_connected: answers.googleConnected || false
        }, {
          onConflict: 'partner_id'
        });

      if (profileError) throw profileError;

      // Save KPI data if provided
      if (answers.kpiData && Object.keys(answers.kpiData).length > 0) {
        const { error: kpiError } = await supabase
          .from('partner_kpis')
          .upsert({
            partner_id: partner.id,
            ...answers.kpiData
          }, {
            onConflict: 'partner_id'
          });
        
        if (kpiError) throw kpiError;
      }

      // Save onboarding steps
      const onboardingSteps = [
        { step_name: 'google_connection', data: { connected: answers.googleConnected }, completed: !!answers.googleConnected },
        { step_name: 'business_basics', data: answers, completed: true },
        { step_name: 'service_selection', data: { services: answers.selectedServices }, completed: true },
        { step_name: 'kpi_input', data: answers.kpiData, completed: !!answers.kpiData }
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
        title: t('messages.success'),
        description: t('messages.successDescription'),
      });

      // Redirect to dashboard
      setTimeout(() => {
        navigate('/dashboard');
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
    <div className="min-h-screen bg-white">
      <Header />
      <SmartOnboardingWizard onComplete={handleOnboardingComplete} />
    </div>
  );
};

export default PartnerOnboarding;
