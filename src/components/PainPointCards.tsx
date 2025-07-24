
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Search, TrendingDown, Users, AlertTriangle } from 'lucide-react';

const PainPointCards: React.FC = () => {
  const { t } = useTranslation('packages');

  const painPoints = [
    {
      id: 1,
      icon: Search,
      title: t('painPoints.notVisible.title', 'Nicht auffindbar bei Google'),
      description: t('painPoints.notVisible.description', 'Ihre Kunden finden Sie nicht, wenn sie nach Ihrem Service suchen'),
      example: t('painPoints.notVisible.example', 'Beispiel: "Restaurant München" - Sie sind nicht in den ersten Ergebnissen')
    },
    {
      id: 2,
      icon: TrendingDown,
      title: t('painPoints.inconsistent.title', 'Kein konsistenter Auftritt'),
      description: t('painPoints.inconsistent.description', 'Verschiedene Informationen auf Google, Facebook und Instagram verwirren Kunden'),
      example: t('painPoints.inconsistent.example', 'Beispiel: Unterschiedliche Öffnungszeiten auf verschiedenen Plattformen')
    },
    {
      id: 3,
      icon: AlertTriangle,
      title: t('painPoints.outdated.title', 'Veraltete Informationen'),
      description: t('painPoints.outdated.description', 'Alte Speisekarten, falsche Preise oder geschlossene Filialen schaden Ihrem Image'),
      example: t('painPoints.outdated.example', 'Beispiel: Sommerkarte wird noch im Winter angezeigt')
    },
    {
      id: 4,
      icon: Users,
      title: t('painPoints.noReviews.title', 'Wenige oder schlechte Bewertungen'),
      description: t('painPoints.noReviews.description', 'Fehlende Bewertungen oder unbearbeitete negative Reviews beeinflussen Ihre Sichtbarkeit'),
      example: t('painPoints.noReviews.example', 'Beispiel: 2-Sterne-Bewertung ohne Antwort vom Inhaber')
    }
  ];

  return (
    <section className="mb-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-black mb-4">
          {t('painPoints.title', 'Wie sichtbar ist Ihr Restaurant online?')}
        </h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          {t('painPoints.subtitle', 'Kostenlose Analyse Ihrer Google-Präsenz – ohne Verpflichtung')}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {painPoints.map((point) => {
          const IconComponent = point.icon;
          return (
            <div key={point.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
                    <IconComponent className="w-6 h-6 text-red-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-black mb-2">
                    {point.title}
                  </h3>
                  <p className="text-gray-600 mb-3">
                    {point.description}
                  </p>
                  <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded">
                    {point.example}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default PainPointCards;
