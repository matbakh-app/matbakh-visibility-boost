
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import KpiGrid from './KpiGrid';
import GMBChart from './GMBChart';
import GA4Chart from './GA4Chart';
import { useTranslation } from 'react-i18next';

// Create a simple SocialMediaChart component
const SocialMediaChart: React.FC = () => {
  const { t } = useTranslation('dashboard');
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <h3 className="text-lg font-semibold mb-4">{t('charts.socialTitle')}</h3>
      <div className="h-64 flex items-center justify-center text-gray-500">
        Social Media Chart Placeholder
      </div>
    </div>
  );
};

const DashboardTabs: React.FC = () => {
  const { t } = useTranslation('dashboard');
  
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="overview">{t('tabs.overview')}</TabsTrigger>
        <TabsTrigger value="gmb">{t('tabs.gmb')}</TabsTrigger>
        <TabsTrigger value="ga4">{t('tabs.ga4')}</TabsTrigger>
        <TabsTrigger value="social">{t('tabs.social')}</TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview" className="space-y-6">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-blue-600 to-blue-400 text-white rounded-lg p-6">
          <h2 className="text-3xl font-bold mb-2">{t('hero.title')}</h2>
          <p className="mb-4">{t('hero.subtitle')}</p>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="text-5xl font-extrabold">87<span className="text-lg">/100</span></div>
            <ul className="mt-4 md:mt-0 space-y-2">
              <li>📈 {t('hero.topInsight1')}</li>
              <li>💬 {t('hero.topInsight2')}</li>
            </ul>
          </div>
          <div className="mt-4 text-sm italic">{t('hero.poweredBy')}</div>
        </section>
        
        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">{t('charts.gmbTitle')}</h3>
            <GMBChart />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">{t('charts.ga4Title')}</h3>
            <GA4Chart />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">{t('charts.socialTitle')}</h3>
            <SocialMediaChart />
          </div>
        </div>
        
        {/* Overview KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <h4 className="text-sm font-medium text-gray-500 mb-1">{t('kpi.impressions')} (GMB)</h4>
            <p className="text-2xl font-bold">1,234</p>
            <p className="text-sm text-green-600">+23% vs. Durchschnitt</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <h4 className="text-sm font-medium text-gray-500 mb-1">{t('kpi.sessions')} (GA4)</h4>
            <p className="text-2xl font-bold">2,340</p>
            <p className="text-sm text-green-600">+7% vs. Durchschnitt</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <h4 className="text-sm font-medium text-gray-500 mb-1">{t('kpi.conversions')}</h4>
            <p className="text-2xl font-bold">34</p>
            <p className="text-sm text-green-600">+25% vs. Durchschnitt</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <h4 className="text-sm font-medium text-gray-500 mb-1">{t('kpi.ctr')}</h4>
            <p className="text-2xl font-bold">4.2%</p>
            <p className="text-sm text-red-600">-1.2% vs. Durchschnitt</p>
          </div>
        </div>
      </TabsContent>
      
      <TabsContent value="gmb" className="space-y-6">
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">{t('tabs.gmb')} KPIs</h3>
          <p className="text-gray-600">Überwache die Performance deines Google Business Profils</p>
        </div>
        <KpiGrid type="gmb" />
      </TabsContent>
      
      <TabsContent value="ga4" className="space-y-6">
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">{t('tabs.ga4')} KPIs</h3>
          <p className="text-gray-600">Analysiere den Traffic und das Verhalten auf deiner Website</p>
        </div>
        <KpiGrid type="ga4" />
      </TabsContent>
      
      <TabsContent value="social" className="space-y-6">
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">{t('tabs.social')} KPIs</h3>
          <p className="text-gray-600">Überwache deine Social Media Performance</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <h4 className="text-sm font-medium text-gray-500 mb-1">{t('kpi.instagramFollowers')}</h4>
            <p className="text-2xl font-bold">1,542</p>
            <p className="text-sm text-green-600">+10% vs. Durchschnitt</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <h4 className="text-sm font-medium text-gray-500 mb-1">{t('kpi.facebookLikes')}</h4>
            <p className="text-2xl font-bold">756</p>
            <p className="text-sm text-red-600">-5% vs. Durchschnitt</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <h4 className="text-sm font-medium text-gray-500 mb-1">{t('kpi.socialEngagement')}</h4>
            <p className="text-2xl font-bold">3.8%</p>
            <p className="text-sm text-green-600">+12% vs. Durchschnitt</p>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default DashboardTabs;
