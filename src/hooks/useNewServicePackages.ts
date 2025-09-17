
/**
 * @deprecated Moved to unused/ - Service packages hook not currently integrated
 * @todo Reactivate when pricing UI is implemented
 * @migration Consider migrating from Supabase to AWS RDS when reactivating
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface NewServicePackage {
  id: string;
  code: string;
  default_name: string;
  is_recurring: boolean;
  interval_months: number | null;
  created_at: string;
  prices: ServicePrice[];
}

export interface ServicePrice {
  id: string;
  package_id: string;
  currency: string;
  normal_price_cents: number;
  promo_price_cents: number | null;
  promo_active: boolean;
  valid_from: string;
  valid_to: string | null;
}

export const useNewServicePackages = () => {
  return useQuery({
    queryKey: ['new-service-packages'],
    queryFn: async () => {
      console.log('useNewServicePackages: Starting fetch...');

      const { data, error } = await supabase
        .from('service_packages')
        .select(`
          *,
          prices:service_prices(*)
        `)
        .order('created_at', { ascending: true });

      console.log('useNewServicePackages: Raw database response:', { data, error });

      if (error) {
        console.error('useNewServicePackages: Database error:', error);
        throw new Error(`Fehler beim Laden der neuen Pakete: ${error.message}`);
      }

      if (!data) {
        console.warn('useNewServicePackages: No data returned from database');
        return [];
      }

      console.log('useNewServicePackages: Total records from database:', data.length);

      // Transform the data to ensure prices is always an array
      const transformedData = data.map(pkg => ({
        ...(pkg as any),
        prices: Array.isArray((pkg as any).prices) ? (pkg as any).prices : ((pkg as any).prices ? [(pkg as any).prices] : [])
      }));

      return transformedData as NewServicePackage[];
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

export const useServicePrices = (packageId: string) => {
  return useQuery({
    queryKey: ['service-prices', packageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_prices')
        .select('*')
        .eq('package_id', packageId as any)
        .order('valid_from', { ascending: false });

      if (error) {
        throw new Error(`Fehler beim Laden der Preise: ${error.message}`);
      }

      return (data as any) as ServicePrice[];
    },
    enabled: !!packageId,
  });
};
