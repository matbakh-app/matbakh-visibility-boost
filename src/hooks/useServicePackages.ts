
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
          is_recommended: pkg.code === 'profile_management_premium', // Premium is now recommended
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

// Helper function to get features by package code - now uses translation keys
const getFeaturesByCode = (code: string): string[] => {
  const featureMap: Record<string, string[]> = {
    'profile_dashboard_basic': [
      'packages.profile_dashboard_basic.features.0',
      'packages.profile_dashboard_basic.features.1',
      'packages.profile_dashboard_basic.features.2'
    ],
    'google_profile_setup': [
      'packages.google_profile_setup.features.0',
      'packages.google_profile_setup.features.1',
      'packages.google_profile_setup.features.2',
      'packages.google_profile_setup.features.3'
    ],
    'profile_management_classic': [
      'packages.profile_management_classic.features.0',
      'packages.profile_management_classic.features.1',
      'packages.profile_management_classic.features.2',
      'packages.profile_management_classic.features.3',
      'packages.profile_management_classic.features.4'
    ],
    'profile_management_premium': [
      'packages.profile_management_premium.features.0',
      'packages.profile_management_premium.features.1',
      'packages.profile_management_premium.features.2',
      'packages.profile_management_premium.features.3',
      'packages.profile_management_premium.features.4',
      'packages.profile_management_premium.features.5'
    ],
    'meta_business_suite_setup': [
      'packages.meta_business_suite_setup.features.0',
      'packages.meta_business_suite_setup.features.1',
      'packages.meta_business_suite_setup.features.2'
    ],
    'starter_kit': [
      'packages.starter_kit.features.0',
      'packages.starter_kit.features.1',
      'packages.starter_kit.features.2',
      'packages.starter_kit.features.3'
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
