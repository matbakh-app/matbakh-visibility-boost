import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wrench, BarChart3, Brain } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LogoSection from '@/components/LogoSection';
import ProblemSection from '@/components/ProblemSection';
import SolutionSection from '@/components/SolutionSection';
const BusinessLanding: React.FC = () => {
  const {
    t
  } = useTranslation();
  const navigate = useNavigate();
  const services = [{
    icon: Wrench,
    title: t('services.setup.title'),
    description: t('services.setup.description')
  }, {
    icon: BarChart3,
    title: t('services.management.title'),
    description: t('services.management.description')
  }, {
    icon: Brain,
    title: t('services.analytics.title'),
    description: t('services.analytics.description')
  }];
  return <div className="min-h-screen bg-white">
      <Header />
      <LogoSection />
      
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-black mb-6">Es ist gut, dass Sie mit Ihren Gästen bereits online kommunizieren</h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">Es ist besser, wenn Ihre Gäste zuhören</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-black hover:bg-gray-800 text-white px-8 py-3" onClick={() => navigate('/angebote')}>
              Jetzt Sichtbarkeit steigern
            </Button>
            <Button variant="outline" size="lg" className="border-black text-black hover:bg-gray-50 px-8 py-3" onClick={() => navigate('/kontakt')}>
              Kostenlose Beratung
            </Button>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <ProblemSection />

      {/* Solution Section */}
      <SolutionSection />

      {/* Services Section */}
      <section id="services" className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-black mb-4">
              Das übernehmen wir für Sie
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Konzentrieren Sie sich auf Ihre Gäste - wir kümmern uns um Ihre Online-Sichtbarkeit.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {services.map((service, index) => {
            const IconComponent = service.icon;
            return <Card key={index} className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="text-center pb-4">
                    <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mx-auto mb-4">
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-xl font-semibold text-black">
                      {service.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-gray-600 leading-relaxed">
                      {service.description}
                    </p>
                  </CardContent>
                </Card>;
          })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-black">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Bereit für mehr Gäste?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            Starten Sie jetzt und sehen Sie bereits in den ersten Wochen mehr Online-Anfragen 
            und Reservierungen für Ihr Restaurant.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white hover:bg-gray-100 text-black px-8 py-3" onClick={() => navigate('/angebote')}>
              Angebote ansehen
            </Button>
            <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-black px-8 py-3" onClick={() => navigate('/kontakt')}>
              Beratung anfragen
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>;
};
export default BusinessLanding;