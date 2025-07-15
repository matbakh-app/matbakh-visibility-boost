
import React from 'react';
import { useTranslation } from 'react-i18next';
import LegalLayout from '@/layouts/LegalLayout';
import ContactForm from '@/components/ContactForm';
import { getNamespaceForLegalPage } from '@/utils/getLegalNamespace';

const Contact: React.FC = () => {
  // CRITICAL FIX: Verwende dynamisches Namespace-Mapping wie in anderen Legal-Seiten
  const { i18n } = useTranslation();
  const namespace = getNamespaceForLegalPage(i18n.language, 'contact');
  const { t } = useTranslation(namespace);
  
  // Clean mapping of existing translation keys from legal-contact.json
  const LEGAL_SECTIONS = [
    ['contactTitle', 'contactText'],
  ];

  return (
    <LegalLayout titleKey="title" pageType="contact">
      <div className="space-y-8">
        <div className="prose max-w-none space-y-6">
          {LEGAL_SECTIONS.map(([titleKey, textKey]) => (
            <section key={titleKey}>
              <h2 className="text-xl font-semibold mb-4">{t(titleKey)}</h2>
              <div className="whitespace-pre-line text-muted-foreground">
                {t(textKey)}
              </div>
            </section>
          ))}
          
          <div className="mt-8 pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              {t('disclaimerText')}
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
