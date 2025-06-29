
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const Datenschutz: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Datenschutzerklärung</h1>
        
        <div className="prose max-w-none">
          <h2>Datenschutz</h2>
          <p>
            Der Schutz Ihrer persönlichen Daten ist uns wichtig. Diese Datenschutzerklärung 
            informiert Sie über die Verarbeitung Ihrer Daten bei der Nutzung unserer Website.
          </p>
          
          <h2>Google OAuth</h2>
          <p>
            Wir verwenden Google OAuth für die Anmeldung. Dabei werden folgende Daten verarbeitet:
          </p>
          <ul>
            <li>E-Mail-Adresse</li>
            <li>Name</li>
            <li>Google Business Profile Daten (mit Ihrer Einwilligung)</li>
          </ul>
          
          <p>
            Diese Daten werden ausschließlich zur Bereitstellung unserer Services verwendet.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Datenschutz;
