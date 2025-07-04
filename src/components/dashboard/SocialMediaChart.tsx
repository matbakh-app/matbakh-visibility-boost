
import React from 'react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';

// Dummy data for development
const dummySocialData = [
  { platform: 'Instagram', followers: 1542, engagement: 3.8 },
  { platform: 'Facebook', followers: 756, engagement: 2.1 },
  { platform: 'TikTok', followers: 234, engagement: 5.2 },
];

const chartConfig = {
  followers: {
    label: "Follower",
  },
  engagement: {
    label: "Engagement Rate",
  },
};

const SocialMediaChart: React.FC = () => {
  const { t } = useTranslation('dashboard');
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <h3 className="text-lg font-semibold mb-4">{t('charts.socialTitle')}</h3>
      <ChartContainer config={chartConfig} className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dummySocialData}>
            <XAxis dataKey="platform" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="followers" fill="#3b82f6" name="Follower" />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
};

export default SocialMediaChart;
