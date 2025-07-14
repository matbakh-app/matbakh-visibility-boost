
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LanguageToggle from './header/LanguageToggle';
import NavigationMenu from './header/NavigationMenu';
import MobileMenu from './navigation/MobileMenu';
import UserMenu from './header/UserMenu';
import Logo from './Logo';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 w-full sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center min-w-0">
            <button 
              onClick={() => navigate('/')}
              className="hover:opacity-80 transition-opacity flex-shrink-0"
              aria-label="Go to homepage"
            >
              <Logo size="sm" />
            </button>
          </div>
          
          <NavigationMenu />
          
          <div className="flex items-center space-x-4">
            <UserMenu />
            <LanguageToggle />
            <MobileMenu 
              isOpen={isMobileMenuOpen} 
              onToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
