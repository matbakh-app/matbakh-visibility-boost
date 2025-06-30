
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
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('useServicePackages: Database error:', error);
        throw new Error(`Fehler beim Laden der Pakete: ${error.message}`);
      }
      
      if (!data || data.length === 0) {
        console.warn('useServicePackages: No packages found in database');
        return [];
      }
      
      console.log('useServicePackages: Successfully fetched packages:', data.length);
      console.log('useServicePackages: Package data:', data);
      
      return data as ServicePackage[];
    },
    retry: 2,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
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
      
      console.log('useAddonServices: Successfully fetched addons:', data?.length || 0);
      return data || [];
    },
    retry: 2,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
  });
};
