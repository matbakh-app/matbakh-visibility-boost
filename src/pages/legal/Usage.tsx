
/*
 * ⚠️  Diese Datei ist FINAL und darf NUR durch den CTO geändert werden. 
 * Jede Änderung ohne CTO-Genehmigung führt zum Rollback!
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import LegalLayout from '@/layouts/LegalLayout';

const Usage: React.FC = () => {
  const { t } = useTranslation('legal-usage');

  return (
    <LegalLayout titleKey="title" pageType="usage">
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
          <h2 className="text-xl font-semibold mb-4">{t('userRightsTitle')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('userRightsText')}
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-4">{t('userObligationsTitle')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('userObligationsText')}
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-4">{t('liabilityTitle')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('liabilityText')}
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-4">{t('terminationTitle')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('terminationText')}
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-4">{t('lawTitle')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('lawText')}
          </p>
        </section>
      </div>
    </LegalLayout>
  );
};

export default Usage;
