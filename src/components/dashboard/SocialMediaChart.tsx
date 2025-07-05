
import React from 'react';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';

// Erweiterte Dummy-Daten mit mehreren KPIs
const dummySocialData = [
  { 
    platform: 'Instagram', 
    followers: 1542, 
    likes: 920, 
    postViews: 18340, 
    comments: 77 
  },
  { 
    platform: 'Facebook', 
    followers: 756, 
    likes: 510, 
    postViews: 6100, 
    comments: 34 
  },
  { 
    platform: 'TikTok', 
    followers: 234, 
    likes: 412, 
    postViews: 12230, 
    comments: 45 
  },
];

const SocialMediaChart: React.FC = () => {
  const { t } = useTranslation('dashboard');
  
  const chartConfig = {
    followers: {
      label: t('charts.legend.followers'),
    },
    likes: {
      label: t('charts.legend.likes'),
    },
    postViews: {
      label: t('charts.legend.postViews'),
    },
    comments: {
      label: t('charts.legend.comments'),
    },
  };
  
  return (
    <ChartContainer config={chartConfig} className="h-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dummySocialData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <XAxis dataKey="platform" />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="followers" fill="#3b82f6" name={t('charts.legend.followers')} />
          <Bar dataKey="likes" fill="#10b981" name={t('charts.legend.likes')} />
          <Bar dataKey="postViews" fill="#f59e0b" name={t('charts.legend.postViews')} />
          <Bar dataKey="comments" fill="#8b5cf6" name={t('charts.legend.comments')} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default SocialMediaChart;
