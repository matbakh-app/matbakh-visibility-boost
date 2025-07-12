/*
 * ⚠️  Diese Datei ist FINAL und darf NUR durch den CTO geändert werden. 
 * Jede Änderung ohne CTO-Genehmigung führt zum Rollback!
 *
 * ⚠️  KRITISCHE LEGAL-LAYOUT-DATEI – ÄNDERUNGEN NUR DURCH CTO! ⚠️
 * 
 * Diese Datei ist nach dem 14.07.2025 FINAL und darf NICHT mehr durch:
 * - Lovable AI
 * - Automatisierte Tools 
 * - Entwickler ohne CTO-Genehmigung
 * verändert werden.
 * 
 * Auch Übersetzungsdateien (public/locales/legal.json) sind geschützt!
 * 
 * Alle Legal-Seiten MÜSSEN dieses Layout verwenden!
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
  titleKey: string; // z.B. "legal.datenschutz.title"
  children: React.ReactNode;
  pageType: 'privacy' | 'imprint' | 'terms' | 'usage';
};

const LegalLayout: React.FC<LegalLayoutProps> = ({ titleKey, children, pageType }) => {
  const { t, i18n } = useTranslation(['legal', 'nav']);

  // Meta für SEO - dynamisch basierend auf pageType
  const title = t(`legal:${titleKey}`, "Legal");
  const description = t(`legal:${pageType}.intro`, "Rechtliche Hinweise und Datenschutzinformationen zu matbakh.app.");

  // Canonical URL basierend auf Sprache und Seitentyp
  const getCanonicalUrl = () => {
    const baseUrl = "https://matbakh.app";
    const routeMap = {
      privacy: i18n.language === "en" ? "/privacy" : "/datenschutz",
      imprint: i18n.language === "en" ? "/imprint" : "/impressum", 
      terms: i18n.language === "en" ? "/terms" : "/agb",
      usage: i18n.language === "en" ? "/usage" : "/nutzung"
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
                <span>{t(`legal:${pageType}.lastUpdated`, "Stand: 2025")}</span>
              </div>
            </div>
            
            {/* Language Switcher explizit im Banner */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {t("nav:language", "Sprache")}:
              </span>
              <LanguageToggle />
            </div>
          </div>
          
          {/* Legal Navigation Quicklinks */}
          <nav className="flex flex-wrap gap-4 text-sm mt-4 pt-4 border-t border-border">
            <Link to={i18n.language === "en" ? "/privacy" : "/datenschutz"} className="hover:text-primary transition-colors">
              {t("nav:privacy")}
            </Link>
            <span className="text-muted-foreground">|</span>
            <Link to={i18n.language === "en" ? "/terms" : "/agb"} className="hover:text-primary transition-colors">
              {t("nav:terms")}
            </Link>
            <span className="text-muted-foreground">|</span>
            <Link to={i18n.language === "en" ? "/imprint" : "/impressum"} className="hover:text-primary transition-colors">
              {t("nav:imprint")}
            </Link>
            <span className="text-muted-foreground">|</span>
            <Link to={i18n.language === "en" ? "/usage" : "/nutzung"} className="hover:text-primary transition-colors">
              {t("nav:usage")}
            </Link>
          </nav>
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