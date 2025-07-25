
import React from 'react';
import { useTranslation } from 'react-i18next';
import SimpleLegalLayout from '@/layouts/SimpleLegalLayout';
import ContactForm from '@/components/ContactForm';

const Contact: React.FC = () => {
  const { t } = useTranslation('legal-contact');
  
  return (
    <SimpleLegalLayout titleKey="title" pageType="contact">
      <div className="space-y-8">
        <div className="prose max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-4">
              {t('contactInfo.title', 'Contact Information')}
            </h2>
            <div className="space-y-2 text-muted-foreground">
              <p>{t('contactInfo.company', 'BaSSco (Bavarian Software Solution)')}</p>
              <p>{t('contactInfo.address', 'Munich, Germany')}</p>
              <p>{t('contactInfo.email', 'mail(at)matbakh(dot)app')}</p>
              <p>{t('contactInfo.phone', 'Available on request')}</p>
            </div>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-4">
              {t('support.title', 'Support')}
            </h2>
            <p className="text-muted-foreground">
              {t('support.description', 'For technical support or urgent matters, please contact us directly.')}
            </p>
            <p className="text-muted-foreground">
              {t('support.response', 'We typically respond within 24 hours during business days.')}
            </p>
          </section>
        </div>
        
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-6">
            {t('form.title', 'Send us a message')}
          </h2>
          <ContactForm />
        </div>
      </div>
    </SimpleLegalLayout>
  );
};

export default Contact;
