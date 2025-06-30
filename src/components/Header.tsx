
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';

const Header: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'de' ? 'en' : 'de';
    i18n.changeLanguage(newLang);
    
    // Handle route translation
    const currentPath = location.pathname;
    let newPath = currentPath;
    
    if (newLang === 'en') {
      newPath = currentPath
        .replace('/kontakt', '/contact')
        .replace('/impressum', '/imprint')
        .replace('/datenschutz', '/privacy')
        .replace('/agb', '/terms')
        .replace('/b2c', '/b2c-en')
        .replace('/services', '/services')
        .replace('/angebote', '/packages');
    } else {
      newPath = currentPath
        .replace('/contact', '/kontakt')
        .replace('/imprint', '/impressum')
        .replace('/privacy', '/datenschutz')
        .replace('/terms', '/agb')
        .replace('/b2c-en', '/b2c')
        .replace('/packages', '/angebote');
    }
    
    if (newPath !== currentPath) {
      navigate(newPath);
    }
  };

  const handleNavigation = (path: string) => {
    const currentLang = i18n.language;
    let translatedPath = path;
    
    if (currentLang === 'en') {
      translatedPath = path
        .replace('/kontakt', '/contact')
        .replace('/impressum', '/imprint')
        .replace('/datenschutz', '/privacy')
        .replace('/agb', '/terms')
        .replace('/b2c', '/b2c-en')
        .replace('/angebote', '/packages');
    }
    
    console.log('Navigating to:', translatedPath);
    navigate(translatedPath);
    setIsMobileMenuOpen(false);
  };

  const isActive = (path: string) => {
    const currentPath = location.pathname;
    if (path === '/' && currentPath === '/') return true;
    if (path === '/b2c' && (currentPath === '/b2c' || currentPath === '/b2c-en')) return true;
    if (path === '/kontakt' && (currentPath === '/kontakt' || currentPath === '/contact')) return true;
    if (path === '/angebote' && (currentPath === '/angebote' || currentPath === '/packages')) return true;
    return currentPath === path;
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 w-full sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button 
                onClick={() => navigate('/')}
                className="text-xl font-bold text-black hover:text-gray-700 transition-colors"
              >
                matbakh
              </button>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              <button
                onClick={() => navigate('/')}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  isActive('/') 
                    ? 'text-black border-b-2 border-black' 
                    : 'text-gray-700 hover:text-black'
                }`}
              >
                {t('nav.home')}
              </button>
              <button
                onClick={() => navigate('/services')}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  isActive('/services') 
                    ? 'text-black border-b-2 border-black' 
                    : 'text-gray-700 hover:text-black'
                }`}
              >
                {t('nav.services')}
              </button>
              <button
                onClick={() => handleNavigation('/angebote')}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  isActive('/angebote')
                    ? 'text-black border-b-2 border-black' 
                    : 'text-gray-700 hover:text-black'
                }`}
              >
                {t('nav.packages')}
              </button>
              <button
                onClick={() => handleNavigation('/b2c')}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  isActive('/b2c')
                    ? 'text-black border-b-2 border-black' 
                    : 'text-gray-700 hover:text-black'
                }`}
              >
                {t('nav.b2c')}
              </button>
              <button
                onClick={() => handleNavigation('/kontakt')}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  isActive('/kontakt')
                    ? 'text-black border-b-2 border-black' 
                    : 'text-gray-700 hover:text-black'
                }`}
              >
                {t('nav.contact')}
              </button>
            </nav>
            
            <div className="flex items-center space-x-4">
              {/* Language Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleLanguage}
                className="text-gray-700 hover:text-black"
              >
                <Globe className="h-4 w-4 mr-2" />
                {i18n.language.toUpperCase()}
              </Button>
              
              {/* Mobile Menu Toggle */}
              <div className="md:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="text-gray-700 hover:text-black focus:outline-none p-2"
                >
                  {isMobileMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed top-16 left-0 w-full bg-white shadow-lg z-40 border-b border-gray-200">
          <div className="px-4 py-4 space-y-4">
            <button 
              onClick={() => handleNavigation('/')} 
              className={`block w-full text-left px-3 py-2 text-base font-medium transition-colors ${
                isActive('/') ? 'text-black bg-gray-50' : 'text-gray-700 hover:text-black hover:bg-gray-50'
              }`}
            >
              {t('nav.home')}
            </button>
            <button 
              onClick={() => handleNavigation('/services')} 
              className={`block w-full text-left px-3 py-2 text-base font-medium transition-colors ${
                isActive('/services') ? 'text-black bg-gray-50' : 'text-gray-700 hover:text-black hover:bg-gray-50'
              }`}
            >
              {t('nav.services')}
            </button>
            <button 
              onClick={() => handleNavigation('/angebote')} 
              className={`block w-full text-left px-3 py-2 text-base font-medium transition-colors ${
                isActive('/angebote') ? 'text-black bg-gray-50' : 'text-gray-700 hover:text-black hover:bg-gray-50'
              }`}
            >
              {t('nav.packages')}
            </button>
            <button 
              onClick={() => handleNavigation('/b2c')} 
              className={`block w-full text-left px-3 py-2 text-base font-medium transition-colors ${
                isActive('/b2c') ? 'text-black bg-gray-50' : 'text-gray-700 hover:text-black hover:bg-gray-50'
              }`}
            >
              {t('nav.b2c')}
            </button>
            <button 
              onClick={() => handleNavigation('/kontakt')} 
              className={`block w-full text-left px-3 py-2 text-base font-medium transition-colors ${
                isActive('/kontakt') ? 'text-black bg-gray-50' : 'text-gray-700 hover:text-black hover:bg-gray-50'
              }`}
            >
              {t('nav.contact')}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
