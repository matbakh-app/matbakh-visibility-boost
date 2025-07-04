
import React from 'react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';

// Dummy data for development
const dummyGa4Data = [
  { date: '01.06', sessions: 245, users: 189 },
  { date: '02.06', sessions: 289, users: 203 },
  { date: '03.06', sessions: 267, users: 195 },
  { date: '04.06', sessions: 312, users: 234 },
  { date: '05.06', sessions: 298, users: 221 },
  { date: '06.06', sessions: 334, users: 256 },
];

const chartConfig = {
  sessions: {
    label: "Sitzungen",
  },
  users: {
    label: "Nutzer",
  },
};

const GA4Chart: React.FC = () => {
  return (
    <ChartContainer config={chartConfig} className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={dummyGa4Data}>
          <XAxis dataKey="date" />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line 
            type="monotone" 
            dataKey="sessions" 
            stroke="#3b82f6" 
            strokeWidth={2}
            name="Sitzungen"
          />
          <Line 
            type="monotone" 
            dataKey="users" 
            stroke="#10b981" 
            strokeWidth={2}
            name="Nutzer"
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default GA4Chart;
