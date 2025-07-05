
import React, { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TrialBanner from '@/components/TrialBanner';
import DashboardCard from '@/components/dashboard/DashboardCard';
import QuotaWidget from '@/components/dashboard/QuotaWidget';
import HeroSection from '@/components/dashboard/HeroSection';
import DashboardNavigation from '@/components/dashboard/DashboardNavigation';
import QuickActionButton from '@/components/dashboard/QuickActionButton';
import ActionModal from '@/components/dashboard/ActionModal';
import { useSyncGmb } from '@/hooks/useSyncGmb';
import { useSyncGa4 } from '@/hooks/useSyncGa4';
import { useAiRecommendations } from '@/hooks/useAiRecommendations';
import { useTranslation } from 'react-i18next';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import DashboardOverview from './DashboardOverview';
import DashboardGmb from './DashboardGmb';
import DashboardGa4 from './DashboardGa4';
import DashboardSocial from './DashboardSocial';
import DashboardReports from './DashboardReports';

export default function Dashboard() {
  const { t } = useTranslation('dashboard');
  const { data: gmbData, isLoading: gmbLoading, error: gmbError } = useSyncGmb();
  const { data: ga4Data, isLoading: ga4Loading, error: ga4Error } = useSyncGa4();
  const { data: recommendations, isLoading: recommendationsLoading } = useAiRecommendations();
  const location = useLocation();
  
  const [selectedRecommendation, setSelectedRecommendation] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const isOverviewPage = location.pathname === '/dashboard/overview' || location.pathname === '/dashboard';

  // Fallback AI-Empfehlungen für immer sichtbare Quick-Actions
  const fallbackRecommendations = [
    { 
      id: 'mock-1', 
      title: t('quickActions.addPhotos'), 
      description: t('actionModal.photos.description'), 
      recommendation_type: 'photos', 
      priority: 'high' 
    },
    { 
      id: 'mock-2', 
      title: t('quickActions.respondToReviews'), 
      description: t('actionModal.reviews.description'), 
      recommendation_type: 'reviews', 
      priority: 'medium' 
    },
    { 
      id: 'mock-3', 
      title: t('quickActions.updateHours'), 
      description: t('actionModal.hours.description'), 
      recommendation_type: 'hours', 
      priority: 'low' 
    }
  ];

  // Immer Empfehlungen anzeigen - echte Daten oder Fallback (synchronisiert!)
  const displayRecommendations = (recommendations && recommendations.length > 0)
    ? recommendations
    : fallbackRecommendations;

  const handleQuickAction = (recommendation: any) => {
    setSelectedRecommendation(recommendation);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <TrialBanner />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-gray-600">{t('description')}</p>
        </div>

        {/* Navigation */}
        <DashboardNavigation />

        {/* Hero Section nur auf Overview anzeigen */}
        {isOverviewPage && <HeroSection />}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-8">
          <div className="lg:col-span-3">
            <Routes>
              <Route index element={<Navigate to="overview" replace />} />
              <Route path="overview" element={<DashboardOverview />} />
              <Route path="gmb" element={<DashboardGmb />} />
              <Route path="ga4" element={<DashboardGa4 />} />
              <Route path="social" element={<DashboardSocial />} />
              <Route path="reports" element={<DashboardReports />} />
            </Routes>
          </div>

          {/* Sidebar - sticky positioning */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Upload Quota mit korrigiertem Limit: 20 statt 100 */}
              <QuotaWidget 
                currentUploads={8}
                maxUploads={20}
                title={t('sidebar.monthlyUploads')}
              />
              
              {/* Quick Actions - vollständig synchronisiert aus AI Recommendations */}
              <DashboardCard title={t('sidebar.quickActions')}>
                <div className="space-y-3">
                  {displayRecommendations.map((recommendation) => (
                    <QuickActionButton
                      key={recommendation.id}
                      recommendation={recommendation}
                      onClick={handleQuickAction}
                    />
                  ))}
                </div>
              </DashboardCard>

              {/* AI Recommendations - klickbare Cards */}
              <DashboardCard title={t('sidebar.aiRecommendations')}>
                <div className="space-y-3">
                  {displayRecommendations.map((recommendation) => (
                    <div key={recommendation.id} className="p-3 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors">
                      <h4 className="font-medium text-blue-900 mb-1">{recommendation.title}</h4>
                      <p className="text-sm text-blue-700 mb-2">{recommendation.description}</p>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleQuickAction(recommendation)}
                        className="w-full"
                      >
                        {t('common.takeAction', { defaultValue: 'Jetzt handeln' })}
                      </Button>
                    </div>
                  ))}
                </div>
              </DashboardCard>
            </div>
          </div>
        </div>
      </div>
      
      {/* Action Modal für alle Sidebar-Aktionen */}
      <ActionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        recommendation={selectedRecommendation}
      />
      
      <Footer />
    </div>
  );
}
