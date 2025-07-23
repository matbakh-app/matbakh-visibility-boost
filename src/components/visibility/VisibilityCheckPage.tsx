
import React from 'react';
import { Helmet } from 'react-helmet-async';
import VisibilityCheckForm from './VisibilityCheckForm';

const VisibilityCheckPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Kostenloser Sichtbarkeits-Check | matbakh.app</title>
        <meta 
          name="description" 
          content="Analysieren Sie Ihre Online-Sichtbarkeit auf Google My Business, Facebook und Instagram kostenlos. KI-basierter Report mit Handlungsempfehlungen." 
        />
      </Helmet>
      
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-6 py-12 text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Kostenloser Sichtbarkeits-Check
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Erfahren Sie in wenigen Minuten, wie sichtbar Ihr Unternehmen online ist und 
              erhalten Sie konkrete Empfehlungen zur Verbesserung.
            </p>
            <div className="flex justify-center items-center space-x-8 text-sm text-gray-500">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                100% Kostenlos
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                KI-basierte Analyse
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                Sofortige Ergebnisse
              </div>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="py-12">
          <VisibilityCheckForm />
        </div>
      </div>
    </>
  );
};

export default VisibilityCheckPage;
