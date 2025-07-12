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

const Imprint: React.FC = () => {
  const { t } = useTranslation('legal');
  

  return (
    <LegalLayout titleKey="legal.imprint.title" pageType="imprint">
      <div className="prose max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-4">{t('legal.imprint.companyInfo')}</h2>
          <div className="space-y-2 text-muted-foreground">
            <p><strong>{t('nav.contact')}</strong></p>
            <p>{t('legal.imprint.company')}</p>
            <p>{t('legal.imprint.location')}</p>
          </div>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-4">{t('legal.imprint.contactTitle')}</h2>
          <p className="text-muted-foreground">{t('legal.imprint.email')}</p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-4">{t('legal.imprint.responsibleTitle')}</h2>
          <p className="text-muted-foreground">{t('legal.imprint.responsible')}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">{t('legal.imprint.disclaimerTitle')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('legal.imprint.disclaimer')}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">{t('legal.imprint.linksTitle')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('legal.imprint.linksText')}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">{t('legal.imprint.copyrightTitle')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('legal.imprint.copyrightText')}
          </p>
        </section>
      </div>
    </LegalLayout>
  );
};

export default Imprint;