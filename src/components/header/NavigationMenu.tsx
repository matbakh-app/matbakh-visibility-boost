
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useNavigationUtils } from './navigationUtils';
import { useAuth } from '@/contexts/AuthContext';

const NavigationMenu: React.FC = () => {
  const { t } = useTranslation('nav');
  const navigate = useNavigate();
  const { handleNavigation, isActive } = useNavigationUtils();
  const { isAdmin } = useAuth();

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
        {t('home')}
      </button>
      <button
        onClick={() => navigate('/services')}
        className={`px-3 py-2 text-sm font-medium transition-colors ${
          isActive('/services') 
            ? 'text-black border-b-2 border-black' 
            : 'text-gray-700 hover:text-black'
        }`}
      >
        {t('services')}
      </button>
      <button
        onClick={() => handleNavigation('/angebote')}
        className={`px-3 py-2 text-sm font-medium transition-colors ${
          isActive('/angebote')
            ? 'text-black border-b-2 border-black' 
            : 'text-gray-700 hover:text-black'
        }`}
      >
        {t('packages')}
      </button>
      <button
        onClick={() => handleNavigation('/b2c')}
        className={`px-3 py-2 text-sm font-medium transition-colors ${
          isActive('/b2c')
            ? 'text-black border-b-2 border-black' 
            : 'text-gray-700 hover:text-black'
        }`}
      >
        {t('b2c')}
      </button>
      <button
        onClick={() => handleNavigation('/kontakt')}
        className={`px-3 py-2 text-sm font-medium transition-colors ${
          isActive('/kontakt')
            ? 'text-black border-b-2 border-black' 
            : 'text-gray-700 hover:text-black'
        }`}
      >
        {t('contact')}
      </button>
      {isAdmin && (
        <button
          onClick={() => navigate('/admin')}
          className={`px-3 py-2 text-sm font-medium transition-colors ${
            isActive('/admin')
              ? 'text-black border-b-2 border-black' 
              : 'text-gray-700 hover:text-black'
          }`}
        >
          {t('adminPanel')}
        </button>
      )}
    </nav>
  );
};

export default NavigationMenu;
