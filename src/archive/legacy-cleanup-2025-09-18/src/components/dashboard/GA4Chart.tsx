
import React from 'react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';
import GA4Legend from './legends/GA4Legend';

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
  const { t, i18n } = useTranslation('dashboard');
  
  const chartConfig = {
    sessions: {
      label: t('charts.legend.sessions'),
    },
    users: {
      label: t('charts.legend.users'),
    },
  };

  return (
    <div className="w-full h-full flex flex-col" key={i18n.language}>
      <ChartContainer config={chartConfig} className="flex-1">
        <ResponsiveContainer width="100%" height="90%">
          <LineChart 
            data={dummyGa4Data} 
            margin={{ top: 16, right: 24, left: 12, bottom: 20 }}
          >
            <XAxis dataKey="date" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line 
              type="monotone" 
              dataKey="sessions" 
              stroke="#3b82f6" 
              strokeWidth={2}
              name="sessions"
            />
            <Line 
              type="monotone" 
              dataKey="users" 
              stroke="#10b981" 
              strokeWidth={2}
              name="users"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
      <GA4Legend lang={i18n.language} />
    </div>
  );
};

export default GA4Chart;
