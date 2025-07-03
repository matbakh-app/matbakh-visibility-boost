
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useNavigationUtils } from './navigationUtils';
import { useAuth } from '@/contexts/AuthContext';
import { getVisibleNavItems, validateNavigation } from '../navigation/NavigationConfig';

const NavigationMenu: React.FC = () => {
  const { t } = useTranslation('nav');
  const navigate = useNavigate();
  const { handleNavigation, isActive } = useNavigationUtils();
  const { isAdmin } = useAuth();

  // Validate navigation configuration in development
  if (process.env.NODE_ENV === 'development') {
    validateNavigation();
  }

  const visibleNavItems = getVisibleNavItems(isAdmin);

  const handleClick = (item: any) => {
    if (item.key === 'home' || item.key === 'services' || item.key === 'admin') {
      navigate(item.href);
    } else {
      handleNavigation(item.href);
    }
  };

  return (
    <nav className="hidden md:flex space-x-8">
      {visibleNavItems.map((item) => (
        <button
          key={item.key}
          onClick={() => handleClick(item)}
          className={`px-3 py-2 text-sm font-medium transition-colors ${
            isActive(item.href)
              ? 'text-black border-b-2 border-black' 
              : 'text-gray-700 hover:text-black'
          }`}
        >
          {t(item.translationKey)}
        </button>
      ))}
    </nav>
  );
};

export default NavigationMenu;
