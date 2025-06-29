
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Kontakt: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Kontakt</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Kontaktieren Sie uns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">BaSSco (Bavarian Software Solution)</h3>
                <p>München, Deutschland</p>
              </div>
              
              <div>
                <h3 className="font-semibold">E-Mail</h3>
                <p>mail(at)matbakh(dot)app</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">
                  Wir antworten in der Regel innerhalb von 24 Stunden.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default Kontakt;
