
import React from 'react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
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

const CustomLegend = () => {
  const { t } = useTranslation('dashboard');
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
      <span className="flex items-center gap-2">
        <span className="inline-block w-3 h-3 rounded bg-[#3b82f6]" />
        <span className="text-sm">{t('charts.legend.sessions')}</span>
      </span>
      <span className="flex items-center gap-2">
        <span className="inline-block w-3 h-3 rounded bg-[#10b981]" />
        <span className="text-sm">{t('charts.legend.users')}</span>
      </span>
    </div>
  );
};

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
    <div className="w-full h-full flex flex-col">
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
      <CustomLegend />
    </div>
  );
};

export default GA4Chart;
