
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/components/layout/AppLayout';
import { SeoMeta } from '@/components/SeoMeta';

const ServicesPage: React.FC = () => {
  const { t, i18n } = useTranslation();

  const packagesRoute = i18n.language === 'en' ? '/packages' : '/angebote';

  const coreServices = [
    {
      icon: '🎯',
      titleKey: 'services.setup.coreTitle',
      descriptionKey: 'services.setup.coreDescription',
      features: t('services.setup.features', { returnObjects: true }) as string[]
    },
    {
      icon: '📱',
      titleKey: 'services.management.title',
      descriptionKey: 'services.management.coreDescription',
      features: t('services.management.features', { returnObjects: true }) as string[]
    },
    {
      icon: '🤖',
      titleKey: 'services.analytics.coreTitle',
      descriptionKey: 'services.analytics.coreDescription',
      features: t('services.analytics.features', { returnObjects: true }) as string[]
    }
  ];

  const additionalServices = [
    {
      icon: '⭐',
      titleKey: 'services.additional.reviews.title',
      descriptionKey: 'services.additional.reviews.description'
    },
    {
      icon: '🎯',
      titleKey: 'services.additional.audience.title',
      descriptionKey: 'services.additional.audience.description'
    },
    {
      icon: '⚙️',
      titleKey: 'services.additional.automation.title',
      descriptionKey: 'services.additional.automation.description'
    }
  ];

  const servicesJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Matbakh",
    url: "https://matbakh.app",
    description: "Professional services for restaurant digital presence and management",
    offers: [
      {
        "@type": "Service",
        name: "Google Business Setup",
        description: "Complete Google Business profile setup and optimization"
      },
      {
        "@type": "Service",
        name: "Profile Management", 
        description: "Ongoing Google Business profile management and updates"
      },
      {
        "@type": "Service",
        name: "Analytics & Automation",
        description: "Automated analytics and business intelligence solutions"
      }
    ]
  };

  return (
    <>
      <SeoMeta
        title={t('services.pageTitle', 'Unsere Leistungen')}
        description={t('services.pageSubtitle', 'Professionelle digitale Lösungen für Restaurants')}
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

          {/* Core Services */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-black mb-4">
                {t('services.coreTitle')}
              </h2>
              <p className="text-lg text-gray-600">
                {t('services.coreSubtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              {coreServices.map((service, index) => (
                 <Card key={index} className="bg-white border-2 hover:border-gray-300 transition-colors">
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
                    <ul className="space-y-2">
                      {service.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Additional Services */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-black mb-4">
                {t('services.additionalTitle')}
              </h2>
              <p className="text-lg text-gray-600">
                {t('services.additionalSubtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {additionalServices.map((service, index) => (
                <Card key={index} className="bg-white border hover:border-gray-300 transition-colors">
                  <CardHeader className="text-center">
                    <div className="text-3xl mb-4 flex justify-center">{service.icon}</div>
                    <CardTitle className="text-lg font-bold text-black">
                      {t(service.titleKey)}
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      {t(service.descriptionKey)}
                    </CardDescription>
                  </CardHeader>
                </Card>
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
              <Button asChild size="lg">
                <Link to="/kontakt" className="flex items-center gap-2">
                  {t('services.ctaButton1')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
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
