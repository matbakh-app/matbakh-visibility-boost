import React, { useEffect, useState, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import { Globe } from "lucide-react";
import { getNamespaceForLegalPage, loadLegalNamespace, type LegalPageType } from "@/utils/getLegalNamespace";

type SimpleLegalLayoutProps = {
  titleKey: string;
  children: React.ReactNode;
  pageType: LegalPageType;
};

const SimpleLegalContent: React.FC<SimpleLegalLayoutProps> = ({ titleKey, children, pageType }) => {
  const { i18n } = useTranslation();
  const [isNamespaceLoaded, setIsNamespaceLoaded] = useState(false);

  const namespace = getNamespaceForLegalPage(i18n.language, pageType);
  const legalTranslation = useTranslation(namespace, { useSuspense: false });
  const { t: tLegal } = legalTranslation;

  useEffect(() => {
    const loadNamespace = async () => {
      setIsNamespaceLoaded(false);
      
      try {
        await loadLegalNamespace(i18n, namespace);
        setIsNamespaceLoaded(true);
      } catch (error) {
        console.error('Failed to load legal namespace:', error);
        setIsNamespaceLoaded(true);
      }
    };

    loadNamespace();
  }, [i18n.language, namespace, i18n]);

  if (!isNamespaceLoaded) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  const title = tLegal(titleKey, "Legal");
  const description = tLegal('intro', "Rechtliche Hinweise und Datenschutzinformationen zu matbakh.app.");

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
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">{title}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Globe className="h-4 w-4" />
              <span>{tLegal('lastUpdated', "Stand: 2025")}</span>
            </div>
          </div>
          
          <div className="bg-card rounded-lg border border-border p-6 sm:p-8 shadow-sm">
            {children}
          </div>
        </div>
      </div>
    </>
  );
};

const SimpleLegalLayout: React.FC<SimpleLegalLayoutProps> = (props) => {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <SimpleLegalContent {...props} />
    </Suspense>
  );
};

export default SimpleLegalLayout;