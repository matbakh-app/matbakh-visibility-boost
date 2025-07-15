
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Zap, TrendingUp, Clock } from 'lucide-react';

const SolutionSection: React.FC = () => {
  const { t } = useTranslation('translation');
  
  const solutions = [
    {
      icon: Zap,
      titleKey: 'solution.optimization.title',
      descriptionKey: 'solution.optimization.description',
      benefitsKey: 'solution.optimization.benefits'
    },
    {
      icon: TrendingUp,
      titleKey: 'solution.visibility.title',
      descriptionKey: 'solution.visibility.description',
      benefitsKey: 'solution.visibility.benefits'
    },
    {
      icon: Clock,
      titleKey: 'solution.timeSaving.title',
      descriptionKey: 'solution.timeSaving.description',
      benefitsKey: 'solution.timeSaving.benefits'
    },
    {
      icon: CheckCircle,
      titleKey: 'solution.results.title',
      descriptionKey: 'solution.results.description',
      benefitsKey: 'solution.results.benefits'
    }
  ];

  // Sichere Funktion um Array-Benefits zu erhalten
  const getBenefitsArray = (benefitsKey: string): string[] => {
    try {
      const benefits = t(benefitsKey, { returnObjects: true });
      return Array.isArray(benefits) ? benefits : [benefits.toString()];
    } catch (error) {
      console.warn(`Failed to load benefits for key: ${benefitsKey}`, error);
      return [];
    }
  };

  return (
    <section className="py-20 px-4 bg-green-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-black mb-6">
            {t('solution.title')}
          </h2>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
            {t('solution.subtitle')}
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {solutions.map((solution, index) => {
            const IconComponent = solution.icon;
            const benefits = getBenefitsArray(solution.benefitsKey);
            
            return (
              <Card key={index} className="bg-white border-green-200 hover:shadow-lg transition-shadow">
                <CardContent className="p-8">
                  <div className="text-center flex flex-col items-center">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                      <IconComponent className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="text-left w-full">
                      <h3 className="text-xl font-bold text-black mb-3">
                        {t(solution.titleKey)}
                      </h3>
                      <p className="text-gray-700 mb-4 leading-relaxed">
                        {t(solution.descriptionKey)}
                      </p>
                      <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                        {benefits.length > 0 ? (
                          <ul className="text-sm text-green-800 space-y-2">
                            {benefits.map((benefit, benefitIndex) => (
                              <li key={benefitIndex} className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <span className="font-medium">{benefit}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-green-800 font-medium">
                            {t('solution.noBenefits', 'Vorteile werden geladen...')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default SolutionSection;
