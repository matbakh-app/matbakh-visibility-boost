
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
      const { data, error } = await supabase
        .from('service_packages')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      return data as ServicePackage[];
    },
  });
};

export const useAddonServices = () => {
  return useQuery({
    queryKey: ['addon-services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('addon_services')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      return data;
    },
  });
};
