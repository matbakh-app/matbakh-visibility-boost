/*
 * ⚠️  KRITISCHE LEGAL-DATEI – ÄNDERUNGEN NUR DURCH CTO! ⚠️
 * 
 * Diese Datei ist nach dem 14.07.2025 FINAL und darf NICHT mehr durch:
 * - Lovable AI
 * - Automatisierte Tools 
 * - Entwickler ohne CTO-Genehmigung
 * verändert werden.
 * 
 * Auch Übersetzungsdateien (public/locales/legal.json) sind geschützt!
 * 
 * Bei Unsicherheit: CTO kontaktieren BEVOR Änderungen gemacht werden!
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import LegalLayout from '@/layouts/LegalLayout';

const Usage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <LegalLayout titleKey="legal.usage.title" pageType="usage">
      <div className="prose max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-4">{t('legal.usage.scope')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('legal.usage.scopeText')}
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-4">{t('legal.usage.services')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('legal.usage.servicesText')}
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-4">{t('legal.usage.userRights')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('legal.usage.userRightsText')}
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-4">{t('legal.usage.userObligations')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('legal.usage.userObligationsText')}
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-4">{t('legal.usage.liability')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('legal.usage.liabilityText')}
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-4">{t('legal.usage.termination')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('legal.usage.terminationText')}
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-4">{t('legal.usage.law')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('legal.usage.lawText')}
          </p>
        </section>
      </div>
    </LegalLayout>
  );
};

export default Usage;