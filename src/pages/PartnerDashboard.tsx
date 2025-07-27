
import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RedeemCodeForm } from '@/components/redeem/RedeemCodeForm';
import { CampaignReport } from '@/components/redeem/CampaignReport';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const PartnerDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // Mock partner ID - in real app would come from auth context
  const partnerId = "your-partner-id";

  const handleCodeGenerated = (code: string) => {
    console.log('New code generated:', code);
    // Here you could show a success toast or update the campaign report
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Partner Dashboard</h1>
        <p className="text-gray-600">Überblick über Ihre Restaurant-Sichtbarkeit und Marketing-Tools</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="redeem-codes">Redeem-Codes</TabsTrigger>
          <TabsTrigger value="campaign-stats">Kampagnen-Statistik</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sichtbarkeits-Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 mb-2">85%</div>
            <p className="text-sm text-gray-600">
              Ihr Restaurant ist gut sichtbar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Google Bewertungen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">4.2 ⭐</div>
            <p className="text-sm text-gray-600">
              basierend auf 127 Bewertungen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Profilaufrufe</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">1,245</div>
            <p className="text-sm text-gray-600">
              in den letzten 30 Tagen
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Schnelle Aktionen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" variant="outline">
              Öffnungszeiten aktualisieren
            </Button>
            <Button className="w-full" variant="outline">
              Neue Fotos hochladen
            </Button>
            <Button className="w-full" variant="outline">
              Speisekarte aktualisieren
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aktuelle Aufgaben</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <span className="text-sm">Neue Bewertung beantworten</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-sm">Wochenangebot veröffentlichen</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <span className="text-sm">Ferienzeiten eintragen</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
        </TabsContent>

        <TabsContent value="redeem-codes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Neuen Redeem-Code generieren</CardTitle>
            </CardHeader>
            <CardContent>
              <RedeemCodeForm 
                partnerId={partnerId} 
                onCodeGenerated={handleCodeGenerated}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaign-stats" className="space-y-6">
          <CampaignReport partnerId={partnerId} />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default PartnerDashboard;
