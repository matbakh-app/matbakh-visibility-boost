
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SeoMeta } from '@/components/SeoMeta';
import AppLayout from '@/components/layout/AppLayout';

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
      title: 'Google My Business Profil Setup',
      description: 'Komplette Einrichtung und Optimierung Ihres Google Business Profils',
      highlights: [
        'Professionelle Profilgestaltung',
        'Kategorie-Optimierung',
        'Öffnungszeiten-Setup',
        'Kontaktdaten-Verwaltung'
      ]
    },
    {
      icon: '📘',
      title: 'Meta Business Profil Setup',
      description: 'Einrichtung und Optimierung Ihrer Facebook und Instagram Business-Profile',
      highlights: [
        'Facebook Business Manager',
        'Instagram Business Account',
        'Verknüpfung der Plattformen',
        'Grundlegende Optimierung'
      ]
    },
    {
      icon: '🤖',
      title: 'Intelligente Profilverwaltung',
      description: 'Automatisierte Verwaltung und Pflege Ihrer Online-Profile',
      highlights: [
        'Automatische Updates',
        'Profil-Synchronisation',
        'Content-Management',
        'Performance-Monitoring'
      ]
    }
  ];

  const additionalServices = [
    {
      icon: '📊',
      title: 'Analytics und Automatisierung',
      description: 'Datenanalyse und automatisierte Prozesse für maximale Effizienz',
      highlights: [
        'Performance-Tracking',
        'Automatisierte Berichte',
        'KPI-Monitoring',
        'Trend-Analyse'
      ]
    },
    {
      icon: '📱',
      title: 'Maßgeschneiderte Social Media Strategie',
      description: 'Individuelle Social Media Strategie für Ihren Erfolg',
      highlights: [
        'Zielgruppen-Analyse',
        'Content-Planung',
        'Posting-Strategie',
        'Engagement-Optimierung'
      ]
    },
    {
      icon: '🌐',
      title: 'Nutzung aller Google Tools für maximale Reichweite',
      description: 'Vollständige Integration aller Google-Services für optimale Sichtbarkeit',
      highlights: [
        'Google My Business',
        'Google Analytics',
        'Google Ads Integration',
        'Google Maps Optimierung'
      ]
    }
  ];

  const extraServices = [
    {
      icon: '⭐',
      title: 'Bewertungsmanagement',
      description: 'Professionelles Management Ihrer Online-Bewertungen',
      highlights: [
        'Bewertungs-Monitoring',
        'Antwort-Management',
        'Reputation-Pflege',
        'Feedback-Analyse'
      ]
    },
    {
      icon: '🎯',
      title: 'Zielgruppenanalyse',
      description: 'Detaillierte Analyse Ihrer Zielgruppe für optimale Ansprache',
      highlights: [
        'Demografische Analyse',
        'Verhalten-Tracking',
        'Präferenz-Auswertung',
        'Optimierungsvorschläge'
      ]
    },
    {
      icon: '⚙️',
      title: 'Marketing Automatisierung',
      description: 'Automatisierte Marketing-Prozesse für nachhaltigen Erfolg',
      highlights: [
        'E-Mail-Marketing',
        'Lead-Generierung',
        'Customer Journey',
        'Conversion-Optimierung'
      ]
    }
  ];

  const ServiceCard = ({ service, showButton = false }: { service: any, showButton?: boolean }) => (
    <Card className="bg-white border-2 hover:border-primary/30 transition-colors h-full">
      <CardHeader className="text-center">
        <div className="text-4xl mb-4 flex justify-center">{service.icon}</div>
        <CardTitle className="text-xl font-bold text-black">
          {service.title}
        </CardTitle>
        <CardDescription className="text-gray-600">
          {service.description}
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
    <AppLayout>
      <SeoMeta
        title="Kernleistungen"
        description="matbakh.app übernimmt für Sie"
        namespace="services"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-16">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-black mb-4">
              Kernleistungen
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              matbakh.app übernimmt für Sie
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
                Weitere Services
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
              Bereit für mehr Sichtbarkeit?
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Kontaktieren Sie uns für eine kostenlose Beratung und lassen Sie uns gemeinsam Ihre Online-Präsenz optimieren.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => window.open(getWhatsAppLink(), '_blank')}>
                Kostenlos beraten lassen
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to={packagesRoute} className="flex items-center gap-2">
                  Angebote ansehen
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ServicesPage;
