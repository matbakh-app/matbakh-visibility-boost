
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Search, Users, TrendingDown } from 'lucide-react';

const ProblemSection: React.FC = () => {
  const { t } = useTranslation();
  
  const problems = [
    {
      icon: Search,
      title: t('problem.invisible.title'),
      description: t('problem.invisible.description'),
      example: t('problem.invisible.example')
    },
    {
      icon: TrendingDown,
      title: t('problem.declining.title'),
      description: t('problem.declining.description'),
      example: t('problem.declining.example')
    },
    {
      icon: AlertTriangle,
      title: t('problem.overwhelmed.title'),
      description: t('problem.overwhelmed.description'),
      example: t('problem.overwhelmed.example')
    },
    {
      icon: Users,
      title: t('problem.missed.title'),
      description: t('problem.missed.description'),
      example: t('problem.missed.example')
    }
  ];

  return (
    <section className="py-20 px-4 bg-sky-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-black mb-6">
            {t('problem.title')}
          </h2>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
            {t('problem.subtitle')}
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {problems.map((problem, index) => {
            const IconComponent = problem.icon;
            return (
              <Card key={index} className="bg-white border-red-200 hover:shadow-lg transition-shadow">
                <CardContent className="p-8">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <IconComponent className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-black mb-3">
                        {problem.title}
                      </h3>
                      <p className="text-gray-700 mb-4 leading-relaxed">
                        {problem.description}
                      </p>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 whitespace-pre-line">
                          {problem.example}
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

export default ProblemSection;
