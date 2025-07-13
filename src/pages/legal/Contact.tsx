
import React from 'react';
import { useTranslation } from 'react-i18next';
import LegalLayout from '@/layouts/LegalLayout';
import ContactForm from '@/components/ContactForm';

const Contact: React.FC = () => {
  const { t } = useTranslation('legal');
  const sectionKey = 'contact';
  
  return (
    <LegalLayout titleKey={`${sectionKey}.title`} pageType="contact">
      <div className="space-y-8">
        <div className="prose max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-4">{t(`${sectionKey}.contactTitle`)}</h2>
            <div className="whitespace-pre-line text-muted-foreground">
              {t(`${sectionKey}.contactText`)}
            </div>
          </section>
          <div className="mt-8 pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              {t(`${sectionKey}.disclaimerText`)}
            </p>
          </div>
        </div>
        
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-6">Contact Form</h2>
          <ContactForm />
        </div>
      </div>
    </LegalLayout>
  );
};

export default Contact;
