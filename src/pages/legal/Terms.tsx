
/*
 * ⚠️  Diese Datei ist FINAL und darf NUR durch den CTO geändert werden. 
 * Jede Änderung ohne CTO-Genehmigung führt zum Rollback!
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import LegalLayout from '@/layouts/LegalLayout';

const Terms: React.FC = () => {
  const { t } = useTranslation('legal-terms');

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
        
        <section>
          <h2 className="text-xl font-semibold mb-4">{t('contractTitle')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('contractText')}
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-4">{t('pricesTitle')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('pricesText')}
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-4">{t('performanceTitle')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('performanceText')}
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-4">{t('cancellationTitle')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('cancellationText')}
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-4">{t('liabilityTitle')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('liabilityText')}
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-4">{t('dataTitle')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('dataText')}
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-4">{t('finalTitle')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('finalText')}
          </p>
        </section>

        <div className="mt-8 pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            {t('lastUpdated')}
          </p>
        </div>
      </div>
    </LegalLayout>
  );
};

export default Terms;
