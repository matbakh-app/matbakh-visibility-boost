
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Users, TrendingUp, Shield } from 'lucide-react';

const TrustElements: React.FC = () => {
  const { t } = useTranslation();

  const stats = [
    {
      icon: Users,
      number: '150+',
      label: 'Zufriedene Restaurant-Partner',
      description: 'Gastronomen vertrauen unserer Expertise'
    },
    {
      icon: TrendingUp,
      number: '300%',
      label: 'Durchschnittliche Sichtbarkeit-Steigerung',
      description: 'Mehr Online-Anfragen in den ersten 3 Monaten'
    },
    {
      icon: Star,
      number: '4.9/5',
      label: 'Kundenbewertung',
      description: 'Basierend auf über 80 Bewertungen'
    },
    {
      icon: Shield,
      number: '100%',
      label: 'Transparenz-Garantie',
      description: 'Keine versteckten Kosten oder Überraschungen'
    }
  ];

  const testimonials = [
    {
      text: "Seit wir mit Matbakh arbeiten, haben sich unsere Online-Reservierungen verdreifacht. Das Team kümmert sich um alles - wir können uns aufs Kochen konzentrieren.",
      author: "Maria Rossi",
      restaurant: "Osteria Bella Vista, München",
      rating: 5
    },
    {
      text: "Endlich versteht jemand, wie beschäftigt wir als Gastronomen sind. Die Automatisierung unserer Google-Profile war genau das, was wir brauchten.",
      author: "Thomas Weber",
      restaurant: "Weber's Braustüberl, Augsburg", 
      rating: 5
    },
    {
      text: "Die monatlichen Berichte zeigen uns schwarz auf weiß, wie sich unsere Sichtbarkeit verbessert. Das motiviert das ganze Team.",
      author: "Sarah Kim",
      restaurant: "Seoul Kitchen, Berlin",
      rating: 5
    }
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        {/* Statistics */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-black mb-4">
            Vertrauen durch Ergebnisse
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-12">
            Über 150 Gastronomen vertrauen bereits auf unsere Expertise
          </p>
          
          <div className="grid md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <Card key={index} className="bg-white border-0 shadow-sm">
                  <CardContent className="text-center p-6">
                    <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mx-auto mb-4">
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-3xl font-bold text-black mb-2">{stat.number}</div>
                    <div className="font-semibold text-gray-900 mb-2">{stat.label}</div>
                    <p className="text-sm text-gray-600">{stat.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Testimonials */}
        <div className="text-center mb-12">
          <h3 className="text-2xl font-bold text-black mb-8">
            Was unsere Partner sagen
          </h3>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="bg-white border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">"{testimonial.text}"</p>
                <div className="border-t pt-4">
                  <div className="font-semibold text-black">{testimonial.author}</div>
                  <div className="text-sm text-gray-600">{testimonial.restaurant}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Certification/Awards placeholder */}
        <div className="text-center mt-16">
          <div className="flex justify-center items-center gap-8 opacity-60">
            <div className="text-sm text-gray-500">Zertifiziert durch</div>
            <div className="text-sm font-semibold text-gray-700">Google Partner Program</div>
            <div className="text-sm font-semibold text-gray-700">Facebook Business Partner</div>
            <div className="text-sm text-gray-500">seit 2020</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustElements;
