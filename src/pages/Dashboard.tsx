
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TrialBanner from '@/components/TrialBanner';
import DashboardCard from '@/components/dashboard/DashboardCard';
import DashboardTabs from '@/components/dashboard/DashboardTabs';
import QuotaWidget from '@/components/dashboard/QuotaWidget';
import HeroSection from '@/components/dashboard/HeroSection';
import { useSyncGmb } from '@/hooks/useSyncGmb';
import { useSyncGa4 } from '@/hooks/useSyncGa4';
import { useTranslation } from 'react-i18next';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardOverview from './DashboardOverview';
import DashboardGmb from './DashboardGmb';
import DashboardGa4 from './DashboardGa4';
import DashboardSocial from './DashboardSocial';
import DashboardReports from './DashboardReports';

export default function Dashboard() {
  const { t } = useTranslation('dashboard');
  const { data: gmbData, isLoading: gmbLoading, error: gmbError } = useSyncGmb();
  const { data: ga4Data, isLoading: ga4Loading, error: ga4Error } = useSyncGa4();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <TrialBanner />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-gray-600">{t('description')}</p>
        </div>

        <HeroSection />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard/overview" replace />} />
              <Route path="/overview" element={<DashboardOverview />} />
              <Route path="/gmb" element={<DashboardGmb />} />
              <Route path="/ga4" element={<DashboardGa4 />} />
              <Route path="/social" element={<DashboardSocial />} />
              <Route path="/reports" element={<DashboardReports />} />
            </Routes>
          </div>

          <div className="lg:col-span-1">
            <div className="space-y-6">
              <QuotaWidget 
                currentUploads={42}
                maxUploads={100}
                title={t('sidebar.monthlyUploads')}
              />
              
              <DashboardCard title={t('sidebar.quickActions')}>
                <div className="space-y-3">
                  <button className="w-full text-left p-2 rounded hover:bg-gray-50">
                    {t('sidebar.updateHours')}
                  </button>
                  <button className="w-full text-left p-2 rounded hover:bg-gray-50">
                    {t('sidebar.uploadPhotos')}
                  </button>
                  <button className="w-full text-left p-2 rounded hover:bg-gray-50">
                    {t('sidebar.updateMenu')}
                  </button>
                </div>
              </DashboardCard>

              <DashboardCard title={t('sidebar.aiRecommendations')}>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900">{t('sidebar.improveVisibility')}</h4>
                    <p className="text-sm text-blue-700">{t('sidebar.visibilityTip')}</p>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <h4 className="font-medium text-yellow-900">{t('sidebar.reviews')}</h4>
                    <p className="text-sm text-yellow-700">{t('sidebar.reviewsTip')}</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-900">{t('sidebar.openingHours')}</h4>
                    <p className="text-sm text-green-700">{t('sidebar.hoursTip')}</p>
                  </div>
                </div>
              </DashboardCard>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
