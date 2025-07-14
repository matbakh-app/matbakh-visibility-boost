
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Logo from './Logo';

interface HeroSectionProps {
  title?: string;
  subtitle?: string;
  showButtons?: boolean;
  customButtons?: React.ReactNode;
  className?: string;
}

const HeroSection: React.FC<HeroSectionProps> = ({ 
  title, 
  subtitle, 
  showButtons = true,
  customButtons,
  className = "" 
}) => {
  const { t, i18n } = useTranslation('landing');
  const navigate = useNavigate();

  const getPackagesRoute = () => {
    return i18n.language === 'en' ? '/packages' : '/angebote';
  };

  const getLoginRoute = () => {
    return '/business/partner/login';
  };

  // Use custom props or fallback to translation keys
  const heroTitle = title || t('heroTitle');
  const heroSubtitle = subtitle || t('heroSubtitle');

  return (
    <section className={`w-full text-center ${className}`}>
      <Logo size="lg" className="mx-auto mb-2" />
      <h1 className="mt-2 text-5xl font-bold mb-6 text-sky-500">
        {heroTitle}
      </h1>
      <p className="text-xl mb-8 max-w-3xl mx-auto leading-relaxed text-center text-sky-800">
        {heroSubtitle}
      </p>
      
      {showButtons && !customButtons && (
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg" 
            className="bg-black hover:bg-gray-800 text-white px-8 py-3" 
            onClick={() => navigate(getPackagesRoute())}
          >
            {t('cta1')}
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="border-black text-black hover:bg-gray-50 px-8 py-3" 
            onClick={() => navigate(getLoginRoute())}
          >
            {t('cta2')}
          </Button>
        </div>
      )}
      
      {customButtons && (
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {customButtons}
        </div>
      )}
    </section>
  );
};

export default HeroSection;
