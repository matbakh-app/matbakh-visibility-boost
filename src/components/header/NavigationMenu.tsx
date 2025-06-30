
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useNavigationUtils } from './navigationUtils';

const NavigationMenu: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { handleNavigation, isActive } = useNavigationUtils();

  return (
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
  );
};

export default NavigationMenu;
