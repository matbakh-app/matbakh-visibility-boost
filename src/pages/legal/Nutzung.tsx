
/*
 * ⚠️  Diese Datei ist FINAL und darf NUR durch den CTO geändert werden. 
 * Jede Änderung ohne CTO-Genehmigung führt zum Rollback!
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import LegalLayout from '@/layouts/LegalLayout';
import { getNamespaceForLegalPage } from '@/utils/getLegalNamespace';

const Nutzung: React.FC = () => {
  // CRITICAL FIX: Verwende dynamisches Namespace-Mapping wie in anderen Legal-Seiten
  const { i18n } = useTranslation();
  const namespace = getNamespaceForLegalPage(i18n.language, 'usage');
  const { t } = useTranslation(namespace);

  // Clean mapping of existing translation keys from legal-nutzung.json
  const LEGAL_SECTIONS = [
    ['scopeTitle', 'scopeText'],
    ['servicesTitle', 'servicesText'],
    ['userRightsTitle', 'userRightsText'],
    ['userObligationsTitle', 'userObligationsText'],
    ['liabilityTitle', 'liabilityText'],
    ['terminationTitle', 'terminationText'],
    ['lawTitle', 'lawText'],
  ];

  return (
    <LegalLayout titleKey="title" pageType="usage">
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

export default Nutzung;
