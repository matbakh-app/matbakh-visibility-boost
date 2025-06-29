
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const Impressum: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Impressum</h1>
        
        <div className="prose max-w-none">
          <h2>Angaben gemäß § 5 TMG</h2>
          <p>
            BaSSco (Bavarian Software Solution)<br />
            München, Deutschland
          </p>
          
          <h2>Kontakt</h2>
          <p>
            E-Mail: mail(at)matbakh(dot)app
          </p>
          
          <h2>Haftungsausschluss</h2>
          <p>
            Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. 
            Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte 
            können wir jedoch keine Gewähr übernehmen.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Impressum;
