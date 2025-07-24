
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/components/layout/AppLayout';
import { SeoMeta } from '@/components/SeoMeta';

const ServicesPage: React.FC = () => {
  const { t, i18n } = useTranslation();

  const packagesRoute = i18n.language === 'en' ? '/packages' : '/angebote';

  const getWhatsAppLink = () => {
    const message = encodeURIComponent('Hallo! Ich interessiere mich für Ihre Services und möchte gerne mehr erfahren.');
    return `https://wa.me/4915123456789?text=${message}`;
  };

  // Helper function to safely get array from translation
  const getTranslationArray = (key: string): string[] => {
    const result = t(key, { returnObjects: true });
    if (Array.isArray(result)) {
      return result;
    }
    return [];
  };

  const coreServices = [
    {
      icon: '🎯',
      titleKey: 'services.setup.coreTitle',
      descriptionKey: 'services.setup.coreDescription',
      highlights: getTranslationArray('services.setup.highlights')
    },
    {
      icon: '📘',
      titleKey: 'services.meta.title',
      descriptionKey: 'services.meta.description',
      highlights: getTranslationArray('services.meta.highlights')
    },
    {
      icon: '🤖',
      titleKey: 'services.management.title',
      descriptionKey: 'services.management.coreDescription',
      highlights: getTranslationArray('services.management.highlights')
    }
  ];

  const additionalServices = [
    {
      icon: '📊',
      titleKey: 'services.analytics.coreTitle',
      descriptionKey: 'services.analytics.coreDescription',
      highlights: getTranslationArray('services.analytics.highlights')
    },
    {
      icon: '📱',
      titleKey: 'services.social.title',
      descriptionKey: 'services.social.description',
      highlights: getTranslationArray('services.social.highlights')
    },
    {
      icon: '🌐',
      titleKey: 'services.googleTools.title',
      descriptionKey: 'services.googleTools.description',
      highlights: getTranslationArray('services.googleTools.highlights')
    }
  ];

  const extraServices = [
    {
      icon: '⭐',
      titleKey: 'services.additional.reviews.title',
      descriptionKey: 'services.additional.reviews.description',
      highlights: []
    },
    {
      icon: '🎯',
      titleKey: 'services.additional.audience.title',
      descriptionKey: 'services.additional.audience.description',
      highlights: []
    },
    {
      icon: '⚙️',
      titleKey: 'services.additional.automation.title',
      descriptionKey: 'services.additional.automation.description',
      highlights: []
    }
  ];

  const ServiceCard = ({ service, showButton = false }: { service: any, showButton?: boolean }) => (
    <Card className="bg-white border-2 hover:border-primary/30 transition-colors h-full">
      <CardHeader className="text-center">
        <div className="text-4xl mb-4 flex justify-center">{service.icon}</div>
        <CardTitle className="text-xl font-bold text-black">
          {t(service.titleKey)}
        </CardTitle>
        <CardDescription className="text-gray-600">
          {t(service.descriptionKey)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {service.highlights && Array.isArray(service.highlights) && service.highlights.length > 0 && (
          <ul className="space-y-2 mb-4">
            {service.highlights.map((highlight: string, index: number) => (
              <li key={index} className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span className="text-sm text-gray-700">{highlight}</span>
              </li>
            ))}
          </ul>
        )}
        {showButton && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => window.open(getWhatsAppLink(), '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Jetzt kostenlos starten
          </Button>
        )}
      </CardContent>
    </Card>
  );

  return (
    <>
      <SeoMeta
        title={t('services.pageTitle', 'Kernleistungen')}
        description={t('services.pageSubtitle', 'matbakh.app übernimmt für Sie')}
        namespace="translation"
      />
      <AppLayout>
        <div className="py-16">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-black mb-4">
              {t('services.pageTitle')}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('services.pageSubtitle')}
            </p>
          </div>

          {/* Core Services - 3 Cards in Row */}
          <div className="mb-16">
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              {coreServices.map((service, index) => (
                <ServiceCard key={index} service={service} />
              ))}
            </div>
          </div>

          {/* Additional Services - 3 Cards in Second Row */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-black mb-4">
                {t('services.additionalTitle')}
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {additionalServices.map((service, index) => (
                <ServiceCard key={index} service={service} showButton={true} />
              ))}
            </div>
          </div>

          {/* Extra Services */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-black mb-4">
                Zusätzliche Services
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {extraServices.map((service, index) => (
                <ServiceCard key={index} service={service} showButton={true} />
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-black mb-4">
              {t('services.ctaTitle')}
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              {t('services.ctaSubtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => window.open(getWhatsAppLink(), '_blank')}>
                {t('services.ctaButton1')}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to={packagesRoute} className="flex items-center gap-2">
                  {t('services.ctaButton2')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </AppLayout>
    </>
  );
};

export default ServicesPage;
