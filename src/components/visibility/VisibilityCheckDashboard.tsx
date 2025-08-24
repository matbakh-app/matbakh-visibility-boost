import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart, CheckCircle, AlertCircle, TrendingUp, Eye, Star, Users } from 'lucide-react';

// Results Overview
const ResultsOverview: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Ihre Sichtbarkeits-Analyse</h1>
        <p className="text-muted-foreground">
          Hier ist eine Übersicht Ihrer Online-Präsenz und Verbesserungsvorschläge
        </p>
      </div>

      {/* Score Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Eye className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-green-600 mb-2">72%</h3>
            <p className="text-sm text-muted-foreground">Gesamt-Sichtbarkeit</p>
            <Badge variant="secondary" className="mt-2">Gut</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-blue-600 mb-2">4.2</h3>
            <p className="text-sm text-muted-foreground">Durchschnittsbewertung</p>
            <Badge variant="secondary" className="mt-2">67 Bewertungen</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-2xl font-bold text-orange-600 mb-2">+23%</h3>
            <p className="text-sm text-muted-foreground">Verbesserungs-Potenzial</p>
            <Badge variant="destructive" className="mt-2">6 Bereiche</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Platform Analysis */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Plattform-Analyse</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <h4 className="font-medium">Google Business Profile</h4>
                  <p className="text-sm text-muted-foreground">Profil vollständig und optimiert</p>
                </div>
              </div>
              <Badge variant="default">Excellent</Badge>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                <div>
                  <h4 className="font-medium">Instagram</h4>
                  <p className="text-sm text-muted-foreground">Profil vorhanden, aber unvollständig</p>
                </div>
              </div>
              <Badge variant="secondary">Needs Work</Badge>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <div>
                  <h4 className="font-medium">Facebook</h4>
                  <p className="text-sm text-muted-foreground">Kein aktives Profil gefunden</p>
                </div>
              </div>
              <Badge variant="destructive">Missing</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Sofort-Empfehlungen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">1. Google Fotos aktualisieren</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Laden Sie aktuelle Speisefotos hoch, um Ihre Sichtbarkeit um bis zu 35% zu steigern
              </p>
              <Button size="sm" variant="outline">Mehr erfahren</Button>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">2. Öffnungszeiten ergänzen</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Spezielle Öffnungszeiten für Feiertage hinzufügen
              </p>
              <Button size="sm" variant="outline">Mehr erfahren</Button>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">3. Facebook Business erstellen</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Erreichen Sie lokale Kunden über Facebook
              </p>
              <Button size="sm" variant="outline">Mehr erfahren</Button>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">4. Bewertungen beantworten</h4>
              <p className="text-sm text-muted-foreground mb-3">
                12 unbeantwortete Bewertungen gefunden
              </p>
              <Button size="sm" variant="outline">Mehr erfahren</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA Section */}
      <Card>
        <CardContent className="p-8 text-center">
          <h3 className="text-xl font-semibold mb-4">Bereit für den nächsten Schritt?</h3>
          <p className="text-muted-foreground mb-6">
            Lassen Sie uns Ihre Online-Präsenz professionell optimieren
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/register')}>
              Kostenloses Beratungsgespräch buchen
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/angebote')}>
              Pakete ansehen
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Main Dashboard Router
const VisibilityCheckDashboard: React.FC = () => {
  return (
    <Routes>
      <Route path="results" element={<ResultsOverview />} />
      <Route index element={<ResultsOverview />} />
    </Routes>
  );
};

export default VisibilityCheckDashboard;