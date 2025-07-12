/*
 * ⚠️  Diese Datei ist FINAL und darf NUR durch den CTO geändert werden. 
 * Jede Änderung ohne CTO-Genehmigung führt zum Rollback!
 *
 * ⚠️  KRITISCHE LEGAL-DATEI – ÄNDERUNGEN NUR DURCH CTO! ⚠️
 * 
 * Diese Datei ist nach dem 14.07.2025 FINAL und darf NICHT mehr durch:
 * - Lovable AI
 * - Automatisierte Tools 
 * - Entwickler ohne CTO-Genehmigung
 * verändert werden.
 * 
 * Auch Übersetzungsdateien (public/locales/legal.json) sind geschützt!
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import LegalLayout from '@/layouts/LegalLayout';

const Usage: React.FC = () => {
  const { t } = useTranslation('legal');
  const sectionKey = 'usage'; // Always use English key for English page
  

  return (
    <LegalLayout titleKey={`${sectionKey}.title`} pageType="usage">
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
        
        <section>
          <h2 className="text-xl font-semibold mb-4">{t(`${sectionKey}.userRightsTitle`)}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t(`${sectionKey}.userRightsText`)}
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-4">{t(`${sectionKey}.userObligationsTitle`)}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t(`${sectionKey}.userObligationsText`)}
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-4">{t(`${sectionKey}.liabilityTitle`)}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t(`${sectionKey}.liabilityText`)}
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-4">{t(`${sectionKey}.terminationTitle`)}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t(`${sectionKey}.terminationText`)}
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-4">{t(`${sectionKey}.lawTitle`)}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t(`${sectionKey}.lawText`)}
          </p>
        </section>
      </div>
    </LegalLayout>
  );
};

export default Usage;