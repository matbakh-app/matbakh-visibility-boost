
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TrialBanner from '@/components/TrialBanner';
import DashboardCard from '@/components/dashboard/DashboardCard';
import GMBChart from '@/components/dashboard/GMBChart';
import GA4Chart from '@/components/dashboard/GA4Chart';
import QuotaWidget from '@/components/dashboard/QuotaWidget';
import KpiCard from '@/components/dashboard/KpiCard';
import { useSyncGmb } from '@/hooks/useSyncGmb';
import { useSyncGa4 } from '@/hooks/useSyncGa4';
import { useTranslation } from 'react-i18next';

const Dashboard = () => {
  const { t } = useTranslation();
  const { data: gmbData, isLoading: gmbLoading, error: gmbError } = useSyncGmb();
  const { data: ga4Data, isLoading: ga4Loading, error: ga4Error } = useSyncGa4();
  
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <TrialBanner daysRemaining={14} />
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{t('dashboard.title')}</h1>
            <p className="text-gray-600">{t('dashboard.description')}</p>
          </div>

          {/* KPI Cards Section - Proof of Concept */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Key Performance Indicators</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <KpiCard
                title="Impressionen"
                titleKey="impressions"
                description="Summe aller Impressionen deines Google-Profils in Suche & Maps. Zeigt, wie oft dein Eintrag potenziellen Kunden angezeigt wurde."
                benchmark={1000}
                comparePercentage={23}
                optimizeLink="/dashboard/ai-optimization?kpi=impressions"
              />
              
              <KpiCard
                title="Klickrate (CTR)"
                titleKey="ctr"
                description="Verhältnis von Klicks zu Impressionen, angezeigt als Prozent. Misst, wie oft Nutzer auf dein Profil geklickt haben, nachdem es angezeigt wurde."
                benchmark="5%"
                comparePercentage={-1.2}
                optimizeLink="/dashboard/ai-optimization?kpi=ctr"
              />
              
              <KpiCard
                title="Profilaufrufe"
                titleKey="profileViews"
                description="Anzahl der direkten Aufrufe deines Google Business Profils. Zeigt das Interesse der Nutzer an deinem Unternehmen."
                benchmark={500}
                comparePercentage={8}
                optimizeLink="/dashboard/ai-optimization?kpi=profileViews"
              />
            </div>
          </div>
          
          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Google My Business Section */}
            <div className="lg:col-span-2">
              <DashboardCard 
                title="Google My Business Performance"
                isLoading={gmbLoading}
                error={gmbError?.message}
              >
                <GMBChart />
                {gmbData && (
                  <div className="mt-4 text-sm text-gray-600">
                    Sync Status: {gmbData.status} - {gmbData.function}
                  </div>
                )}
              </DashboardCard>
            </div>

            {/* Quick Actions & Status */}
            <div className="space-y-6">
              <DashboardCard title="Upload Quota">
                <QuotaWidget 
                  currentUploads={23}
                  maxUploads={50}
                  title="Monatliche Uploads"
                />
              </DashboardCard>

              <DashboardCard title="Schnelle Aktionen">
                <div className="space-y-3">
                  <button className="w-full bg-black text-white px-4 py-2 rounded hover:bg-gray-800 text-sm">
                    Öffnungszeiten aktualisieren
                  </button>
                  <button className="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50 text-sm">
                    Neue Fotos hochladen
                  </button>
                  <button className="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50 text-sm">
                    Speisekarte aktualisieren
                  </button>
                </div>
              </DashboardCard>
            </div>
          </div>

          {/* Google Analytics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DashboardCard 
              title="Google Analytics 4"
              isLoading={ga4Loading}
              error={ga4Error?.message}
            >
              <GA4Chart />
              {ga4Data && (
                <div className="mt-4 text-sm text-gray-600">
                  Sync Status: {ga4Data.status} - {ga4Data.function}
                </div>
              )}
            </DashboardCard>

            <DashboardCard title="AI Empfehlungen">
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">📈 Sichtbarkeit verbessern</h4>
                  <p className="text-sm text-blue-700">
                    Fügen Sie 3 weitere Fotos hinzu, um Ihre Google-Sichtbarkeit um 15% zu steigern.
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">⭐ Bewertungen</h4>
                  <p className="text-sm text-green-700">
                    Ihre Bewertungen sind ausgezeichnet! Teilen Sie sie auf Social Media.
                  </p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-2">🕒 Öffnungszeiten</h4>
                  <p className="text-sm text-yellow-700">
                    Aktualisieren Sie Ihre Ferienzeiten für die Sommerpause.
                  </p>
                </div>
              </div>
            </DashboardCard>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
