
// src/hooks/useServicePackages.ts
// Matbakh 3.0 – updated for new service_packages / service_prices schema

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Raw shape returned by Supabase join query
 */
interface RawServicePackage {
  id: string;
  code: string;
  default_name: string;
  is_recurring: boolean;
  interval_months: number | null;
  service_prices: {
    normal_price_cents: number;
    promo_price_cents: number | null;
    promo_active: boolean;
  }[];
}

/**
 * Normalised shape used in UI
 */
export interface ServicePackage {
  id: string;
  slug: string; // alias for code – maintained for backwards‑compat
  name: string;
  description: string;
  base_price: number;
  original_price: number | null;
  features: string[];
  is_active: boolean;
  is_recommended: boolean;
  period: string;
  min_duration_months: number;
}

/**
 * Fetches service packages with joined pricing and maps to UI‑friendly shape
 */
export const useServicePackages = () =>
  useQuery({
    queryKey: ["service-packages"],
    queryFn: async () => {
      console.log('useServicePackages: Starting fetch...');
      
      const { data, error } = await supabase
        .from("service_packages")
        .select(`
          id, 
          code, 
          default_name, 
          is_recurring, 
          interval_months, 
          service_prices(
            normal_price_cents, 
            promo_price_cents, 
            promo_active
          )
        `);

      console.log('useServicePackages: Raw database response:', { data, error });

      if (error) {
        console.error('useServicePackages: Database error:', error);
        throw new Error(`Fehler beim Laden der Pakete: ${error.message}`);
      }
      
      if (!data) {
        console.warn('useServicePackages: No data returned from database');
        return [];
      }

      console.log('useServicePackages: Total records from database:', data.length);
      
      // Map the new schema to the expected UI format
      const mappedPackages = data.map((pkg) => {
        const price = pkg.service_prices?.[0];
        const basePrice = (price?.normal_price_cents ?? 0) / 100;
        const promoPrice = price?.promo_price_cents ? price.promo_price_cents / 100 : null;
        
        return {
          id: pkg.id,
          slug: pkg.code, // keep old property name for existing components
          name: pkg.default_name,
          description: `Service package: ${pkg.default_name}`,
          base_price: promoPrice && price?.promo_active ? promoPrice : basePrice,
          original_price: promoPrice && price?.promo_active ? basePrice : null,
          features: getFeaturesByCode(pkg.code),
          is_active: true,
          is_recommended: pkg.code === 'premium-business-paket',
          period: pkg.is_recurring ? 'monthly' : 'one-time',
          min_duration_months: pkg.interval_months || 0
        };
      });
      
      console.log('useServicePackages: Successfully mapped packages:', mappedPackages.length);
      console.log('useServicePackages: Final package data:', mappedPackages);
      
      return mappedPackages as ServicePackage[];
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

// Helper function to get features by package code
const getFeaturesByCode = (code: string): string[] => {
  const featureMap: Record<string, string[]> = {
    'profile_dashboard_basic': [
      'Einfach angebunden: Google, Facebook & Instagram im Griff',
      'Ihre wichtigsten Zahlen (KPIs) – immer aktuell ausgewertet',
      'Monatlicher Erfolgsbericht per Mail – kein Aufwand für Sie'
    ],
    'google_profile_setup': [
      'Sofort startklar: Ihr Google Business Profil komplett eingerichtet',
      'Besser gefunden werden – SEO für lokale Gäste',
      'Kategorien, Attribute & Fotos optimal gepflegt',
      'Alle Öffnungszeiten und Kontaktdaten korrekt integriert'
    ],
    'profile_management_classic': [
      'Alle Basic-Vorteile plus:',
      'Ihr persönlicher Business Agent – mit KI-Empfehlungen',
      'Analytics rund um die Uhr, automatisch für Sie aktualisiert',
      'Speisekarten schnell online, Angebote per Klick promoten',
      'Monatlicher Erfolgsbericht – einfach & verständlich'
    ],
    'profile_management_premium': [
      'Alle Classic-Features plus:',
      'Noch leistungsstärkere KI-Empfehlungen für Ihr Wachstum',
      'Intelligenter Content-Generator – immer frische Ideen für Posts',
      'Benchmark Ihrer Speisekarten im Vergleich zum Wettbewerb',
      'Komplette Social Media Strategie & 6-Wochen-Contentplan',
      'Exklusive Aktionen je nach Event & Stadt – automatisch für Sie'
    ],
    'meta_business_suite_setup': [
      'Einheitliche Kanal-Erstellung & Konfiguration',
      'Individuelle Design-Vorlagen für beide Plattformen',
      'Zielgruppen-Recherche & Setup'
    ],
    'starter_kit': [
      'Business-Profil Setup in Google Console & Meta Business Suite mit proaktivem Management inklusive',
      '6 Monate Rundum-Service ohne Extrakosten',
      'Social Media Management auf Wunsch-Kanal',
      'Ihr persönlicher Account Manager für alle Fragen'
    ]
  };
  
  return featureMap[code] || [];
};

export const useAddonServices = () => {
  return useQuery({
    queryKey: ['addon-services'],
    queryFn: async () => {
      console.log('useAddonServices: Starting fetch...');
      
      const { data, error } = await supabase
        .from('addon_services')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      console.log('useAddonServices: Raw database response:', { data, error });

      if (error) {
        console.error('useAddonServices: Database error:', error);
        throw new Error(`Fehler beim Laden der Add-ons: ${error.message}`);
      }
      
      if (!data) {
        console.log('useAddonServices: No addon data returned');
        return [];
      }
      
      console.log('useAddonServices: Total addon records:', data.length);
      
      // Defensive validation of addon data
      const validatedAddons = data.filter(addon => {
        const isValid = addon.name && 
                       addon.slug && 
                       typeof addon.price === 'number' && 
                       addon.price > 0;
        
        if (!isValid) {
          console.warn('useAddonServices: Invalid addon data:', addon);
        }
        
        return isValid;
      }).map(addon => ({
        ...addon,
        features: addon.features || [],
        original_price: addon.original_price || null,
        compatible_packages: addon.compatible_packages || []
      }));
      
      console.log('useAddonServices: Successfully validated addons:', validatedAddons.length);
      return validatedAddons;
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 0, // Always fetch fresh data to debug
    gcTime: 0, // Don't cache to avoid cache issues
  });
};
