
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TrialBanner from '@/components/TrialBanner';

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <TrialBanner daysRemaining={14} />
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Partner Dashboard</h1>
            <p className="text-gray-600">Verwalten Sie Ihr Google Business Profil und Social Media Kanäle</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Google Business Profil</h3>
              <p className="text-gray-600 mb-4">Status: Nicht verbunden</p>
              <button className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800">
                Jetzt verbinden
              </button>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Social Media</h3>
              <p className="text-gray-600 mb-4">Kanäle: Nicht konfiguriert</p>
              <button className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800">
                Kanäle einrichten
              </button>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Analytics</h3>
              <p className="text-gray-600 mb-4">Keine Daten verfügbar</p>
              <button className="bg-gray-300 text-gray-500 px-4 py-2 rounded cursor-not-allowed">
                Bald verfügbar
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
