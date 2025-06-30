
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle, Users, Settings, BarChart3, MessageSquare, Star, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const ServicesPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const coreServices = [
    {
      icon: Settings,
      title: t('services.setup.coreTitle'),
      description: t('services.setup.coreDescription'),
      features: t('services.setup.features', { returnObjects: true }) as string[],
      color: 'bg-blue-50 border-blue-200',
      iconColor: 'bg-blue-500'
    },
    {
      icon: BarChart3,
      title: t('services.management.title'),
      description: t('services.management.coreDescription'),
      features: t('services.management.features', { returnObjects: true }) as string[],
      color: 'bg-green-50 border-green-200',
      iconColor: 'bg-green-500'
    },
    {
      icon: MessageSquare,
      title: t('services.analytics.coreTitle'),
      description: t('services.analytics.coreDescription'),
      features: t('services.analytics.features', { returnObjects: true }) as string[],
      color: 'bg-purple-50 border-purple-200',
      iconColor: 'bg-purple-500'
    }
  ];

  const additionalServices = [
    {
      icon: Star,
      title: t('services.additional.reviews.title'),
      description: t('services.additional.reviews.description'),
      color: 'bg-yellow-50 border-yellow-200',
      iconColor: 'bg-yellow-500'
    },
    {
      icon: Users,
      title: t('services.additional.audience.title'),
      description: t('services.additional.audience.description'),
      color: 'bg-indigo-50 border-indigo-200',
      iconColor: 'bg-indigo-500'
    },
    {
      icon: Zap,
      title: t('services.additional.automation.title'),
      description: t('services.additional.automation.description'),
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
            {t('services.pageTitle')}
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            {t('services.pageSubtitle')}
          </p>
        </div>
      </section>

      {/* Core Services Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-black mb-4">
              {t('services.coreTitle')}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('services.coreSubtitle')}
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
              {t('services.additionalTitle')}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('services.additionalSubtitle')}
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
            {t('services.ctaTitle')}
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            {t('services.ctaSubtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-black hover:bg-gray-800 text-white px-8 py-3" onClick={() => navigate('/kontakt')}>
              {t('services.ctaButton1')}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" className="border-black text-black hover:bg-gray-50 px-8 py-3" onClick={() => navigate('/angebote')}>
              {t('services.ctaButton2')}
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ServicesPage;
