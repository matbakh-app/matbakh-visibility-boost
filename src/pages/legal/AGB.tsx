
/*
 * ⚠️  Diese Datei ist FINAL und darf NUR durch den CTO geändert werden. 
 * Jede Änderung ohne CTO-Genehmigung führt zum Rollback!
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import LegalLayout from '@/layouts/LegalLayout';

const AGB: React.FC = () => {
  const { t } = useTranslation('legal');
  const sectionKey = 'agb'; // Always use German key for German page

  return (
    <LegalLayout titleKey={`${sectionKey}.title`} pageType="terms">
      <div className="prose max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-4">{t(`${sectionKey}.scopeTitle`)}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t(`${sectionKey}.scopeText`)}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">{t(`${sectionKey}.servicesTitle`)}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t(`${sectionKey}.servicesText`)}
          </p>
        </section>
      </div>
    </LegalLayout>
  );
};

export default AGB;
