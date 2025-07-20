
/*
 * ⚠️  Diese Datei ist FINAL und darf NUR durch den CTO geändert werden. 
 * Jede Änderung ohne CTO-Genehmigung führt zum Rollback!
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import LegalLayout from '@/layouts/LegalLayout';
import { getNamespaceForLegalPage } from '@/utils/getLegalNamespace';

const Datenschutz: React.FC = () => {
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
          <h2 className="text-xl font-semibold mb-4">Einführung</h2>
          <p className="text-muted-foreground leading-relaxed">
            Wir nehmen den Schutz Ihrer persönlichen Daten sehr ernst und behandeln Ihre personenbezogenen Daten vertraulich und entsprechend der gesetzlichen Datenschutzvorschriften.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Datenerhebung und -verwendung</h2>
          <p className="text-muted-foreground leading-relaxed">
            Diese Datenschutzerklärung informiert Sie darüber, welche Daten wir erheben, wie wir sie verwenden und welche Rechte Sie haben.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Ihre Rechte</h2>
          <p className="text-muted-foreground leading-relaxed">
            Sie haben das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung Ihrer personenbezogenen Daten.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Kontakt</h2>
          <p className="text-muted-foreground leading-relaxed">
            Bei Fragen zum Datenschutz wenden Sie sich an: mail(at)matbakh(dot)app
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Google-Dienste</h2>
          <p className="text-muted-foreground leading-relaxed">
            Diese Website nutzt Google-Dienste für Authentifizierung und Business-Profil-Management.
          </p>
        </section>

        <div className="mt-8 pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Stand: Juli 2025
          </p>
        </div>
      </div>
    </LegalLayout>
  );
};

export default Datenschutz;
