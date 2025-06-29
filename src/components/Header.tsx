
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const Header: React.FC = () => {
  const { i18n, t } = useTranslation();
  const { user, signOut } = useAuth();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'de' ? 'en' : 'de';
    i18n.changeLanguage(newLang);
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-black">matbakh</h1>
            <span className="ml-2 text-sm text-gray-600">
              visibility for hospitality
            </span>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <a href="#services" className="text-gray-700 hover:text-black">
              {t('nav.services')}
            </a>
            <a href="#pricing" className="text-gray-700 hover:text-black">
              {t('nav.pricing')}
            </a>
            <a href="/kontakt" className="text-gray-700 hover:text-black">
              {t('nav.contact')}
            </a>
          </nav>

          {/* Language & Auth */}
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleLanguage}
              className="text-sm text-gray-600 hover:text-black"
            >
              {i18n.language === 'de' ? 'EN' : 'DE'}
            </button>
            
            {user ? (
              <Button variant="outline" onClick={signOut}>
                Abmelden
              </Button>
            ) : (
              <Button variant="default">
                {t('nav.login')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
