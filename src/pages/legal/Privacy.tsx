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
  const { t, i18n } = useTranslation('legal');
  const sectionKey = i18n.language === 'de' ? 'datenschutz' : 'privacy';
  

  return (
    <LegalLayout titleKey={`${sectionKey}.title`} pageType="privacy">
      <div className="prose max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-4">{t(`${sectionKey}.controllerTitle`)}</h2>
          <div className="whitespace-pre-line text-muted-foreground">
            {t(`${sectionKey}.controller`)}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">{t(`${sectionKey}.collectionTitle`)}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t(`${sectionKey}.intro`)}
          </p>
          <p className="text-muted-foreground leading-relaxed mt-4">
            {t(`${sectionKey}.collectionText`)}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">{t(`${sectionKey}.serverLogsTitle`)}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t(`${sectionKey}.serverLogsText`)}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">{t(`${sectionKey}.googleTitle`)}</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            {t(`${sectionKey}.googleInfo`)}
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            {(t(`${sectionKey}.dataList`, { returnObjects: true }) as string[]).map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
          <p className="text-muted-foreground leading-relaxed mt-4">
            {t(`${sectionKey}.dataUsage`)}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">{t(`${sectionKey}.cookiesTitle`)}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t(`${sectionKey}.cookiesText`)}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">{t(`${sectionKey}.rightsTitle`)}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t(`${sectionKey}.rightsText`)}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">{t(`${sectionKey}.contactTitle`)}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t(`${sectionKey}.contactText`)}
          </p>
        </section>

        <div className="mt-8 pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            {t(`${sectionKey}.disclaimerText`)}
          </p>
        </div>
      </div>
    </LegalLayout>
  );
};

export default Privacy;