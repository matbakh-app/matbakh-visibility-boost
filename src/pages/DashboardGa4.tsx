
import React from 'react';
import KpiGrid from '@/components/dashboard/KpiGrid';
import { useTranslation } from 'react-i18next';

export default function DashboardGa4() {
  const { t } = useTranslation('dashboard');
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">{t('tabs.ga4')} KPIs</h2>
          <p className="text-gray-600">Analysiere den Traffic und das Verhalten auf deiner Website</p>
        </div>
        <KpiGrid category="ga4" />
      </div>
    </div>
  );
}
