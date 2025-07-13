
/*
 * ⚠️  Diese Datei ist FINAL und darf NUR durch den CTO geändert werden. 
 * Jede Änderung ohne CTO-Genehmigung führt zum Rollback!
 */

import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LanguageToggle from "@/components/header/LanguageToggle";
import { Helmet } from "react-helmet-async";
import { Globe } from "lucide-react";

type LegalLayoutProps = {
  titleKey: string; // z.B. "title" (wird vom jeweiligen Namespace geholt)
  children: React.ReactNode;
  pageType: 'privacy' | 'imprint' | 'terms' | 'usage' | 'contact';
};

const LegalLayout: React.FC<LegalLayoutProps> = ({ titleKey, children, pageType }) => {
  const { t, i18n } = useTranslation(['nav']);

  // Bestimme den korrekten Namespace basierend auf Sprache und pageType
  const getNamespace = () => {
    const namespaceMap = {
      privacy: i18n.language === 'de' ? 'legal-datenschutz' : 'legal-privacy',
      imprint: i18n.language === 'de' ? 'legal-impressum' : 'legal-imprint',
      terms: i18n.language === 'de' ? 'legal-agb' : 'legal-terms',
      usage: i18n.language === 'de' ? 'legal-nutzung' : 'legal-usage',
      contact: i18n.language === 'de' ? 'legal-kontakt' : 'legal-contact'
    };
    return namespaceMap[pageType] || 'legal-impressum';
  };

  const namespace = getNamespace();
  const { t: tLegal } = useTranslation(namespace);
  
  // Meta für SEO - dynamisch basierend auf pageType
  const title = tLegal(titleKey, "Legal");
  
  const description = tLegal('intro', "Rechtliche Hinweise und Datenschutzinformationen zu matbakh.app.");

  // Canonical URL basierend auf Sprache und Seitentyp
  const getCanonicalUrl = () => {
    const baseUrl = "https://matbakh.app";
    const routeMap = {
      privacy: i18n.language === "en" ? "/privacy" : "/datenschutz",
      imprint: i18n.language === "en" ? "/imprint" : "/impressum", 
      terms: i18n.language === "en" ? "/terms" : "/agb",
      usage: i18n.language === "en" ? "/usage" : "/nutzung",
      contact: i18n.language === "en" ? "/contact" : "/kontakt"
    };
    return `${baseUrl}${routeMap[pageType]}`;
  };

  // Structured Data für Organization
  const structuredData = {
    "@context": "http://schema.org",
    "@type": "Organization",
    "url": "https://matbakh.app",
    "name": "matbakh.app",
    "contactPoint": [{
      "@type": "ContactPoint",
      "email": "mail(at)matbakh(dot)app",
      "contactType": "customer support"
    }]
  };

  return (
    <>
      <Helmet>
        <title>{title} | matbakh.app</title>
        <meta name="description" content={description} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={getCanonicalUrl()} />
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>
      
      <Header />
      
      {/* Legal Page Banner mit Language Switcher */}
      <section className="py-8 bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-2">{title}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Globe className="h-4 w-4" />
                <span>{tLegal('lastUpdated', "Stand: 2025")}</span>
              </div>
            </div>
            
            {/* Language Switcher explizit im Banner */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {t("language", "Sprache")}:
              </span>
              <LanguageToggle />
            </div>
          </div>
        </div>
      </section>
      
      {/* Content Area */}
      <main className="min-h-[50vh] py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-card rounded-lg border border-border p-6 sm:p-8 shadow-sm">
            {children}
          </div>
        </div>
      </main>
      
      <Footer />
    </>
  );
};

export default LegalLayout;
