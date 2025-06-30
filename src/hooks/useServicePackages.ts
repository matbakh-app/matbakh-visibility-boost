
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ServicePackage {
  id: string;
  name: string;
  slug: string;
  description: string;
  base_price: number;
  original_price: number | null;
  features: string[];
  is_active: boolean;
  is_recommended: boolean;
  period: string;
  min_duration_months: number;
}

export const useServicePackages = () => {
  return useQuery({
    queryKey: ['service-packages'],
    queryFn: async () => {
      console.log('useServicePackages: Starting fetch...');
      
      // Simplified query - just get all active service packages first
      const { data, error } = await supabase
        .from('service_packages')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

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
      console.log('useServicePackages: All package slugs:', data.map(pkg => pkg.slug));
      
      // Filter for specific packages we want to show on the offers page
      const targetSlugs = ['google-business-setup', 'profilpflege-basis', 'social-media-management', 'premium-business-paket'];
      const filteredData = data.filter(pkg => targetSlugs.includes(pkg.slug));
      
      console.log('useServicePackages: Filtered packages:', filteredData.length);
      console.log('useServicePackages: Filtered slugs:', filteredData.map(pkg => pkg.slug));
      
      if (filteredData.length === 0) {
        console.warn('useServicePackages: No matching packages found. Available slugs:', data.map(pkg => pkg.slug));
        console.warn('useServicePackages: Target slugs:', targetSlugs);
        return [];
      }
      
      // Defensive validation of package data
      const validatedPackages = filteredData.filter(pkg => {
        const isValid = pkg.name && 
                       pkg.slug && 
                       typeof pkg.base_price === 'number' && 
                       pkg.base_price > 0 &&
                       Array.isArray(pkg.features);
        
        if (!isValid) {
          console.warn('useServicePackages: Invalid package data:', pkg);
        }
        
        return isValid;
      }).map(pkg => ({
        ...pkg,
        features: pkg.features || [],
        original_price: pkg.original_price || null,
        min_duration_months: pkg.min_duration_months || 0
      }));
      
      console.log('useServicePackages: Successfully validated packages:', validatedPackages.length);
      console.log('useServicePackages: Final package data:', validatedPackages);
      
      return validatedPackages as ServicePackage[];
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 0, // Always fetch fresh data to debug
    gcTime: 0, // Don't cache to avoid cache issues
  });
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
