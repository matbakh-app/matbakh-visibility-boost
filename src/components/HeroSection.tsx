
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Phone, BarChart3, Rocket } from 'lucide-react';
import WhyMatbakhBanner from './WhyMatbakhBanner';
import { useAnalyticsEvent } from '@/hooks/useAnalyticsEvent';

const HeroSection: React.FC = () => {
  const { t } = useTranslation('landing');
  const { trackEvent } = useAnalyticsEvent();

  const scrollToVisibilityCheck = () => {
    const visibilitySection = document.querySelector('.visibility-check-section');
    if (visibilitySection) {
      visibilitySection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const handleVCQuickClick = () => {
    trackEvent('vc_quick_cta_click', { 
      location: 'hero_section',
      cta_type: 'primary'
    });
    window.location.href = '/vc/quick';
  };

  const handleWhatsAppContact = () => {
    const message = encodeURIComponent(
      'Hallo! Ich interessiere mich für die Verbesserung meiner Online-Sichtbarkeit. Können Sie mir dabei helfen?'
    );
    window.open(`https://wa.me/4915123456789?text=${message}`, '_blank');
  };

  return (
    <>
      <WhyMatbakhBanner />
      <section className="pt-20 pb-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-black mb-6 leading-tight">
            {t('heroTitle')}
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            {t('heroSubtitle')}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-2xl mx-auto">
            <Button 
              onClick={handleVCQuickClick}
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-white flex-1"
            >
              <Rocket className="h-5 w-5 mr-2" />
              Visibility Check starten
            </Button>
            <Button 
              onClick={() => window.location.href = '/register'}
              variant="outline"
              size="lg" 
              className="flex-1"
            >
              <BarChart3 className="h-5 w-5 mr-2" />
              Jetzt kostenlos registrieren
            </Button>
            <Button 
              onClick={handleWhatsAppContact}
              variant="outline" 
              size="lg"
              className="flex-1"
            >
              <Phone className="h-5 w-5 mr-2" />
              {t('cta2')}
            </Button>
          </div>
        </div>
      </section>
    </>
  );
};

export default HeroSection;
