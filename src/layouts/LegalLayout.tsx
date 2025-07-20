
/*
 * ⚠️  Diese Datei ist FINAL und darf NUR durch den CTO geändert werden. 
 * Jede Änderung ohne CTO-Genehmigung führt zum Rollback!
 */

import React, { useEffect, useState, Suspense } from "react";
import { useTranslation } from "react-i18next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LanguageToggle from "@/components/header/LanguageToggle";
import { Helmet } from "react-helmet-async";
import { Globe } from "lucide-react";
import { getNamespaceForLegalPage, loadLegalNamespace, type LegalPageType } from "@/utils/getLegalNamespace";

type LegalLayoutProps = {
  titleKey: string; // z.B. "title" (wird vom jeweiligen Namespace geholt)
  children: React.ReactNode;
  pageType: LegalPageType;
};

const LegalContent: React.FC<LegalLayoutProps> = ({ titleKey, children, pageType }) => {
  const { t, i18n } = useTranslation(['nav']);
  const [isNamespaceLoaded, setIsNamespaceLoaded] = useState(false);

  // CRITICAL FIX: Dynamisches Namespace-Loading basierend auf Sprache
  const namespace = getNamespaceForLegalPage(i18n.language, pageType);
  
  // Only access translation after namespace is loaded to prevent suspension
  const { t: tLegal } = useTranslation(isNamespaceLoaded ? namespace : 'nav');

  // Dynamisches Laden des Legal-Namespace mit React 18 Unterstützung
  useEffect(() => {
    const loadNamespace = async () => {
      setIsNamespaceLoaded(false);
      
      try {
        await loadLegalNamespace(i18n, namespace);
        setIsNamespaceLoaded(true);
      } catch (error) {
        console.error('Failed to load legal namespace:', error);
        // Fallback: Setze trotzdem auf "loaded" um die Seite anzuzeigen
        setIsNamespaceLoaded(true);
      }
    };

    loadNamespace();
  }, [i18n.language, namespace, i18n]);

  // Loading state während Namespace geladen wird
  if (!isNamespaceLoaded) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading legal information...</p>
        </div>
      </div>
    );
  }
  
  // Meta für SEO - dynamisch basierend auf pageType
  const title = tLegal(titleKey, "Legal");
  
  const description = tLegal('intro', "Rechtliche Hinweise und Datenschutzinformationen zu matbakh.app.");

  // Canonical URL basierend auf Sprache und Seitentyp
  const getCanonicalUrl = () => {
    const baseUrl = "https://matbakh.app";
    const currentLang = i18n.language?.startsWith('en') ? 'en' : 'de';
    
    const routeMap = {
      de: {
        privacy: '/datenschutz',
        imprint: '/impressum',
        terms: '/agb', 
        usage: '/nutzung',
        contact: '/kontakt'
      },
      en: {
        privacy: '/privacy',
        imprint: '/imprint',
        terms: '/terms',
        usage: '/usage', 
        contact: '/contact'
      }
    };
    
    return `${baseUrl}${routeMap[currentLang]?.[pageType] || routeMap.de[pageType]}`;
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
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-card rounded-lg border border-border p-6 sm:p-8 shadow-sm">
            {children}
          </div>
        </div>
      </main>
    </>
  );
};

const LegalLayout: React.FC<LegalLayoutProps> = (props) => {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      
      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      }>
        <LegalContent {...props} />
      </Suspense>
      
      <Footer />
    </div>
  );
};

export default LegalLayout;
