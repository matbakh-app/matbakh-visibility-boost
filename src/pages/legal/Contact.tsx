
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ContactForm from '@/components/ContactForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Contact: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Contact</h1>
        
        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Contact Us</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">BaSSco (Bavarian Software Solution)</h3>
                  <p>Munich, Germany</p>
                </div>
                
                <div>
                  <h3 className="font-semibold">Email</h3>
                  <p>mail(at)matbakh(dot)app</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">
                    We typically respond within 24 hours.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <ContactForm />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Contact;
