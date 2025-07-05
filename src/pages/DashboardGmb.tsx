
import React from 'react';
import KpiGrid from '@/components/dashboard/KpiGrid';
import { useTranslation } from 'react-i18next';

export default function DashboardGmb() {
  const { t } = useTranslation('dashboard');
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">{t('tabs.gmb')} KPIs</h2>
          <p className="text-gray-600">Überwache die Performance deines Google Business Profils</p>
        </div>
        <KpiGrid category="gmb" />
      </div>
    </div>
  );
}
