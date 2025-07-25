
/*
 * ⚠️  Diese Datei ist FINAL und darf NUR durch den CTO geändert werden. 
 * Jede Änderung ohne CTO-Genehmigung führt zum Rollback!
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import SimpleLegalLayout from '@/layouts/SimpleLegalLayout';
import ContactForm from '@/components/ContactForm';

const Kontakt: React.FC = () => {
  const { t } = useTranslation('legal-kontakt');
  
  return (
    <SimpleLegalLayout titleKey="title" pageType="contact">
      <div className="prose max-w-none space-y-8">
        <section>
          <p className="text-muted-foreground leading-relaxed">
            {t('intro', 'Kontaktieren Sie uns für Fragen zu unseren Services und Angeboten.')}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">
            {t('contactTitle', 'Kontaktinformationen')}
          </h2>
          <div className="whitespace-pre-line text-muted-foreground">
            {t('contactText', 'matbakh-app\nMünchen, Deutschland\nE-Mail: mail(at)matbakh(dot)app\nAntwortzeit: Innerhalb von 24 Stunden')}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">
            {t('supportTitle', 'Support')}
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('supportText', 'Für technische Fragen und Support wenden Sie sich bitte an unsere E-Mail-Adresse.')}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">
            {t('businessTitle', 'Geschäftsanfragen')}
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('businessText', 'Für Partnerschaften und Geschäftsanfragen nutzen Sie bitte ebenfalls unsere E-Mail-Adresse.')}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Kontaktformular</h2>
          <ContactForm />
        </section>

        <div className="mt-8 pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            {t('disclaimerText', 'Stand: Juli 2025')}
          </p>
        </div>
      </div>
    </SimpleLegalLayout>
  );
};

export default Kontakt;
