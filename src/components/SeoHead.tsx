import React from "react";
import { Helmet } from "react-helmet-async";

type SeoHeadProps = {
  title: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  jsonLd?: object;
};

export const SeoHead = ({
  title,
  description = "Matbakh – Sichtbarkeit für Gastronomie, automatisiert.",
  canonical = "https://matbakh.app",
  ogImage = "https://matbakh.app/og-image.jpg",
  jsonLd,
}: SeoHeadProps) => {
  return (
    <Helmet>
      {/* Grundlegende Meta-Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Strukturierte Daten (optional) */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
};