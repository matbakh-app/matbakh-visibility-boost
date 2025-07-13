
import React from 'react';
import { useTranslation } from 'react-i18next';
import LegalLayout from '@/layouts/LegalLayout';
import ContactForm from '@/components/ContactForm';

const Kontakt: React.FC = () => {
  const { t } = useTranslation('legal-kontakt');
  
  return (
    <LegalLayout titleKey="title" pageType="contact">
      <div className="space-y-8">
        <div className="prose max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-4">{t('contactTitle')}</h2>
            <div className="whitespace-pre-line text-muted-foreground">
              {t('contactText')}
            </div>
          </section>
          <div className="mt-8 pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              {t('disclaimerText')}
            </p>
          </div>
        </div>
        
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-6">Kontaktformular</h2>
          <ContactForm />
        </div>
      </div>
    </LegalLayout>
  );
};

export default Kontakt;
