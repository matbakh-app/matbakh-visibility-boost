
import React from 'react';
import { useTranslation } from 'react-i18next';
import { SeoMeta } from '@/components/SeoMeta';
import HeroSection from '@/components/HeroSection';
import ProblemSection from '@/components/ProblemSection';
import VisibilityCheckSection from '@/components/VisibilityCheckSection';
import SolutionSection from '@/components/SolutionSection';
import ProcessOverview from '@/components/ProcessOverview';
import PackageComparison from '@/components/PackageComparison';
import TrustElements from '@/components/TrustElements';
import PackageFAQ from '@/components/PackageFAQ';

const BusinessLanding: React.FC = () => {
  const { t } = useTranslation('landing');

  return (
    <>
      <SeoMeta 
        title={t('heroTitle')}
        description={t('heroSubtitle')}
        namespace="landing"
      />
      <HeroSection />
      <ProblemSection />
      <VisibilityCheckSection />
      <SolutionSection />
      <ProcessOverview />
      <PackageComparison />
      <TrustElements />
      <PackageFAQ />
    </>
  );
};

export default BusinessLanding;
