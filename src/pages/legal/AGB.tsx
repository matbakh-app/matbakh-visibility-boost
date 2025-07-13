
/*
 * ⚠️  Diese Datei ist FINAL und darf NUR durch den CTO geändert werden. 
 * Jede Änderung ohne CTO-Genehmigung führt zum Rollback!
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import LegalLayout from '@/layouts/LegalLayout';

const AGB: React.FC = () => {
  const { t } = useTranslation('legal-agb');

  return (
    <LegalLayout titleKey="title" pageType="terms">
      <div className="prose max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-4">{t('scopeTitle')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('scopeText')}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">{t('servicesTitle')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('servicesText')}
          </p>
        </section>
      </div>
    </LegalLayout>
  );
};

export default AGB;
