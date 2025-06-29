
import React from 'react';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const PartnerDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600">Überblick über Ihre Restaurant-Sichtbarkeit</p>
        </div>

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
      </div>
    </div>
  );
};

export default PartnerDashboard;
