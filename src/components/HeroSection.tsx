
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Logo from './Logo';

const HeroSection: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const getPackagesRoute = () => {
    return i18n.language === 'en' ? '/packages' : '/angebote';
  };

  const getContactRoute = () => {
    return i18n.language === 'en' ? '/contact' : '/kontakt';
  };

  return (
    <section className="w-full text-center">
      <Logo size="lg" className="mx-auto mb-2" />
      <h1 className="mt-2 text-5xl font-bold mb-6 text-sky-500">
        {t('landing.heroTitle')}
      </h1>
      <p className="text-xl mb-8 max-w-3xl mx-auto leading-relaxed text-center text-sky-800">
        {t('landing.heroSubtitle')}
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button 
          size="lg" 
          className="bg-black hover:bg-gray-800 text-white px-8 py-3" 
          onClick={() => navigate(getPackagesRoute())}
        >
          {t('landing.cta1')}
        </Button>
        <Button 
          variant="outline" 
          size="lg" 
          className="border-black text-black hover:bg-gray-50 px-8 py-3" 
          onClick={() => navigate(getContactRoute())}
        >
          {t('landing.cta2')}
        </Button>
      </div>
    </section>
  );
};

export default HeroSection;
