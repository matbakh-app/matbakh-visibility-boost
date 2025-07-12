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

const Privacy: React.FC = () => {
  const { t } = useTranslation('legal');
  

  return (
    <LegalLayout titleKey="privacy.title" pageType="privacy">
      <div className="prose max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-4">{t('privacy.controllerTitle')}</h2>
          <div className="whitespace-pre-line text-muted-foreground">
            {t('privacy.controller')}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">{t('privacy.collectionTitle')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('privacy.intro')}
          </p>
          <p className="text-muted-foreground leading-relaxed mt-4">
            {t('privacy.collectionText')}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">{t('privacy.serverLogsTitle')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('privacy.serverLogsText')}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">{t('privacy.googleTitle')}</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            {t('privacy.googleInfo')}
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            {(t('privacy.dataList', { returnObjects: true }) as string[]).map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
          <p className="text-muted-foreground leading-relaxed mt-4">
            {t('privacy.dataUsage')}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">{t('privacy.cookiesTitle')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('privacy.cookiesText')}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">{t('privacy.rightsTitle')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('privacy.rightsText')}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">{t('privacy.contactTitle')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('privacy.contactText')}
          </p>
        </section>

        <div className="mt-8 pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            {t('privacy.disclaimerText')}
          </p>
        </div>
      </div>
    </LegalLayout>
  );
};

export default Privacy;