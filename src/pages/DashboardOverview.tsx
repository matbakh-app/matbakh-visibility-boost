
import React from 'react';
import GMBChart from '@/components/dashboard/GMBChart';
import GA4Chart from '@/components/dashboard/GA4Chart';
import SocialMediaChart from '@/components/dashboard/SocialMediaChart';
import KpiGrid from '@/components/dashboard/KpiGrid';
import { useTranslation } from 'react-i18next';

export default function DashboardOverview() {
  const { t } = useTranslation('dashboard');
  
  return (
    <div className="space-y-10">
      {/* Erste Zeile: Zwei Hauptcharts nebeneinander */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 min-h-[360px] flex flex-col justify-between">
          <h3 className="font-bold text-lg mb-4">{t('charts.gmbTitle')}</h3>
          <div className="flex-1 flex flex-col">
            <GMBChart />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 min-h-[360px] flex flex-col justify-between">
          <h3 className="font-bold text-lg mb-4">{t('charts.ga4Title')}</h3>
          <div className="flex-1 flex flex-col">
            <GA4Chart />
          </div>
        </div>
      </div>
      
      {/* Zweite Zeile: Social Media Chart über volle Breite */}
      <div className="bg-white rounded-xl shadow-md p-6 min-h-[360px] flex flex-col justify-between">
        <h3 className="font-bold text-lg mb-4">{t('charts.socialTitle')}</h3>
        <div className="flex-1 flex flex-col">
          <SocialMediaChart />
        </div>
      </div>
      
      {/* KPIs Grid darunter */}
      <div>
        <h4 className="font-semibold text-base mb-3">{t('overview.importantKpis')}</h4>
        <KpiGrid category="all" />
      </div>
    </div>
  );
}
