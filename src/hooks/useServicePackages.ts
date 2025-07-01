
// src/hooks/useServicePackages.ts
// Matbakh 3.0 – updated for new service_packages / service_prices schema

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://uheksobnyedarrpgxhju.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoZWtzb2JueWVkYXJycGd4aGp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMDk0NDUsImV4cCI6MjA2NTg4NTQ0NX0.dlbs4P3ZgXByNj7H1_k99YcOok9WmqgLZ1NtjONJYVs"
);

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
    'google-business-setup': [
      'Vollständige Google Business Profil-Erstellung',
      'SEO-Optimierung für lokale Suche',
      'Kategorien und Attribute einrichten',
      'Öffnungszeiten und Kontaktdaten pflegen'
    ],
    'profilpflege-basis': [
      '4 monatliche Updates Ihrer Daten',
      'Neue Speisekarten hochladen',
      'Angebote und Aktionen erstellen',
      'Monatlicher Erfolgsbericht'
    ],
    'social-media-management': [
      'Einheitliches Design für wiederkehrende Posts',
      '1 Post pro Tag (30 Posts/Monat)',
      'Content-Vorabprüfung durch Sie',
      'Performance-Tracking und Analytics'
    ],
    'premium-business-paket': [
      'Google Business Setup inklusive',
      '6 Monate Profilpflege inklusive',
      '1 Social Media Kanal für 6 Monate',
      'Persönlicher Account Manager'
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
