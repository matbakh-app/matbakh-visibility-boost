
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useSyncGmb() {
  return useQuery({
    queryKey: ['sync-gmb'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('sync-gmb');
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: 3,
  });
}
