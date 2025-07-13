
/*
 * ⚠️  Diese Datei ist FINAL und darf NUR durch den CTO geändert werden. 
 * Jede Änderung ohne CTO-Genehmigung führt zum Rollback!
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import LegalLayout from '@/layouts/LegalLayout';

const Impressum: React.FC = () => {
  const { t } = useTranslation('legal-impressum');

  return (
    <LegalLayout titleKey="title" pageType="imprint">
      <div className="prose max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-4">{t('companyInfo')}</h2>
          <div className="space-y-2 text-muted-foreground">
            <p>{t('company')}</p>
            <p>{t('location')}</p>
          </div>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-4">{t('contactTitle')}</h2>
          <p className="text-muted-foreground">{t('email')}</p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-4">{t('responsibleTitle')}</h2>
          <p className="text-muted-foreground">{t('responsible')}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">{t('disclaimerTitle')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('disclaimer')}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">{t('linksTitle')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('linksText')}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">{t('copyrightTitle')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('copyrightText')}
          </p>
        </section>
      </div>
    </LegalLayout>
  );
};

export default Impressum;
