
import React from 'react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';

// Dummy data for development
const dummyGmbData = [
  { month: 'Jan', views: 1250, clicks: 89 },
  { month: 'Feb', views: 1180, clicks: 95 },
  { month: 'Mar', views: 1420, clicks: 102 },
  { month: 'Apr', views: 1350, clicks: 87 },
  { month: 'Mai', views: 1580, clicks: 118 },
  { month: 'Jun', views: 1650, clicks: 125 },
];

const chartConfig = {
  views: {
    label: "Profilaufrufe",
  },
  clicks: {
    label: "Klicks",
  },
};

const GMBChart: React.FC = () => {
  return (
    <ChartContainer config={chartConfig} className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dummyGmbData}>
          <XAxis dataKey="month" />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="views" fill="#3b82f6" name="Profilaufrufe" />
          <Bar dataKey="clicks" fill="#10b981" name="Klicks" />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default GMBChart;
