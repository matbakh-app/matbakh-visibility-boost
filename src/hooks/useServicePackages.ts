
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
      
      const { data, error } = await supabase
        .from('service_packages')
        .select('*')
        .eq('is_active', true)
        .in('slug', ['google-business-setup', 'profilpflege-basis', 'social-media-management', 'premium-business-paket'])
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('useServicePackages: Database error:', error);
        throw new Error(`Fehler beim Laden der Pakete: ${error.message}`);
      }
      
      if (!data || data.length === 0) {
        console.warn('useServicePackages: No packages found in database');
        return [];
      }
      
      // Defensive validation of package data
      const validatedPackages = data.filter(pkg => {
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
      
      console.log('useServicePackages: Successfully fetched packages:', validatedPackages.length);
      console.log('useServicePackages: Package data:', validatedPackages);
      
      return validatedPackages as ServicePackage[];
    },
    retry: 2,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
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

      if (error) {
        console.error('useAddonServices: Database error:', error);
        throw new Error(`Fehler beim Laden der Add-ons: ${error.message}`);
      }
      
      if (!data) {
        console.log('useAddonServices: No addon data returned');
        return [];
      }
      
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
      
      console.log('useAddonServices: Successfully fetched addons:', validatedAddons.length);
      return validatedAddons;
    },
    retry: 2,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};
