
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const AGB: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Allgemeine Geschäftsbedingungen</h1>
        
        <div className="prose max-w-none">
          <h2>§ 1 Geltungsbereich</h2>
          <p>
            Diese Allgemeinen Geschäftsbedingungen gelten für alle Verträge zwischen 
            BaSSco (Bavarian Software Solution) und unseren Kunden.
          </p>
          
          <h2>§ 2 Leistungen</h2>
          <p>
            Wir bieten Services zur Verbesserung der digitalen Sichtbarkeit von 
            Gastronomiebetrieben an.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AGB;
