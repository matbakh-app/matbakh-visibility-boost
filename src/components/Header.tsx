
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import Logo from './Logo';

const Header: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

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
        .replace('/agb', '/terms');
    } else {
      newPath = currentPath
        .replace('/contact', '/kontakt')
        .replace('/imprint', '/impressum')
        .replace('/privacy', '/datenschutz')
        .replace('/terms', '/agb');
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
        .replace('/agb', '/terms');
    }
    
    navigate(translatedPath);
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <button 
              onClick={() => navigate('/')}
              className="flex items-center"
            >
              <Logo size="md" className="mr-3" />
              <span className="text-xl font-bold text-black">matbakh</span>
            </button>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            <button
              onClick={() => handleNavigation('/kontakt')}
              className="text-gray-700 hover:text-black px-3 py-2 text-sm font-medium"
            >
              {t('nav.contact')}
            </button>
          </nav>
          
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              className="text-gray-700 hover:text-black"
            >
              <Globe className="h-4 w-4 mr-2" />
              {i18n.language.toUpperCase()}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
