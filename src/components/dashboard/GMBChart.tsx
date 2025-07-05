
import React from 'react';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
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
    <ChartContainer config={chartConfig} className="h-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dummyGmbData}>
          <XAxis dataKey="month" />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="views" fill="#3b82f6" name={t('charts.legend.profileViews')} />
          <Bar dataKey="clicks" fill="#10b981" name={t('charts.legend.clicks')} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default GMBChart;
