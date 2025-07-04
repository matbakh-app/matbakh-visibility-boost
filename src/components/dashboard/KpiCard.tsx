
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface KpiCardProps {
  title: string;
  titleKey: string;
  description: string;
  benchmark: number | string;
  comparePercentage: number;
  optimizeLink: string;
}

const KpiCard: React.FC<KpiCardProps> = ({
  title,
  titleKey,
  description,
  benchmark,
  comparePercentage,
  optimizeLink
}) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['kpi', titleKey],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('fetch-kpi', {
        body: { name: titleKey }
      });
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: 3,
  });

  const getCompareColor = (percentage: number) => {
    return percentage > 0 ? 'text-green-600' : 'text-red-600';
  };

  const getComparePrefix = (percentage: number) => {
    return percentage > 0 ? '+' : '';
  };

  return (
    <article className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ) : error ? (
        <Alert>
          <AlertDescription>
            Daten konnten nicht geladen werden
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <p className="text-2xl font-bold mb-1">
            {data?.value || 'N/A'}
          </p>
          
          <p className="text-sm text-gray-500 mb-1">
            {description}
          </p>
          
          <p className="text-sm text-gray-500 mb-3">
            Durchschnitt: {benchmark} 
            <span className={`ml-1 ${getCompareColor(comparePercentage)}`}>
              ({getComparePrefix(comparePercentage)}{comparePercentage}%)
            </span>
          </p>
          
          <a 
            href={optimizeLink} 
            className="text-blue-600 hover:underline mt-2 block text-sm font-medium"
          >
            Zu den Optimierungsvorschlägen (Upgrade erforderlich)
          </a>
        </>
      )}
    </article>
  );
};

export default KpiCard;
