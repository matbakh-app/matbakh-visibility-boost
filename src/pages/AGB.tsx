
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const AGB = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Allgemeine Geschäftsbedingungen</h1>
          
          <div className="prose max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-4">Geltungsbereich</h2>
              <p className="text-gray-700 leading-relaxed">
                Diese Allgemeinen Geschäftsbedingungen gelten für alle Verträge zwischen 
                BaSSco (Bavarian Software Solution) und unseren Kunden über die Nutzung 
                unserer Dienstleistungen.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-4">Leistungen</h2>
              <p className="text-gray-700 leading-relaxed">
                Wir bieten Dienstleistungen zur Optimierung und Verwaltung von Google Business 
                Profilen sowie Social Media Management für Gastronomiebetriebe an.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AGB;
