
import React from 'react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/components/layout/AppLayout';
import { SeoMeta } from '@/components/SeoMeta';
import HeroSection from '@/components/HeroSection';
import ProblemSection from '@/components/ProblemSection';
import VisibilityCheckSection from '@/components/VisibilityCheckSection';
import SolutionSection from '@/components/SolutionSection';
import ProcessOverview from '@/components/ProcessOverview';
import PackageComparison from '@/components/PackageComparison';
import TrustElements from '@/components/TrustElements';
import PackageFAQ from '@/components/PackageFAQ';
import CookieConsentBanner from '@/components/CookieConsentBanner';

const BusinessLanding: React.FC = () => {
  const { t } = useTranslation('landing');

  return (
    <>
      <SeoMeta 
        title={t('hero.title')}
        description={t('hero.subtitle')}
        namespace="landing"
      />
      <AppLayout>
        <HeroSection />
        <ProblemSection />
        <VisibilityCheckSection />
        <SolutionSection />
        <ProcessOverview />
        <PackageComparison />
        <TrustElements />
        <PackageFAQ />
      </AppLayout>
      <CookieConsentBanner />
    </>
  );
};

export default BusinessLanding;
