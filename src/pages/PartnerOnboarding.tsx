
import React from 'react';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PartnerOnboarding: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Onboarding Wizard</CardTitle>
          </CardHeader>
          <CardContent>
            <p>4-stufiges Onboarding wird hier implementiert...</p>
            <p>- Schritt 1: Unternehmensdaten</p>
            <p>- Schritt 2: Service-Auswahl</p>
            <p>- Schritt 3: Qualifikationsfragen</p>
            <p>- Schritt 4: Google Business Profil verknüpfen</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PartnerOnboarding;
