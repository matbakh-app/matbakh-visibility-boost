
import React from 'react';
import { useTranslation } from 'react-i18next';
import { SeoMeta } from '@/components/SeoMeta';
import HeroSection from '@/components/HeroSection';
import ProblemSection from '@/components/ProblemSection';
import { VCLaunchWidget } from '@/components/visibility/VCLaunchWidget';
import SolutionSection from '@/components/SolutionSection';
import ProcessOverview from '@/components/ProcessOverview';
import PackageComparison from '@/components/PackageComparison';
import TrustElements from '@/components/TrustElements';
import PackageFAQ from '@/components/PackageFAQ';
import { useUserJourney } from '@/services/UserJourneyManager';
import { useAuth } from '@/contexts/AuthContext';

const BusinessLanding: React.FC = () => {
  const { t } = useTranslation('landing');
  const { setEntryPoint, setVCData } = useUserJourney();
  const { user, openAuthModal } = useAuth();

  const handleVCStart = (formData: any) => {
    // 1) Journey setzen
    setEntryPoint('vc', formData);
    setVCData(formData);
    
    // 2) Auth-Modal öffnen (falls nicht eingeloggt)
    if (!user) {
      openAuthModal('register', formData);
    } else {
      // direkt zum Onboarding weiter
      window.location.href = '/onboarding/standard';
    }
  };

  return (
    <>
      <SeoMeta 
        title={t('heroTitle')}
        description={t('heroSubtitle')}
        namespace="landing"
      />
      <HeroSection />
      <ProblemSection />
      <VCLaunchWidget onStart={handleVCStart} />
      <SolutionSection />
      <ProcessOverview />
      <PackageComparison />
      <TrustElements />
      <PackageFAQ />
    </>
  );
};

export default BusinessLanding;
