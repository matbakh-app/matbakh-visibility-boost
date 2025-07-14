
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Settings, BarChart3, Headphones } from 'lucide-react';

interface ProcessOverviewProps {
  language?: string;
}

const ProcessOverview: React.FC<ProcessOverviewProps> = ({ language = 'de' }) => {
  const { t } = useTranslation('pricing');

  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-black mb-4">
            {t('process.title')}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('process.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-8">
          {[0, 1, 2, 3].map((index) => {
            const icons = [Calendar, Settings, BarChart3, Headphones];
            const IconComponent = icons[index];
            
            return (
              <div key={index} className="relative">
                {index < 3 && (
                  <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-gray-200 z-0" 
                       style={{ transform: 'translateX(-50%)' }} />
                )}
                
                <Card className="bg-white border border-gray-200 relative z-10 hover:shadow-md transition-shadow">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
                      <IconComponent className="h-8 w-8 text-white" />
                    </div>
                    
                    <div className="text-sm bg-gray-100 rounded-full px-3 py-1 inline-block mb-3 text-gray-600">
                      {t(`process.steps.${index}.duration`)}
                    </div>
                    
                    <h3 className="text-xl font-bold text-black mb-3">
                      {t(`process.steps.${index}.title`)}
                    </h3>
                    
                    <p className="text-gray-600 mb-4 leading-relaxed">
                      {t(`process.steps.${index}.description`)}
                    </p>
                    
                    <div className="text-left">
                      <div className="text-sm font-semibold text-gray-900 mb-2">{t('process.included')}:</div>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {[0, 1, 2, 3].map((detailIndex) => (
                          <li key={detailIndex} className="flex items-start">
                            <span className="w-1.5 h-1.5 bg-black rounded-full mt-2 mr-2 flex-shrink-0"></span>
                            {t(`process.steps.${index}.details.${detailIndex}`)}
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
              {t('process.cta.title')}
            </h3>
            <p className="text-gray-600 mb-6">
              {t('process.cta.description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="tel:+4989123456789" 
                className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors font-semibold"
              >
                {t('process.cta.button1')}
              </a>
              <a 
                href="/kontakt" 
                className="border border-black text-black px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
              >
                {t('process.cta.button2')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProcessOverview;
