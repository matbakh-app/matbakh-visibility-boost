
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Users, TrendingUp, Shield } from 'lucide-react';

interface TrustElementsProps {
  language?: string;
}

const TrustElements: React.FC<TrustElementsProps> = ({ language = 'de' }) => {
  const { t } = useTranslation('trust');

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-black mb-4">
            {t('title')}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-12">
            {t('subtitle')}
          </p>
          
          <div className="grid md:grid-cols-4 gap-8">
             <Card className="bg-white border-0 shadow-sm">
               <CardContent className="text-center p-6">
                 <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mx-auto mb-4">
                   <Users className="h-6 w-6 text-white" />
                 </div>
                <div className="text-3xl font-bold text-black mb-2">{t('stats.clients.number')}</div>
                <div className="font-semibold text-gray-900 mb-2">{t('stats.clients.label')}</div>
                <p className="text-sm text-gray-600">{t('stats.clients.description')}</p>
              </CardContent>
            </Card>

             <Card className="bg-white border-0 shadow-sm">
               <CardContent className="text-center p-6">
                 <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mx-auto mb-4">
                   <TrendingUp className="h-6 w-6 text-white" />
                 </div>
                <div className="text-3xl font-bold text-black mb-2">{t('stats.visibility.number')}</div>
                <div className="font-semibold text-gray-900 mb-2">{t('stats.visibility.label')}</div>
                <p className="text-sm text-gray-600">{t('stats.visibility.description')}</p>
              </CardContent>
            </Card>

             <Card className="bg-white border-0 shadow-sm">
               <CardContent className="text-center p-6">
                 <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mx-auto mb-4">
                   <Star className="h-6 w-6 text-white" />
                 </div>
                <div className="text-3xl font-bold text-black mb-2">{t('stats.dashboard.number')}</div>
                <div className="font-semibold text-gray-900 mb-2">{t('stats.dashboard.label')}</div>
                <p className="text-sm text-gray-600">{t('stats.dashboard.description')}</p>
              </CardContent>
            </Card>

             <Card className="bg-white border-0 shadow-sm">
               <CardContent className="text-center p-6">
                 <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mx-auto mb-4">
                   <Shield className="h-6 w-6 text-white" />
                 </div>
                <div className="text-3xl font-bold text-black mb-2">{t('stats.guarantee.number')}</div>
                <div className="font-semibold text-gray-900 mb-2">{t('stats.guarantee.label')}</div>
                <p className="text-sm text-gray-600">{t('stats.guarantee.description')}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="text-center mb-12">
          <h3 className="text-2xl font-bold text-black mb-8">
            {t('testimonials.title')}
          </h3>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[0, 1, 2].map((index) => (
            <Card key={index} className="bg-white border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">"{t(`testimonials.items.${index}.text`)}"</p>
                <div className="border-t pt-4">
                  <div className="font-semibold text-black">{t(`testimonials.items.${index}.author`)}</div>
                  <div className="text-sm text-gray-600">{t(`testimonials.items.${index}.restaurant`)}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-16">
          <div className="flex justify-center items-center gap-8 opacity-60">
            <div className="text-sm text-gray-500">{t('certifications.text')}</div>
            <div className="text-sm font-semibold text-gray-700">{t('certifications.google')}</div>
            <div className="text-sm font-semibold text-gray-700">{t('certifications.facebook')}</div>
            <div className="text-sm text-gray-500">{t('certifications.since')}</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustElements;
