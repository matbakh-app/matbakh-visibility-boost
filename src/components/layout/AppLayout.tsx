
import React from 'react';
import { useLocation } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BackHomeButtons from '@/components/navigation/BackHomeButtons';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const location = useLocation();
  
  // CTO-KONFORM: Header/Footer sind IMMER sichtbar - keine Ausnahmen!
  // Das Logo muss auf ALLEN Seiten verfügbar sein für Orientierung und Seriosität
  
  // Seiten ohne BackHomeButtons (Landing und Home)
  const hideBackButtonsOn = ['/', '/business/partner'];
  
  const showBackButtons = !hideBackButtonsOn.includes(location.pathname);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header ist IMMER sichtbar */}
      <Header />
      
      {/* Main Content */}
      <main className="flex-1 w-full">
        {/* Back Navigation - nur auf bestimmten Seiten */}
        {showBackButtons && (
          <div className="w-full border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="py-4">
                <BackHomeButtons />
              </div>
            </div>
          </div>
        )}
        
        {/* Page Content - vereinfachte Container-Struktur */}
        <div className="w-full">
          {children}
        </div>
      </main>
      
      {/* Footer ist IMMER sichtbar */}
      <Footer />
    </div>
  );
};

export default AppLayout;
