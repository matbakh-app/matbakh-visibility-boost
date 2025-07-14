
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Zap, TrendingUp, Clock } from 'lucide-react';

const SolutionSection: React.FC = () => {
  const { t } = useTranslation();
  
  const solutions = [
    {
      icon: Zap,
      title: t('solution.optimization.title'),
      description: t('solution.optimization.description'),
      benefits: t('solution.optimization.benefits')
    },
    {
      icon: TrendingUp,
      title: t('solution.visibility.title'),
      description: t('solution.visibility.description'),
      benefits: t('solution.visibility.benefits')
    },
    {
      icon: Clock,
      title: t('solution.timeSaving.title'),
      description: t('solution.timeSaving.description'),
      benefits: t('solution.timeSaving.benefits')
    },
    {
      icon: CheckCircle,
      title: t('solution.results.title'),
      description: t('solution.results.description'),
      benefits: t('solution.results.benefits')
    }
  ];

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
            return (
              <Card key={index} className="bg-white border-green-200 hover:shadow-lg transition-shadow">
                  <CardContent className="p-8">
                    <div className="text-center flex flex-col items-center">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                        <IconComponent className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="text-left w-full">
                      <h3 className="text-xl font-bold text-black mb-3">
                        {solution.title}
                      </h3>
                      <p className="text-gray-700 mb-4 leading-relaxed">
                        {solution.description}
                      </p>
                      <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                        <p className="text-sm text-green-800 whitespace-pre-line font-medium">
                          {solution.benefits}
                        </p>
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
