
/*
 * ⚠️  Diese Datei ist FINAL und darf NUR durch den CTO geändert werden. 
 * Jede Änderung ohne CTO-Genehmigung führt zum Rollback!
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import LegalLayout from '@/layouts/LegalLayout';

const Datenschutz: React.FC = () => {
  const { t } = useTranslation('legal-datenschutz');

  // Clean mapping of existing translation keys from legal-datenschutz.json
  const LEGAL_SECTIONS = [
    ['controllerTitle', 'controller'],
    ['collectionTitle', 'collectionText'],
    ['serverLogsTitle', 'serverLogsText'],
    ['googleTitle', 'googleInfo'],
    ['cookiesTitle', 'cookiesText'],
    ['rightsTitle', 'rightsText'],
    ['contactTitle', 'contactText'],
  ];

  return (
    <LegalLayout titleKey="title" pageType="privacy">
      <div className="prose max-w-none space-y-6">
        <section>
          <p className="text-muted-foreground leading-relaxed mb-6">
            {t('intro')}
          </p>
        </section>

        {LEGAL_SECTIONS.map(([titleKey, textKey]) => (
          <section key={titleKey}>
            <h2 className="text-xl font-semibold mb-4">{t(titleKey)}</h2>
            {titleKey === 'controllerTitle' ? (
              <div className="whitespace-pre-line text-muted-foreground">
                {t(textKey)}
              </div>
            ) : titleKey === 'googleTitle' ? (
              <>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  {t(textKey)}
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
              </>
            ) : (
              <p className="text-muted-foreground leading-relaxed">
                {t(textKey)}
              </p>
            )}
          </section>
        ))}

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
