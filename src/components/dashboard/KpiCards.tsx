
import React from 'react';
import { useTranslation } from 'react-i18next';

interface KpiData {
  key: string;
  value: string | number;
  trend: number;
}

const KpiCards: React.FC = () => {
  const { t } = useTranslation('dashboard');

  // Mock-Daten - später über Hooks/API ersetzen
  const kpis: KpiData[] = [
    {
      key: 'impressions',
      value: 1234,
      trend: 23,
    },
    {
      key: 'sessions',
      value: 2340,
      trend: 7,
    },
    {
      key: 'conversions',
      value: 34,
      trend: 25,
    },
    {
      key: 'ctr',
      value: '4.2%',
      trend: -1.2,
    },
  ];

  const getTrendText = (trend: number) => {
    return trend >= 0
      ? t('kpi.trendUp', { value: Math.abs(trend) })
      : t('kpi.trendDown', { value: Math.abs(trend) });
  };

  const getTrendColor = (trend: number) => {
    return trend >= 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map(kpi => (
        <div key={kpi.key} className="rounded-xl bg-white shadow p-5 flex flex-col items-center">
          <div className="text-muted-foreground text-sm mb-1 text-center">
            {t(`kpi.${kpi.key}`)}
          </div>
          <div className="text-3xl font-extrabold mb-1">
            {kpi.value}
          </div>
          <div className={`text-sm ${getTrendColor(kpi.trend)}`}>
            {getTrendText(kpi.trend)}
          </div>
        </div>
      ))}
    </div>
  );
};

export default KpiCards;
