
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
      console.log('useServicePackages: Fetching service packages...');
      
      const { data, error } = await supabase
        .from('service_packages')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) {
        console.error('useServicePackages: Error fetching packages:', error);
        throw error;
      }
      
      console.log('useServicePackages: Fetched packages:', data);
      return data as ServicePackage[];
    },
    retry: 3,
    retryDelay: 1000,
  });
};

export const useAddonServices = () => {
  return useQuery({
    queryKey: ['addon-services'],
    queryFn: async () => {
      console.log('useAddonServices: Fetching addon services...');
      
      const { data, error } = await supabase
        .from('addon_services')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) {
        console.error('useAddonServices: Error fetching addons:', error);
        throw error;
      }
      
      console.log('useAddonServices: Fetched addons:', data);
      return data;
    },
    retry: 3,
    retryDelay: 1000,
  });
};
