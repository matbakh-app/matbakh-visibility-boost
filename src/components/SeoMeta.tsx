import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

interface SeoMetaProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  namespace?: string;
}

export const SeoMeta: React.FC<SeoMetaProps> = ({
  title,
  description,
  canonical,
  ogImage = '/og-image.jpg',
  namespace = 'common'
}) => {
  const { t, i18n } = useTranslation(namespace);
  
  const finalTitle = title || t('meta.defaultTitle', 'matbakh - Sichtbarkeit für Gastronomie');
  const finalDescription = description || t('meta.defaultDescription', 'Automatisierte digitale Lösungen für Restaurants');
  
  // SSR-safe URL handling
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
  const currentUrl = canonical || `https://matbakh.app${currentPath}`;
  const locale = i18n.language === 'de' ? 'de_DE' : 'en_US';

  return (
    <Helmet>
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      <link rel="canonical" href={currentUrl} />
      
      {/* Open Graph */}
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:image" content={`https://matbakh.app${ogImage}`} />
      <meta property="og:locale" content={locale} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={`https://matbakh.app${ogImage}`} />
      
      {/* Language alternates */}
      <link rel="alternate" hrefLang="de" href={`https://matbakh.app${currentPath}`} />
      <link rel="alternate" hrefLang="en" href={`https://matbakh.app${currentPath}`} />
      
      {/* Additional SEO */}
      <meta name="robots" content="index,follow" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
    </Helmet>
  );
};