
import React, { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TrialBanner from '@/components/TrialBanner';
import DashboardCard from '@/components/dashboard/DashboardCard';
import QuotaWidget from '@/components/dashboard/QuotaWidget';
import HeroSection from '@/components/dashboard/HeroSection';
import DashboardNavigation from '@/components/dashboard/DashboardNavigation';
import ActionModal from '@/components/dashboard/ActionModal';
import QuickActions from '@/components/dashboard/QuickActions';
import { useSyncGmb } from '@/hooks/useSyncGmb';
import { useSyncGa4 } from '@/hooks/useSyncGa4';
import { useAiRecommendations } from '@/hooks/useAiRecommendations';
import { useTranslation } from 'react-i18next';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  
  const [selectedRecommendation, setSelectedRecommendation] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const isOverviewPage = location.pathname === '/dashboard/overview' || location.pathname === '/dashboard';

  // Fallback AI-Empfehlungen für immer sichtbare AI Recommendations
  const fallbackRecommendations = [
    { 
      id: 'ai-photos', 
      title: t('aiRecommendations.optimizePhotos', { defaultValue: 'Fotos optimieren' }), 
      description: t('aiRecommendations.photosDesc', { defaultValue: 'KI-gestützte Foto-Optimierung für bessere Sichtbarkeit' }), 
      recommendation_type: 'photos', 
      priority: 'high' 
    },
    { 
      id: 'ai-reviews', 
      title: t('aiRecommendations.manageReviews', { defaultValue: 'Bewertungen verwalten' }), 
      description: t('aiRecommendations.reviewsDesc', { defaultValue: 'Intelligente Bewertungsanalyse und Antwortvorschläge' }), 
      recommendation_type: 'reviews', 
      priority: 'medium' 
    },
    { 
      id: 'ai-hours', 
      title: t('aiRecommendations.optimizeHours', { defaultValue: 'Öffnungszeiten prüfen' }), 
      description: t('aiRecommendations.hoursDesc', { defaultValue: 'KI-basierte Analyse der optimalen Öffnungszeiten' }), 
      recommendation_type: 'hours', 
      priority: 'low' 
    }
  ];

  // AI Recommendations - Modal-Dialog für interaktiven Flow
  const handleAiRecommendation = (recommendation: any) => {
    setSelectedRecommendation(recommendation);
    setIsModalOpen(true);
  };

  // Immer AI Recommendations anzeigen - echte Daten oder Fallback
  const displayRecommendations = (recommendations && recommendations.length > 0)
    ? recommendations
    : fallbackRecommendations;

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
              {/* Upload Quota */}
              <QuotaWidget 
                currentUploads={8}
                maxUploads={20}
                title={t('sidebar.monthlyUploads')}
              />
              
              {/* Quick Actions - Direkte Ausführung */}
              <DashboardCard title={t('sidebar.quickActions')}>
                <QuickActions />
              </DashboardCard>

              {/* AI Recommendations - Modal für interaktiven Flow */}
              <DashboardCard title={t('sidebar.aiRecommendations')}>
                <div className="space-y-3">
                  {displayRecommendations.map((recommendation, index) => (
                    <div key={recommendation.id} className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      index === 0 ? 'bg-blue-50 hover:bg-blue-100' :
                      index === 1 ? 'bg-green-50 hover:bg-green-100' :
                      'bg-purple-50 hover:bg-purple-100'
                    }`}>
                      <h4 className={`font-medium mb-1 ${
                        index === 0 ? 'text-blue-900' :
                        index === 1 ? 'text-green-900' :
                        'text-purple-900'
                      }`}>{recommendation.title}</h4>
                      <p className={`text-sm mb-2 ${
                        index === 0 ? 'text-blue-700' :
                        index === 1 ? 'text-green-700' :
                        'text-purple-700'
                      }`}>{recommendation.description}</p>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleAiRecommendation(recommendation)}
                        className={`w-full ${
                          index === 0 ? 'border-blue-300 text-blue-700 hover:bg-blue-100' :
                          index === 1 ? 'border-green-300 text-green-700 hover:bg-green-100' :
                          'border-purple-300 text-purple-700 hover:bg-purple-100'
                        }`}
                      >
                        {t('aiRecommendations.viewSuggestion', { defaultValue: 'Vorschlag prüfen' })}
                      </Button>
                    </div>
                  ))}
                </div>
              </DashboardCard>
            </div>
          </div>
        </div>
      </div>
      
      {/* Action Modal nur für AI Recommendations */}
      <ActionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        recommendation={selectedRecommendation}
      />
      
      <Footer />
    </div>
  );
}
