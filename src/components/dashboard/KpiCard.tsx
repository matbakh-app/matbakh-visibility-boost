
import React from 'react';
import { useKpi } from '@/hooks/useKpi';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('dashboard');
  const { data, isLoading, error } = useKpi(titleKey);

  const getCompareColor = (percentage: number) => {
    return percentage > 0 ? 'text-green-600' : 'text-red-600';
  };

  const getComparePrefix = (percentage: number) => {
    return percentage > 0 ? '+' : '';
  };

  // Use translation key if available, otherwise fallback to title prop
  const translatedTitle = t(`kpi.${titleKey}`, { defaultValue: title });
  const translatedDescription = t(`kpi.${titleKey}Desc`, { defaultValue: description });

  return (
    <article className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
      <h3 className="text-lg font-semibold mb-2">{translatedTitle}</h3>
      
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ) : error ? (
        <Alert>
          <AlertDescription>
            {t('kpi.loadError')}
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <p className="text-2xl font-bold mb-1">
            {data?.value || 'N/A'}
          </p>
          
          <p className="text-sm text-gray-500 mb-1">
            {translatedDescription}
          </p>
          
          <p className="text-sm text-gray-500 mb-3">
            {t('kpi.benchmark')}: {benchmark} 
            <span className={`ml-1 ${getCompareColor(comparePercentage)}`}>
              ({getComparePrefix(comparePercentage)}{comparePercentage}%)
            </span>
          </p>
          
          {data?.trend && (
            <p className={`text-sm mb-3 ${data.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
              {t('kpi.trend')}: {data.trend}
            </p>
          )}
          
          <a 
            href={optimizeLink} 
            className="text-blue-600 hover:underline mt-2 block text-sm font-medium"
          >
            {t('kpi.optimizeLink')}
          </a>
        </>
      )}
    </article>
  );
};

export default KpiCard;
