
/*
 * ⚠️  Diese Datei ist FINAL und darf NUR durch den CTO geändert werden. 
 * Jede Änderung ohne CTO-Genehmigung führt zum Rollback!
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import LegalLayout from '@/layouts/LegalLayout';
import ContactForm from '@/components/ContactForm';

const Kontakt: React.FC = () => {
  const { t } = useTranslation('common');
  
  return (
    <LegalLayout titleKey="contact.title" pageType="contact">
      <div className="prose max-w-none space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">
            {t('contact.contactInfoTitle', 'Kontaktinformationen')}
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('contact.contactInfoText', 'Für Fragen zu unseren Services und Angeboten erreichen Sie uns über folgende Wege:')}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">
            {t('contact.supportTitle', 'Support')}
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('contact.supportText', 'Für technische Fragen und Support wenden Sie sich bitte an unsere E-Mail-Adresse.')}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">
            {t('contact.businessTitle', 'Geschäftsanfragen')}
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('contact.businessText', 'Für Partnerschaften und Geschäftsanfragen nutzen Sie bitte ebenfalls unsere E-Mail-Adresse.')}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">
            {t('contact.formTitle', 'Kontaktformular')}
          </h2>
          <ContactForm />
        </section>

        <div className="mt-8 pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            {t('contact.lastUpdated', 'Zuletzt aktualisiert: Januar 2025')}
          </p>
        </div>
      </div>
    </LegalLayout>
  );
};

export default Kontakt;
