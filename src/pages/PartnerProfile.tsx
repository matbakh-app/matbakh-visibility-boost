
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/components/layout/AppLayout';

const PartnerProfile: React.FC = () => {
  return (
    <AppLayout>
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
    </AppLayout>
  );
};

export default PartnerProfile;
