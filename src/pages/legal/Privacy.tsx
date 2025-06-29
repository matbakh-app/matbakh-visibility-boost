
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Privacy: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Data Protection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">1. Data Controller</h3>
                <p>BaSSco (Bavarian Software Solution), Munich, Germany</p>
                <p>Contact: mail(at)matbakh(dot)app</p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">2. Data Collection</h3>
                <p>We collect and process personal data in accordance with applicable data protection laws, particularly the GDPR.</p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">3. Purpose of Processing</h3>
                <p>Your data is processed for the provision of our services and communication with you.</p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">4. Your Rights</h3>
                <p>You have the right to access, rectify, delete, restrict processing, data portability, and objection regarding your personal data.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default Privacy;
