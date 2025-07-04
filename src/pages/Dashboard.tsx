
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TrialBanner from '@/components/TrialBanner';
import DashboardCard from '@/components/dashboard/DashboardCard';
import DashboardTabs from '@/components/dashboard/DashboardTabs';
import QuotaWidget from '@/components/dashboard/QuotaWidget';
import { useSyncGmb } from '@/hooks/useSyncGmb';
import { useSyncGa4 } from '@/hooks/useSyncGa4';
import { useTranslation } from 'react-i18next';

const Dashboard = () => {
  const { t } = useTranslation('dashboard');
  const { data: gmbData, isLoading: gmbLoading, error: gmbError } = useSyncGmb();
  const { data: ga4Data, isLoading: ga4Loading, error: ga4Error } = useSyncGa4();
  
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <TrialBanner daysRemaining={14} />
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
            <p className="text-gray-600">{t('description')}</p>
          </div>

          {/* Main Dashboard Content */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
            {/* Dashboard Tabs - Takes 3 columns */}
            <div className="lg:col-span-3">
              <DashboardTabs />
            </div>

            {/* Sidebar - Takes 1 column */}
            <div className="space-y-6">
              <DashboardCard title={t('sidebar.uploadQuota')}>
                <QuotaWidget 
                  currentUploads={23}
                  maxUploads={50}
                  title={t('sidebar.monthlyUploads')}
                />
              </DashboardCard>

              <DashboardCard title={t('sidebar.quickActions')}>
                <div className="space-y-3">
                  <button className="w-full bg-black text-white px-4 py-2 rounded hover:bg-gray-800 text-sm">
                    {t('sidebar.updateHours')}
                  </button>
                  <button className="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50 text-sm">
                    {t('sidebar.uploadPhotos')}
                  </button>
                  <button className="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50 text-sm">
                    {t('sidebar.updateMenu')}
                  </button>
                </div>
              </DashboardCard>

              <DashboardCard title={t('sidebar.aiRecommendations')}>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">📈 {t('sidebar.improveVisibility')}</h4>
                    <p className="text-sm text-blue-700">
                      {t('sidebar.visibilityTip')}
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">⭐ {t('sidebar.reviews')}</h4>
                    <p className="text-sm text-green-700">
                      {t('sidebar.reviewsTip')}
                    </p>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <h4 className="font-medium text-yellow-900 mb-2">🕒 {t('sidebar.openingHours')}</h4>
                    <p className="text-sm text-yellow-700">
                      {t('sidebar.hoursTip')}
                    </p>
                  </div>
                </div>
              </DashboardCard>
            </div>
          </div>

          {/* Status Information */}
          {(gmbData || ga4Data) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
              {gmbData && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-2">GMB Sync Status</h3>
                  <p className="text-sm text-gray-600">
                    Status: {gmbData.status} - {gmbData.function}
                  </p>
                </div>
              )}
              {ga4Data && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-2">GA4 Sync Status</h3>
                  <p className="text-sm text-gray-600">
                    Status: {ga4Data.status} - {ga4Data.function}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
