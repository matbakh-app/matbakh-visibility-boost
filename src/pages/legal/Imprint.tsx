
/*
 * ⚠️  Diese Datei ist FINAL und darf NUR durch den CTO geändert werden. 
 * Jede Änderung ohne CTO-Genehmigung führt zum Rollback!
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import LegalLayout from '@/layouts/LegalLayout';
import { getNamespaceForLegalPage } from '@/utils/getLegalNamespace';

const Imprint: React.FC = () => {
  // CRITICAL FIX: Prevent suspension by using safe translation access
  const { i18n } = useTranslation(['nav']);
  const namespace = getNamespaceForLegalPage(i18n.language, 'imprint');
  const { t } = useTranslation(namespace, { useSuspense: false });

  // Clean mapping of existing translation keys from legal-imprint.json
  const LEGAL_SECTIONS = [
    ['companyInfo', null], // Special handling for company info
    ['contactTitle', 'email'],
    ['responsibleTitle', 'responsible'],
    ['disclaimerTitle', 'disclaimer'],
    ['linksTitle', 'linksText'],
    ['copyrightTitle', 'copyrightText'],
  ];

  return (
    <LegalLayout titleKey="title" pageType="imprint">
      <div className="prose max-w-none space-y-6">
        {LEGAL_SECTIONS.map(([titleKey, textKey]) => (
          <section key={titleKey}>
            <h2 className="text-xl font-semibold mb-4">{t(titleKey)}</h2>
            {titleKey === 'companyInfo' ? (
              <div className="space-y-2 text-muted-foreground">
                <p>{t('company')}</p>
                <p>{t('location')}</p>
              </div>
            ) : (
              <p className="text-muted-foreground leading-relaxed">{t(textKey)}</p>
            )}
          </section>
        ))}
      </div>
    </LegalLayout>
  );
};

export default Imprint;
