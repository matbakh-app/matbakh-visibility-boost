
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
  
  // KRITISCHER FIX: Header/Footer sollten IMMER sichtbar sein
  // Entferne hideLayoutOn = ['/'] - das war der Hauptfehler!
  const hideLayoutOn: string[] = []; // Leer lassen - Layout immer anzeigen
  
  // Seiten ohne BackHomeButtons (Landing und Home)
  const hideBackButtonsOn = ['/', '/business/partner'];
  
  const showLayout = !hideLayoutOn.includes(location.pathname);
  const showBackButtons = !hideBackButtonsOn.includes(location.pathname);

  if (!showLayout) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4">
          {showBackButtons && (
            <div className="py-4">
              <BackHomeButtons />
            </div>
          )}
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AppLayout;
