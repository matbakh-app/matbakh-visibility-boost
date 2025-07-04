
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import KpiGrid from './KpiGrid';
import GMBChart from './GMBChart';
import GA4Chart from './GA4Chart';

const DashboardTabs: React.FC = () => {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="overview">Übersicht</TabsTrigger>
        <TabsTrigger value="gmb">Google My Business</TabsTrigger>
        <TabsTrigger value="ga4">Google Analytics</TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview" className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Google My Business Performance</h3>
            <GMBChart />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Google Analytics 4</h3>
            <GA4Chart />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <h4 className="text-sm font-medium text-gray-500 mb-1">Impressionen (GMB)</h4>
            <p className="text-2xl font-bold">1,234</p>
            <p className="text-sm text-green-600">+23% vs. Durchschnitt</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <h4 className="text-sm font-medium text-gray-500 mb-1">Sitzungen (GA4)</h4>
            <p className="text-2xl font-bold">2,340</p>
            <p className="text-sm text-green-600">+7% vs. Durchschnitt</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <h4 className="text-sm font-medium text-gray-500 mb-1">Conversions</h4>
            <p className="text-2xl font-bold">34</p>
            <p className="text-sm text-green-600">+25% vs. Durchschnitt</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <h4 className="text-sm font-medium text-gray-500 mb-1">CTR</h4>
            <p className="text-2xl font-bold">4.2%</p>
            <p className="text-sm text-red-600">-1.2% vs. Durchschnitt</p>
          </div>
        </div>
      </TabsContent>
      
      <TabsContent value="gmb" className="space-y-6">
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">Google My Business KPIs</h3>
          <p className="text-gray-600">Überwache die Performance deines Google Business Profils</p>
        </div>
        <KpiGrid type="gmb" />
      </TabsContent>
      
      <TabsContent value="ga4" className="space-y-6">
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">Google Analytics 4 KPIs</h3>
          <p className="text-gray-600">Analysiere den Traffic und das Verhalten auf deiner Website</p>
        </div>
        <KpiGrid type="ga4" />
      </TabsContent>
    </Tabs>
  );
};

export default DashboardTabs;
