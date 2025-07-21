
import React from 'react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/components/layout/AppLayout';
import { SeoMeta } from '@/components/SeoMeta';
import HeroSection from '@/components/HeroSection';
import ProblemSection from '@/components/ProblemSection';
import SolutionSection from '@/components/SolutionSection';
import ProcessOverview from '@/components/ProcessOverview';
import PackageComparison from '@/components/PackageComparison';
import TrustElements from '@/components/TrustElements';
import PackageFAQ from '@/components/PackageFAQ';
import CookieConsentBanner from '@/components/CookieConsentBanner';
import FacebookTestComponent from '@/components/FacebookTestComponent';

const BusinessLanding: React.FC = () => {
  const { t } = useTranslation('landing');
  const isDebugMode = import.meta.env.DEV;

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
        <SolutionSection />
        <ProcessOverview />
        <PackageComparison />
        <TrustElements />
        <PackageFAQ />
        
        {/* Facebook Test Component - nur im Development Mode */}
        {isDebugMode && (
          <section className="py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-center">
                <FacebookTestComponent />
              </div>
            </div>
          </section>
        )}
      </AppLayout>
      <CookieConsentBanner />
    </>
  );
};

export default BusinessLanding;
