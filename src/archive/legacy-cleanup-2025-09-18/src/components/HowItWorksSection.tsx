import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, ArrowRight } from 'lucide-react';

const HowItWorksSection: React.FC = () => {
  const { t } = useTranslation('landing');

  const steps = [
    {
      number: "1",
      title: t('howItWorks.step1.title'),
      description: t('howItWorks.step1.description'),
      duration: t('howItWorks.step1.duration')
    },
    {
      number: "2", 
      title: t('howItWorks.step2.title'),
      description: t('howItWorks.step2.description'),
      duration: t('howItWorks.step2.duration')
    },
    {
      number: "3",
      title: t('howItWorks.step3.title'), 
      description: t('howItWorks.step3.description'),
      duration: t('howItWorks.step3.duration')
    },
    {
      number: "4",
      title: t('howItWorks.step4.title'),
      description: t('howItWorks.step4.description'),
      duration: t('howItWorks.step4.duration')
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-black mb-4">
            {t('howItWorks.title')}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('howItWorks.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <Card className="bg-white border border-gray-100 hover:border-primary/30 transition-colors h-full">
                <CardHeader className="text-center pb-4">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white font-bold text-lg">{step.number}</span>
                  </div>
                  <CardTitle className="text-lg font-semibold text-black">
                    {step.title}
                  </CardTitle>
                  <p className="text-sm text-primary font-medium">
                    {step.duration}
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-center">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
              
              {/* Arrow between steps */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                  <ArrowRight className="h-6 w-6 text-gray-400" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-12 text-center">
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center justify-center gap-2 mb-4">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <p className="font-semibold text-black">{t('howItWorks.guarantee')}</p>
            </div>
            <p className="text-gray-600">
              {t('howItWorks.guaranteeDescription')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;