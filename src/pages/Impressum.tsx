
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const Impressum = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Impressum</h1>
          
          <div className="prose max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-4">Anbieter</h2>
              <p className="text-gray-700 leading-relaxed">
                BaSSco (Bavarian Software Solution)<br />
                München, Deutschland
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-4">Kontakt</h2>
              <p className="text-gray-700 leading-relaxed">
                E-Mail: mail(at)matbakh(dot)app
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-4">Haftungsausschluss</h2>
              <p className="text-gray-700 leading-relaxed">
                Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. 
                Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte 
                können wir jedoch keine Gewähr übernehmen.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Impressum;
