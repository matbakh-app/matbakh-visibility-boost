
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface PackageFAQProps {
  lang?: 'de' | 'en';
}

const PackageFAQ: React.FC<PackageFAQProps> = ({ lang = 'de' }) => {
  const { t } = useTranslation();

  return (
    <section className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-black mb-4">
            {t('faq.title')}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('faq.subtitle')}
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
            <AccordionItem key={index} value={`item-${index}`} className="border border-gray-200 rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold py-4 hover:no-underline">
                {t(`faq.items.${index}.question`)}
              </AccordionTrigger>
              <AccordionContent className="text-gray-700 pb-4 leading-relaxed">
                {t(`faq.items.${index}.answer`)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            {t('faq.cta.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="tel:+4989123456789" 
              className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
            >
              {t('faq.cta.phone')}
            </a>
            <a 
              href="mailto:mail@matbakh.app" 
              className="border border-black text-black px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t('faq.cta.email')}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PackageFAQ;
