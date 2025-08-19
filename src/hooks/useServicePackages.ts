
// src/hooks/useServicePackages.ts
// Matbakh 3.0 – updated for new service_packages / service_prices schema

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { monitoring } from "@/utils/monitoring";

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
      const endTimer = monitoring.startTimer('useServicePackages fetch');
      
      try {
        // Step 1: Fetch all service packages
        const { data: packages, error: packagesError } = await supabase
          .from("service_packages")
          .select("id, code, default_name, is_recurring, interval_months")
          .eq('is_active', true as any)
          .order('code');

        if (packagesError) {
          monitoring.error('Failed to fetch service packages', packagesError, { 
            query: 'service_packages' 
          });
          throw new Error(`Fehler beim Laden der Pakete: ${packagesError.message}`);
        }

        if (!packages || packages.length === 0) {
          monitoring.warn('No service packages found in database');
          return [];
        }

        monitoring.info('Successfully loaded service packages', { count: packages.length });

        // Step 2: Fetch all service prices
        const { data: prices, error: pricesError } = await supabase
          .from("service_prices")
          .select("package_id, normal_price_cents, promo_price_cents, promo_active")
          .order('package_id');

        if (pricesError) {
          monitoring.error('Failed to fetch service prices', pricesError, { 
            query: 'service_prices' 
          });
          throw new Error(`Fehler beim Laden der Preise: ${pricesError.message}`);
        }

        monitoring.info('Successfully loaded service prices', { count: prices?.length || 0 });

        // Step 3: Merge packages with their prices
        const mappedPackages = packages.map((pkg: any) => {
          // Find price for this package
          const priceData = prices?.find((p: any) => p.package_id === pkg.id);
          
          // Calculate prices defensively
          const normalPriceCents = (priceData as any)?.normal_price_cents || 0;
          const promoPriceCents = (priceData as any)?.promo_price_cents;
          const promoActive = (priceData as any)?.promo_active || false;
          
          // Convert cents to euros with proper formatting
          const normalPrice = normalPriceCents / 100;
          const promoPrice = promoPriceCents ? promoPriceCents / 100 : null;
          
          // Determine final pricing
          const finalPrice = (promoPrice && promoActive) ? promoPrice : normalPrice;
          const originalPrice = (promoPrice && promoActive) ? normalPrice : null;
          
          // Log pricing issues for monitoring
          if (!priceData) {
            monitoring.warn('Package missing price data', { packageCode: pkg.code });
          }
          
          return {
            id: pkg.id,
            slug: pkg.code,
            name: pkg.default_name,
            description: `Service package: ${pkg.default_name}`,
            base_price: finalPrice,
            original_price: originalPrice,
            features: getFeaturesByCode(pkg.code),
            is_active: true,
            is_recommended: pkg.code === 'profile_management_premium',
            period: pkg.is_recurring ? 'monthly' : 'one-time',
            min_duration_months: pkg.interval_months || 0,
            // Add debug info
            _debug: {
              hasPrice: !!priceData,
              normalPriceCents,
              promoPriceCents,
              promoActive
            }
          };
        });
        
        endTimer();
        monitoring.trackPackageLoad(packages.length, prices?.length || 0, performance.now());
        monitoring.info('Package mapping completed successfully', { 
          totalPackages: mappedPackages.length,
          packagesWithPrices: mappedPackages.filter(p => p.base_price > 0).length
        });
        
        return mappedPackages as ServicePackage[];
        
      } catch (error) {
        endTimer();
        monitoring.error('Critical error in useServicePackages', error as Error);
        throw error;
      }
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

// Helper function to get features by package code - REMOVED packages prefix
const getFeaturesByCode = (code: string): string[] => {
  const featureMap: Record<string, string[]> = {
    'profile_dashboard_basic': [
      'profile_dashboard_basic.features.0',
      'profile_dashboard_basic.features.1',
      'profile_dashboard_basic.features.2'
    ],
    'google_profile_setup': [
      'google_profile_setup.features.0',
      'google_profile_setup.features.1',
      'google_profile_setup.features.2',
      'google_profile_setup.features.3'
    ],
    'profile_management_classic': [
      'profile_management_classic.features.0',
      'profile_management_classic.features.1',
      'profile_management_classic.features.2',
      'profile_management_classic.features.3',
      'profile_management_classic.features.4'
    ],
    'profile_management_premium': [
      'profile_management_premium.features.0',
      'profile_management_premium.features.1',
      'profile_management_premium.features.2',
      'profile_management_premium.features.3',
      'profile_management_premium.features.4',
      'profile_management_premium.features.5'
    ],
    'meta_business_suite_setup': [
      'meta_business_suite_setup.features.0',
      'meta_business_suite_setup.features.1',
      'meta_business_suite_setup.features.2'
    ],
    'starter_kit': [
      'starter_kit.features.0',
      'starter_kit.features.1',
      'starter_kit.features.2',
      'starter_kit.features.3'
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
        .eq('is_active', true as any)
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
      const validatedAddons = data.filter((addon: any) => {
        const isValid = addon.name && 
                       addon.slug && 
                       typeof addon.price === 'number' && 
                       addon.price > 0;
        
        if (!isValid) {
          console.warn('useAddonServices: Invalid addon data:', addon);
        }
        
        return isValid;
      }).map((addon: any) => ({
        ...(addon as any),
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
