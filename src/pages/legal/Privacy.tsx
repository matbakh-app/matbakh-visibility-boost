
/*
 * ⚠️  Diese Datei ist FINAL und darf NUR durch den CTO geändert werden. 
 * Jede Änderung ohne CTO-Genehmigung führt zum Rollback!
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import LegalLayout from '@/layouts/LegalLayout';
import { getNamespaceForLegalPage } from '@/utils/getLegalNamespace';

const Privacy: React.FC = () => {
  // Use safe translation access that doesn't cause suspension
  const { i18n } = useTranslation(['nav']); // Load nav first as it's always available
  const namespace = getNamespaceForLegalPage(i18n.language, 'privacy');
  
  // Don't try to access the legal namespace until LegalLayout handles the loading
  const { t } = useTranslation('nav'); // Use nav translations as fallback

  // Content will be populated by LegalLayout which handles translations properly
  return (
    <LegalLayout titleKey="title" pageType="privacy">
      <div className="prose max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-4">Privacy at a Glance</h2>
          <p className="text-muted-foreground leading-relaxed">
            The following notes provide a simple overview of what happens to your personal data when you visit our website.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Data Collection on Our Website</h2>
          <p className="text-muted-foreground leading-relaxed">
            Data processing on this website is carried out by the website operator.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Your Rights</h2>
          <p className="text-muted-foreground leading-relaxed">
            You have the right to receive information about the origin, recipient and purpose of your stored personal data free of charge at any time.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Responsible Body</h2>
          <p className="text-muted-foreground leading-relaxed">
            The responsible body for data processing on this website is: matbakh-app, Munich
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Google Services</h2>
          <p className="text-muted-foreground leading-relaxed">
            This website uses Google services. By using it, you agree to data processing by Google.
          </p>
        </section>

        <div className="mt-8 pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Status: July 2025
          </p>
        </div>
      </div>
    </LegalLayout>
  );
};

export default Privacy;
