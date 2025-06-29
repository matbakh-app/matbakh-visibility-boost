
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Imprint: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Imprint</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Legal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Company</h3>
                <p>BaSSco (Bavarian Software Solution)</p>
                <p>Munich, Germany</p>
              </div>
              
              <div>
                <h3 className="font-semibold">Contact</h3>
                <p>Email: mail(at)matbakh(dot)app</p>
              </div>
              
              <div>
                <h3 className="font-semibold">Responsible for Content</h3>
                <p>BaSSco (Bavarian Software Solution)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default Imprint;
