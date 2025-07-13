
/*
 * ⚠️  Diese Datei ist FINAL und darf NUR durch den CTO geändert werden. 
 * Jede Änderung ohne CTO-Genehmigung führt zum Rollback!
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import LegalLayout from '@/layouts/LegalLayout';

const Datenschutz: React.FC = () => {
  const { t } = useTranslation('legal-datenschutz');

  return (
    <LegalLayout titleKey="title" pageType="privacy">
      <div className="prose max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-4">{t('controllerTitle')}</h2>
          <div className="whitespace-pre-line text-muted-foreground">
            {t('controller')}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">{t('collectionTitle')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('intro')}
          </p>
          <p className="text-muted-foreground leading-relaxed mt-4">
            {t('collectionText')}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">{t('serverLogsTitle')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('serverLogsText')}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">{t('googleTitle')}</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            {t('googleInfo')}
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            {(() => {
              const dataList = t('dataList', { returnObjects: true });
              if (Array.isArray(dataList)) {
                return dataList.map((item, index) => (
                  <li key={index}>{item}</li>
                ));
              } else {
                return <li className="text-red-500">Error: Translation data is not an array</li>;
              }
            })()}
          </ul>
          <p className="text-muted-foreground leading-relaxed mt-4">
            {t('dataUsage')}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">{t('cookiesTitle')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('cookiesText')}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">{t('rightsTitle')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('rightsText')}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">{t('contactTitle')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('contactText')}
          </p>
        </section>

        <div className="mt-8 pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            {t('disclaimerText')}
          </p>
        </div>
      </div>
    </LegalLayout>
  );
};

export default Datenschutz;
