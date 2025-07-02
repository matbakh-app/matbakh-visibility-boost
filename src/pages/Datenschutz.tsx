
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const Datenschutz = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Datenschutzerklärung</h1>
          
          <div className="prose max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-4">Datenschutz</h2>
              <p className="text-gray-700 leading-relaxed">
                Wir nehmen den Schutz Ihrer persönlichen Daten sehr ernst und behandeln 
                Ihre personenbezogenen Daten vertraulich und entsprechend der gesetzlichen 
                Datenschutzvorschriften sowie dieser Datenschutzerklärung.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-4">Google-Anmeldung</h2>
              <p className="text-gray-700 leading-relaxed">
                Bei der Anmeldung über Google Business erhalten wir folgende Informationen:
              </p>
              <ul className="list-disc list-inside mt-4 space-y-2 text-gray-700">
                <li>Name und E-Mail-Adresse</li>
                <li>Google Business Profil-Informationen</li>
                <li>Berechtigung zur Verwaltung Ihres Google Business Profils</li>
              </ul>
              
              <p className="text-gray-700 leading-relaxed mt-4">
                Diese Daten werden ausschließlich zur Bereitstellung unserer Dienste verwendet 
                und nicht an Dritte weitergegeben.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Datenschutz;
