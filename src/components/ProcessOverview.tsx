
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Settings, BarChart3, Headphones } from 'lucide-react';

const ProcessOverview: React.FC = () => {
  const { t } = useTranslation();

  const steps = [
    {
      icon: Calendar,
      title: 'Beratungsgespräch',
      description: 'Kostenloses 15-minütiges Gespräch zur Analyse Ihrer aktuellen Online-Präsenz',
      duration: '15 Min.',
      details: [
        'Ist-Analyse Ihrer Google Business Präsenz',
        'Identifikation von Verbesserungspotenzialen', 
        'Empfehlung des passenden Pakets',
        'Klärung aller offenen Fragen'
      ]
    },
    {
      icon: Settings,
      title: 'Setup & Einrichtung',
      description: 'Wir übernehmen die komplette technische Einrichtung für Sie',
      duration: '2-3 Tage',
      details: [
        'Google Business Profil-Optimierung',
        'Social Media Kanäle einrichten (falls gebucht)',
        'Analytics und Tracking implementieren',
        'Mitarbeiter-Zugänge erstellen'
      ]
    },
    {
      icon: BarChart3,
      title: 'Laufende Betreuung',
      description: 'Kontinuierliche Pflege und Optimierung Ihrer Online-Präsenz',
      duration: 'Laufend',
      details: [
        'Regelmäßige Content-Updates',
        'Bewertungsmanagement',
        'Performance-Monitoring',
        'Monatliche Erfolgsberichte'
      ]
    },
    {
      icon: Headphones,
      title: 'Support & Beratung',
      description: 'Persönlicher Ansprechpartner für alle Fragen und Anpassungen',
      duration: 'Immer',
      details: [
        'Direkter Draht zu Ihrem Account Manager',
        'Schnelle Reaktionszeiten',
        'Strategische Beratung bei Änderungen',
        'Hilfe bei neuen Google Features'
      ]
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-black mb-4">
            So einfach funktioniert's
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Von der ersten Beratung bis zur laufenden Betreuung - 
            wir kümmern uns um alles, damit Sie sich aufs Wesentliche konzentrieren können
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <div key={index} className="relative">
                {/* Connection line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-gray-200 z-0" 
                       style={{ transform: 'translateX(-50%)' }} />
                )}
                
                <Card className="bg-white border border-gray-200 relative z-10 hover:shadow-md transition-shadow">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
                      <IconComponent className="h-8 w-8 text-white" />
                    </div>
                    
                    <div className="text-sm bg-gray-100 rounded-full px-3 py-1 inline-block mb-3 text-gray-600">
                      {step.duration}
                    </div>
                    
                    <h3 className="text-xl font-bold text-black mb-3">
                      {step.title}
                    </h3>
                    
                    <p className="text-gray-600 mb-4 leading-relaxed">
                      {step.description}
                    </p>
                    
                    <div className="text-left">
                      <div className="text-sm font-semibold text-gray-900 mb-2">Enthalten:</div>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {step.details.map((detail, detailIndex) => (
                          <li key={detailIndex} className="flex items-start">
                            <span className="w-1.5 h-1.5 bg-black rounded-full mt-2 mr-2 flex-shrink-0"></span>
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-16">
          <div className="bg-gray-50 rounded-lg p-8 max-w-2xl mx-auto">
            <h3 className="text-xl font-bold text-black mb-4">
              Keine Zeit verlieren?
            </h3>
            <p className="text-gray-600 mb-6">
              Buchen Sie direkt Ihr kostenloses Beratungsgespräch und erfahren Sie, 
              wie Sie Ihre Online-Sichtbarkeit in nur wenigen Wochen deutlich steigern können.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="tel:+4989123456789" 
                className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors font-semibold"
              >
                Jetzt kostenlos beraten lassen
              </a>
              <a 
                href="/kontakt" 
                className="border border-black text-black px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
              >
                Termin online buchen
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProcessOverview;
