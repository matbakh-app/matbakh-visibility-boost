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

const Terms: React.FC = () => {
  const { t } = useTranslation('legal');
  const sectionKey = 'terms'; // Always use English key for English page
  

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
        
        <section>
          <h2 className="text-xl font-semibold mb-4">{t(`${sectionKey}.contractTitle`)}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t(`${sectionKey}.contractText`)}
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-4">{t(`${sectionKey}.pricesTitle`)}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t(`${sectionKey}.pricesText`)}
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-4">{t(`${sectionKey}.performanceTitle`)}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t(`${sectionKey}.performanceText`)}
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-4">{t(`${sectionKey}.cancellationTitle`)}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t(`${sectionKey}.cancellationText`)}
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-4">{t(`${sectionKey}.liabilityTitle`)}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t(`${sectionKey}.liabilityText`)}
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-4">{t(`${sectionKey}.dataTitle`)}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t(`${sectionKey}.dataText`)}
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-4">{t(`${sectionKey}.finalTitle`)}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t(`${sectionKey}.finalText`)}
          </p>
        </section>

        <div className="mt-8 pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            {t(`${sectionKey}.lastUpdated`)}
          </p>
        </div>
      </div>
    </LegalLayout>
  );
};

export default Terms;