
import React from 'react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';
import SocialMediaLegend from './legends/SocialMediaLegend';

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
  const { t, i18n } = useTranslation('dashboard');
  
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
    <div className="w-full h-full flex flex-col" key={i18n.language}>
      <ChartContainer config={chartConfig} className="flex-1">
        <ResponsiveContainer width="100%" height="90%">
          <BarChart 
            data={dummySocialData} 
            margin={{ top: 16, right: 24, left: 12, bottom: 20 }}
          >
            <XAxis dataKey="platform" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="followers" fill="#3b82f6" name="followers" />
            <Bar dataKey="likes" fill="#10b981" name="likes" />
            <Bar dataKey="postViews" fill="#f59e0b" name="postViews" />
            <Bar dataKey="comments" fill="#8b5cf6" name="comments" />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
      <SocialMediaLegend lang={i18n.language} />
    </div>
  );
};

export default SocialMediaChart;
