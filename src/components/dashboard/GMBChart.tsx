
import React from 'react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';

// Dummy data for development
const dummyGmbData = [
  { month: 'Jan', views: 1250, clicks: 89 },
  { month: 'Feb', views: 1180, clicks: 95 },
  { month: 'Mar', views: 1420, clicks: 102 },
  { month: 'Apr', views: 1350, clicks: 87 },
  { month: 'Mai', views: 1580, clicks: 118 },
  { month: 'Jun', views: 1650, clicks: 125 },
];

const CustomLegend = () => {
  const { t } = useTranslation('dashboard');
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
      <span className="flex items-center gap-2">
        <span className="inline-block w-3 h-3 rounded bg-[#3b82f6]" />
        <span className="text-sm">{t('charts.legend.profileViews')}</span>
      </span>
      <span className="flex items-center gap-2">
        <span className="inline-block w-3 h-3 rounded bg-[#10b981]" />
        <span className="text-sm">{t('charts.legend.clicks')}</span>
      </span>
    </div>
  );
};

const GMBChart: React.FC = () => {
  const { t } = useTranslation('dashboard');
  
  const chartConfig = {
    views: {
      label: t('charts.legend.profileViews'),
    },
    clicks: {
      label: t('charts.legend.clicks'),
    },
  };

  return (
    <div className="w-full h-full flex flex-col">
      <ChartContainer config={chartConfig} className="flex-1">
        <ResponsiveContainer width="100%" height="90%">
          <BarChart 
            data={dummyGmbData} 
            margin={{ top: 16, right: 24, left: 12, bottom: 20 }}
          >
            <XAxis dataKey="month" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="views" fill="#3b82f6" name={t('charts.legend.profileViews')} />
            <Bar dataKey="clicks" fill="#10b981" name={t('charts.legend.clicks')} />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
      <CustomLegend />
    </div>
  );
};

export default GMBChart;
