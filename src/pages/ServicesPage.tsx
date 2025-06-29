
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle, Users, Settings, BarChart3, MessageSquare, Star, Zap } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const ServicesPage: React.FC = () => {
  const { t } = useTranslation();

  const coreServices = [
    {
      icon: Settings,
      title: 'Google Business Profil Setup',
      description: 'Professionelle Einrichtung und Optimierung Ihres Google Business Profils für maximale lokale Sichtbarkeit.',
      features: ['Vollständige Profilerstellung', 'SEO-Optimierung', 'Kategorie-Setup', 'Öffnungszeiten-Management'],
      color: 'bg-blue-50 border-blue-200',
      iconColor: 'bg-blue-500'
    },
    {
      icon: BarChart3,
      title: 'Social Media Management',
      description: 'Kontinuierliche Betreuung Ihrer Social Media Kanäle mit professionellen Inhalten und strategischem Engagement.',
      features: ['Content-Erstellung', 'Posting-Automatisierung', 'Community Management', 'Performance-Tracking'],
      color: 'bg-green-50 border-green-200',
      iconColor: 'bg-green-500'
    },
    {
      icon: MessageSquare,
      title: 'KI-gestützte Chatbots',
      description: 'Intelligente Chatbots für automatisierte Kundeninteraktion und 24/7 Verfügbarkeit.',
      features: ['Automatische Antworten', 'Reservierungsanfragen', 'FAQ-Handling', 'Mehrsprachiger Support'],
      color: 'bg-purple-50 border-purple-200',
      iconColor: 'bg-purple-500'
    }
  ];

  const additionalServices = [
    {
      icon: Star,
      title: 'Bewertungsmanagement',
      description: 'Proaktive Verwaltung und Optimierung Ihrer Online-Bewertungen.',
      color: 'bg-yellow-50 border-yellow-200',
      iconColor: 'bg-yellow-500'
    },
    {
      icon: Users,
      title: 'Zielgruppenanalyse',
      description: 'Detaillierte Analyse Ihrer Zielgruppen für bessere Marketingstrategien.',
      color: 'bg-indigo-50 border-indigo-200',
      iconColor: 'bg-indigo-500'
    },
    {
      icon: Zap,
      title: 'Automatisierte Workflows',
      description: 'Effiziente Automatisierung wiederkehrender Marketing-Aufgaben.',
      color: 'bg-orange-50 border-orange-200',
      iconColor: 'bg-orange-500'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-black mb-6">
            Unsere Services für Ihr Restaurant
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            Professionelle Digitallösungen, die Ihre Sichtbarkeit steigern und mehr Gäste in Ihr Restaurant bringen. 
            Wir übernehmen die Technik - Sie konzentrieren sich auf Ihre Gäste.
          </p>
        </div>
      </section>

      {/* Core Services Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-black mb-4">
              Unsere Hauptservices
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Drei essenzielle Services, die Ihr Restaurant digital erfolgreich machen
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {coreServices.map((service, index) => {
              const IconComponent = service.icon;
              return (
                <Card key={index} className={`${service.color} border-2 hover:shadow-lg transition-all duration-300`}>
                  <CardHeader className="text-center pb-4">
                    <div className={`w-16 h-16 ${service.iconColor} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                      <IconComponent className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-xl font-bold text-black">
                      {service.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-700 leading-relaxed text-center">
                      {service.description}
                    </p>
                    <div className="space-y-2">
                      {service.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Additional Services Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-black mb-4">
              Zusätzliche Services
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Erweitern Sie Ihre digitale Präsenz mit unseren spezialisierten Zusatzleistungen
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {additionalServices.map((service, index) => {
              const IconComponent = service.icon;
              return (
                <Card key={index} className={`${service.color} border-2 hover:shadow-md transition-all duration-300`}>
                  <CardHeader className="text-center pb-4">
                    <div className={`w-12 h-12 ${service.iconColor} rounded-lg flex items-center justify-center mx-auto mb-4`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-lg font-semibold text-black">
                      {service.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-gray-700 leading-relaxed">
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
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-black mb-6">
            Bereit für mehr digitale Sichtbarkeit?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Sie müssen sich nicht um komplexe technische Anforderungen kümmern - wir erledigen das für Sie.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-black hover:bg-gray-800 text-white px-8 py-3">
              Kostenlose Beratung
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" className="border-black text-black hover:bg-gray-50 px-8 py-3">
              Angebote ansehen
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ServicesPage;
