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
  

  return (
    <LegalLayout titleKey="legal.terms.title" pageType="terms">
      <div className="prose max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-4">{t('legal.terms.scopeTitle')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('legal.terms.scopeText')}
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-4">{t('legal.terms.servicesTitle')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('legal.terms.servicesText')}
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-4">{t('legal.terms.contractTitle')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('legal.terms.contractText')}
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-4">{t('legal.terms.pricesTitle')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('legal.terms.pricesText')}
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-4">{t('legal.terms.performanceTitle')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('legal.terms.performanceText')}
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-4">{t('legal.terms.cancellationTitle')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('legal.terms.cancellationText')}
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-4">{t('legal.terms.liabilityTitle')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('legal.terms.liabilityText')}
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-4">{t('legal.terms.dataTitle')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('legal.terms.dataText')}
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-4">{t('legal.terms.finalTitle')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('legal.terms.finalText')}
          </p>
        </section>

        <div className="mt-8 pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            {t('legal.terms.lastUpdated')}
          </p>
        </div>
      </div>
    </LegalLayout>
  );
};

export default Terms;