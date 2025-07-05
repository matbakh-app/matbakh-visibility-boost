
import React from 'react';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';

// Dummy data for development
const dummyGa4Data = [
  { date: '01.06', sessions: 245, users: 189 },
  { date: '02.06', sessions: 289, users: 203 },
  { date: '03.06', sessions: 267, users: 195 },
  { date: '04.06', sessions: 312, users: 234 },
  { date: '05.06', sessions: 298, users: 221 },
  { date: '06.06', sessions: 334, users: 256 },
];

const GA4Chart: React.FC = () => {
  const { t } = useTranslation('dashboard');
  
  const chartConfig = {
    sessions: {
      label: t('charts.legend.sessions'),
    },
    users: {
      label: t('charts.legend.users'),
    },
  };

  return (
    <ChartContainer config={chartConfig} className="h-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={dummyGa4Data}>
          <XAxis dataKey="date" />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Line 
            type="monotone" 
            dataKey="sessions" 
            stroke="#3b82f6" 
            strokeWidth={2}
            name={t('charts.legend.sessions')}
          />
          <Line 
            type="monotone" 
            dataKey="users" 
            stroke="#10b981" 
            strokeWidth={2}
            name={t('charts.legend.users')}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default GA4Chart;
