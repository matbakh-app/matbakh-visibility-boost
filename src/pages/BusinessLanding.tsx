
/**
 * ⚠️ Alle sichtbaren Landing-Page-Texte werden ausschließlich aus translation.json > landing geladen. 
 * Änderungen an Texten nur über die JSON-Dateien!
 * 
 * Landing-Page Schlüsselstruktur:
 * - landing.heroTitle: Hauptüberschrift der Hero-Sektion
 * - landing.heroSubtitle: Untertitel der Hero-Sektion
 * - landing.cta1/cta2: Call-to-Action Buttons
 * - landing.servicesTitle/servicesSubtitle: Services-Sektion
 * - landing.ctaFinalTitle/ctaFinalSubtitle/ctaFinalButton1/ctaFinalButton2: Finale CTA-Sektion
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wrench, BarChart3, Brain } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import HeroSection from '@/components/HeroSection';
import ProblemSection from '@/components/ProblemSection';
import SolutionSection from '@/components/SolutionSection';
import WhyMatbakhBanner from '@/components/WhyMatbakhBanner';
import TestimonialSection from '@/components/TestimonialSection';
import TrustSection from '@/components/TrustSection';
import HowItWorksSection from '@/components/HowItWorksSection';
import VisibilityCheckSection from '@/components/VisibilityCheckSection';
import { SeoMeta } from '@/components/SeoMeta';
import { Link } from 'react-router-dom';

const BusinessLanding: React.FC = () => {
  const { t, i18n } = useTranslation('landing');
  const navigate = useNavigate();
  
  const getPackagesRoute = () => {
    return i18n.language === 'en' ? '/packages' : '/angebote';
  };
  
  const getLoginRoute = () => {
    return '/business/partner/login';
  };

  const getWhatsAppLink = () => {
    const message = encodeURIComponent('Hallo! Ich interessiere mich für matbakh.app und möchte gerne mehr erfahren.');
    return `https://wa.me/4915123456789?text=${message}`;
  };

  const services = [
    {
      icon: Wrench,
      title: t('services.setup.coreTitle'),
      description: t('services.setup.coreDescription')
    },
    {
      icon: BarChart3,
      title: t('services.management.title'),
      description: t('services.management.coreDescription')
    },
    {
      icon: Brain,
      title: t('services.analytics.coreTitle'),
      description: t('services.analytics.coreDescription')
    }
  ];

  const servicesJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Matbakh",
    url: "https://matbakh.app",
    description: "Professional Google Business profile management and social media automation for restaurants",
    offers: [
      {
        "@type": "Service",
        name: "Google Business Profile Setup",
        description: "Complete setup and optimization of Google Business profiles for restaurants"
      },
      {
        "@type": "Service",
        name: "Profile Management",
        description: "Ongoing management and updates of Google Business profiles"
      },
      {
        "@type": "Service",
        name: "Social Media Automation",
        description: "Automated social media management for restaurants"
      }
    ]
  };

  return (
    <>
      <SeoMeta
        title={t('heroTitle')}
        description={t('heroSubtitle')}
        namespace="landing"
      />
      
      {/* Enhanced SEO & Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "http://schema.org",
          "@type": "Organization",
          "url": "https://matbakh.app",
          "name": "matbakh.app",
          "contactPoint": [{
            "@type": "ContactPoint",
            "email": "mail(at)matbakh(dot)app",
            "contactType": "customer support"
          }],
          "sameAs": ["https://matbakh.app/datenschutz", "https://matbakh.app/privacy"]
        })}
      </script>

      <AppLayout>
        {/* Why matbakh.app Banner - Empathic positioning */}
        <WhyMatbakhBanner />
        
        {/* Privacy Policy Link - Prominent for Google */}
        <div className="text-center mb-6">
          <Link to={i18n.language === 'de' ? '/datenschutz' : '/privacy'} className="inline-block text-sm font-bold text-primary hover:underline">
            {i18n.language === 'de' ? 'Datenschutz' : 'Privacy Policy'}
          </Link>
        </div>

        {/* Hero Section with integrated Logo */}
        <section className="py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <HeroSection />
          </div>
        </section>

        <ProblemSection />
        <SolutionSection />
        
        {/* Trust Elements */}
        <TrustSection />
        
        {/* How It Works */}
        <HowItWorksSection />
        
        {/* Testimonials */}
        <TestimonialSection />
        
        {/* Visibility Check CTA */}
        <VisibilityCheckSection />

        {/* Services Section */}
        <section id="services" className="py-20 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-black mb-4">
                {t('servicesTitle')}
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                {t('servicesSubtitle')}
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {services.map((service, index) => {
                const IconComponent = service.icon;
                return (
                  <Card key={index} className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="text-center pb-4">
                      <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mx-auto mb-4">
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      <CardTitle className="text-xl font-semibold text-black">
                        {service.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <p className="text-gray-600 leading-relaxed">
                        {service.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 bg-black">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-white mb-6">
              {t('ctaFinalTitle')}
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              {t('ctaFinalSubtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white hover:bg-gray-100 text-black px-8 py-3" onClick={() => {
                const element = document.querySelector('.visibility-check-section');
                element?.scrollIntoView({ behavior: 'smooth' });
              }}>
                {t('ctaFinalButton1')}
              </Button>
              <Button variant="outline" size="lg" onClick={() => window.open(getWhatsAppLink(), '_blank')} className="border-white hover:bg-white px-8 py-3 text-white hover:text-black">
                {t('ctaFinalButton2')}
              </Button>
            </div>
          </div>
        </section>
      </AppLayout>
    </>
  );
};

export default BusinessLanding;
