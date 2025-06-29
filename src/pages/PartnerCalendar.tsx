
import React from 'react';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PartnerCalendar: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Beratungstermine</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Google Kalender Integration für 30€/30min Beratung wird hier implementiert...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PartnerCalendar;
