import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Quote } from 'lucide-react';

const TestimonialSection: React.FC = () => {
  const { t } = useTranslation('landing');

  const testimonials = [
    {
      name: "Marco Rossi",
      business: "Trattoria Bella Vista, München",
      quote: t('testimonials.marco.quote'),
      result: t('testimonials.marco.result')
    },
    {
      name: "Sarah Schmidt", 
      business: "Café Sonnenschein, Berlin",
      quote: t('testimonials.sarah.quote'),
      result: t('testimonials.sarah.result')
    },
    {
      name: "Ahmed Hassan",
      business: "Restaurant Levante, Hamburg", 
      quote: t('testimonials.ahmed.quote'),
      result: t('testimonials.ahmed.result')
    }
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-black mb-4">
            {t('testimonials.title')}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('testimonials.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <Quote className="h-8 w-8 text-primary mb-4" />
                <blockquote className="text-gray-700 mb-4 italic">
                  "{testimonial.quote}"
                </blockquote>
                <div className="border-t pt-4">
                  <p className="font-semibold text-black">{testimonial.name}</p>
                  <p className="text-sm text-gray-600">{testimonial.business}</p>
                  <p className="text-sm font-medium text-primary mt-2">{testimonial.result}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialSection;