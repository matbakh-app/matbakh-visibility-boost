
import React from 'react';
import GMBChart from '@/components/dashboard/GMBChart';
import GA4Chart from '@/components/dashboard/GA4Chart';
import SocialMediaChart from '@/components/dashboard/SocialMediaChart';
import KpiGrid from '@/components/dashboard/KpiGrid';
import { useTranslation } from 'react-i18next';

export default function DashboardOverview() {
  const { t } = useTranslation('dashboard');
  
  return (
    <div className="space-y-8">
      {/* Charts Grid - 2 Spalten Layout mit einheitlichen Container-Größen */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6 min-h-[400px] flex flex-col">
          <h3 className="text-lg font-semibold mb-4">{t('charts.gmbTitle')}</h3>
          <div className="flex-1">
            <GMBChart />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 min-h-[400px] flex flex-col">
          <h3 className="text-lg font-semibold mb-4">{t('charts.ga4Title')}</h3>
          <div className="flex-1">
            <GA4Chart />
          </div>
        </div>
      </div>
      
      {/* Social Media Chart - volle Breite mit einheitlicher Container-Größe */}
      <div className="bg-white rounded-lg shadow p-6 min-h-[400px] flex flex-col">
        <h3 className="text-lg font-semibold mb-4">{t('charts.socialTitle')}</h3>
        <div className="flex-1">
          <SocialMediaChart />
        </div>
      </div>
      
      {/* Overview KPIs */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">{t('overview.importantKpis')}</h3>
        <KpiGrid category="all" />
      </div>
    </div>
  );
}
