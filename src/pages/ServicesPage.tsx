
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SeoMeta } from '@/components/SeoMeta';


const ServicesPage: React.FC = () => {
  const { t, i18n } = useTranslation(['services', 'common']);

  const packagesRoute = i18n.language === 'en' ? '/packages' : '/angebote';

  const getWhatsAppLink = () => {
    const message = encodeURIComponent('Hallo! Ich interessiere mich für Ihre Services und möchte gerne mehr erfahren.');
    return `https://wa.me/4915123456789?text=${message}`;
  };

  const coreServices = [
    {
      icon: '🎯',
      titleKey: 'coreServices.googleSetup.title',
      descriptionKey: 'coreServices.googleSetup.description',
      highlightsKey: 'coreServices.googleSetup.highlights'
    },
    {
      icon: '📘',
      titleKey: 'coreServices.metaSetup.title',
      descriptionKey: 'coreServices.metaSetup.description',
      highlightsKey: 'coreServices.metaSetup.highlights'
    },
    {
      icon: '🤖',
      titleKey: 'coreServices.profileManagement.title',
      descriptionKey: 'coreServices.profileManagement.description',
      highlightsKey: 'coreServices.profileManagement.highlights'
    }
  ];

  const additionalServices = [
    {
      icon: '📊',
      titleKey: 'additionalServices.analytics.title',
      descriptionKey: 'additionalServices.analytics.description',
      highlightsKey: 'additionalServices.analytics.highlights'
    },
    {
      icon: '📱',
      titleKey: 'additionalServices.socialStrategy.title',
      descriptionKey: 'additionalServices.socialStrategy.description',
      highlightsKey: 'additionalServices.socialStrategy.highlights'
    },
    {
      icon: '🌐',
      titleKey: 'additionalServices.googleTools.title',
      descriptionKey: 'additionalServices.googleTools.description',
      highlightsKey: 'additionalServices.googleTools.highlights'
    }
  ];

  const extraServices = [
    {
      icon: '⭐',
      titleKey: 'extraServices.reviewManagement.title',
      descriptionKey: 'extraServices.reviewManagement.description',
      highlightsKey: 'extraServices.reviewManagement.highlights'
    },
    {
      icon: '🎯',
      titleKey: 'extraServices.targetAnalysis.title',
      descriptionKey: 'extraServices.targetAnalysis.description',
      highlightsKey: 'extraServices.targetAnalysis.highlights'
    },
    {
      icon: '⚙️',
      titleKey: 'extraServices.automation.title',
      descriptionKey: 'extraServices.automation.description',
      highlightsKey: 'extraServices.automation.highlights'
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
        {service.highlightsKey && (
          <ul className="space-y-2 mb-4">
            {(t(service.highlightsKey, { returnObjects: true }) as string[]).map((highlight: string, index: number) => (
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
            {t('cta.startFree')}
          </Button>
        )}
      </CardContent>
    </Card>
  );

  return (
    <>
      <SeoMeta
        title={t('title')}
        description={t('subtitle')}
        namespace="services"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-16">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-black mb-4">
              {t('title')}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('subtitle')}
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
                {t('additionalServices.title')}
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
                {t('extraServices.title')}
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
              {t('cta.ready')}
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              {t('cta.description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => window.open(getWhatsAppLink(), '_blank')}>
                {t('cta.freeConsultation')}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to={packagesRoute} className="flex items-center gap-2">
                  {t('cta.viewOffers')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ServicesPage;
