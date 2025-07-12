
/*
 * ⚠️  Diese Datei ist FINAL und darf NUR durch den CTO geändert werden. 
 * Jede Änderung ohne CTO-Genehmigung führt zum Rollback!
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import LegalLayout from '@/layouts/LegalLayout';

const Impressum: React.FC = () => {
  const { t } = useTranslation('legal');
  const sectionKey = 'impressum'; // Always use German key for German page

  return (
    <LegalLayout titleKey={`${sectionKey}.title`} pageType="imprint">
      <div className="prose max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-4">{t(`${sectionKey}.companyInfo`)}</h2>
          <div className="space-y-2 text-muted-foreground">
            <p>{t(`${sectionKey}.company`)}</p>
            <p>{t(`${sectionKey}.location`)}</p>
          </div>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-4">{t(`${sectionKey}.contactTitle`)}</h2>
          <p className="text-muted-foreground">{t(`${sectionKey}.email`)}</p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-4">{t(`${sectionKey}.responsibleTitle`)}</h2>
          <p className="text-muted-foreground">{t(`${sectionKey}.responsible`)}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">{t(`${sectionKey}.disclaimerTitle`)}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t(`${sectionKey}.disclaimer`)}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">{t(`${sectionKey}.linksTitle`)}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t(`${sectionKey}.linksText`)}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">{t(`${sectionKey}.copyrightTitle`)}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t(`${sectionKey}.copyrightText`)}
          </p>
        </section>
      </div>
    </LegalLayout>
  );
};

export default Impressum;
