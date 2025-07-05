
import React from 'react';
import GMBChart from '@/components/dashboard/GMBChart';
import GA4Chart from '@/components/dashboard/GA4Chart';
import SocialMediaChart from '@/components/dashboard/SocialMediaChart';
import KpiGrid from '@/components/dashboard/KpiGrid';

export default function DashboardOverview() {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <GMBChart />
        <GA4Chart />
        <SocialMediaChart />
      </div>
      <KpiGrid category="all" />
    </>
  );
}
