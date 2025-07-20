
/*
 * ⚠️  Diese Datei ist FINAL und darf NUR durch den CTO geändert werden. 
 * Jede Änderung ohne CTO-Genehmigung führt zum Rollback!
 * ⚠️  KEINE ÄNDERUNGEN OHNE EXPLIZITE ZUSTIMMUNG ERLAUBT!
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import LegalLayout from '@/layouts/LegalLayout';
import { getNamespaceForLegalPage } from '@/utils/getLegalNamespace';

const Privacy: React.FC = () => {
  // CRITICAL FIX: Prevent suspension by using safe translation access
  const { i18n } = useTranslation(['nav']);
  const namespace = getNamespaceForLegalPage(i18n.language, 'privacy');
  const { t } = useTranslation(namespace, { useSuspense: false });

  // Updated mapping of existing translation keys from legal-privacy.json
  const LEGAL_SECTIONS = [
    ['introTitle', 'introText'],
    ['controllerTitle', 'controllerText'],
    ['dataCollectionTitle', 'dataCollectionText'],
    ['purposeTitle', 'purposeText'],
    ['googleTitle', 'googleText'],
    ['metaTitle', 'metaText'],
    ['disclosureTitle', 'disclosureText'],
    ['rightsTitle', 'rightsText'],
    ['storageTitle', 'storageText'],
    ['changesTitle', 'changesText'],
  ];

  return (
    <LegalLayout titleKey="title" pageType="privacy">
      <div className="prose max-w-none space-y-6">
        {LEGAL_SECTIONS.map(([titleKey, textKey]) => (
          <section key={titleKey}>
            <h2 className="text-xl font-semibold mb-4">{t(titleKey)}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t(textKey)}
            </p>
          </section>
        ))}

        <div className="mt-8 pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            {t('lastUpdated')}
          </p>
        </div>
      </div>
    </LegalLayout>
  );
};

export default Privacy;
