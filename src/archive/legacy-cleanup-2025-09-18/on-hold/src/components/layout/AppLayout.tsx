
import React from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BackHomeButtons from '@/components/navigation/BackHomeButtons';

interface AppLayoutProps {
  children?: React.ReactNode; // Optional für nested routes
  hideNav?: boolean; // Neues optionales Prop zum Ausblenden der Navigation
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, hideNav = false }) => {
  const location = useLocation();
  
  // Seiten ohne BackHomeButtons (Landing und Home)
  const hideBackButtonsOn = ['/', '/business/partner'];
  
  const showBackButtons = !hideBackButtonsOn.includes(location.pathname);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header wird nur angezeigt, wenn hideNav nicht gesetzt ist */}
      {!hideNav && <Header />}
      
      {/* Main Content */}
      <main className="flex-1 w-full">
        {/* Back Navigation - nur auf bestimmten Seiten und wenn Header sichtbar */}
        {!hideNav && showBackButtons && (
          <div className="w-full border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="py-4">
                <BackHomeButtons />
              </div>
            </div>
          </div>
        )}
        
        {/* Page Content */}
        <div className="w-full">
          {children || <Outlet />}
        </div>
      </main>
      
      {/* Footer bleibt immer sichtbar */}
      <Footer />
    </div>
  );
};

export default AppLayout;
