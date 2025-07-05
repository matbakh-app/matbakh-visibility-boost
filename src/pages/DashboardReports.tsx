
import React from 'react';
import { useTranslation } from 'react-i18next';

export default function DashboardReports() {
  const { t } = useTranslation('dashboard');
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">{t('tabs.reports')}</h2>
          <p className="text-gray-600">Detaillierte Berichte und Analysen</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-500">Berichte & Auswertungen folgen hier.</p>
        </div>
      </div>
    </div>
  );
}
