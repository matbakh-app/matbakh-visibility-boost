
import React from 'react';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';

// Dummy data for development
const dummySocialData = [
  { platform: 'Instagram', followers: 1542, engagement: 3.8 },
  { platform: 'Facebook', followers: 756, engagement: 2.1 },
  { platform: 'TikTok', followers: 234, engagement: 5.2 },
];

const SocialMediaChart: React.FC = () => {
  const { t } = useTranslation('dashboard');
  
  const chartConfig = {
    followers: {
      label: t('charts.legend.followers'),
    },
    engagement: {
      label: t('charts.engagement'),
    },
  };
  
  return (
    <ChartContainer config={chartConfig} className="h-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dummySocialData}>
          <XAxis dataKey="platform" />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="followers" fill="#3b82f6" name={t('charts.legend.followers')} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default SocialMediaChart;
