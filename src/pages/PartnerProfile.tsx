
import React from 'react';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PartnerProfile: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Restaurant Profil</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Profilverwaltung wird hier implementiert...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PartnerProfile;
