import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Clock, Users, Award } from 'lucide-react';

const TrustSection: React.FC = () => {
  const { t } = useTranslation('landing');

  const trustElements = [
    {
      icon: Shield,
      title: t('trust.guarantee.title'),
      description: t('trust.guarantee.description')
    },
    {
      icon: Clock,
      title: t('trust.support.title'), 
      description: t('trust.support.description')
    },
    {
      icon: Users,
      title: t('trust.experience.title'),
      description: t('trust.experience.description')
    },
    {
      icon: Award,
      title: t('trust.results.title'),
      description: t('trust.results.description')
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-black mb-4">
            {t('trust.title')}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('trust.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {trustElements.map((element, index) => {
            const IconComponent = element.icon;
            return (
              <Card key={index} className="bg-white border border-gray-100 text-center hover:border-primary/20 transition-colors">
                <CardHeader className="pb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <IconComponent className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-black">
                    {element.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm">
                    {element.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Trust Banner */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 text-center">
          <p className="text-lg font-semibold text-black mb-2">
            {t('trust.banner.title')}
          </p>
          <p className="text-gray-600">
            {t('trust.banner.subtitle')}
          </p>
        </div>
      </div>
    </section>
  );
};

export default TrustSection;