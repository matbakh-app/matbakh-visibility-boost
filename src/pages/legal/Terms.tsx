
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Terms: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Terms and Conditions</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>General Terms and Conditions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">1. Scope</h3>
                <p>These terms and conditions apply to all services provided by BaSSco (Bavarian Software Solution).</p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">2. Services</h3>
                <p>We provide digital marketing services for restaurants, including Google Business Profile management and social media services.</p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">3. Payment Terms</h3>
                <p>Payment terms and conditions will be specified in individual service agreements.</p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">4. Liability</h3>
                <p>Liability is limited to the extent permitted by law.</p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">5. Applicable Law</h3>
                <p>German law applies to these terms and conditions.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default Terms;
