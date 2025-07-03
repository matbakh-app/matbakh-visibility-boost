
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useNavigationUtils } from './navigationUtils';
import { useAuth } from '@/contexts/AuthContext';
import { getVisibleNavItems, validateNavigationConfig } from '../navigation/NavigationConfig';

const NavigationMenu: React.FC = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const { isActive } = useNavigationUtils();
  const { isAdmin } = useAuth();

  // Validate navigation configuration in development
  if (process.env.NODE_ENV === 'development') {
    validateNavigationConfig();
  }

  const language = i18n.language as 'de' | 'en';
  const visibleNavItems = getVisibleNavItems(isAdmin, language);

  const handleClick = (item: any) => {
    if (item.key === 'home' || item.key === 'services' || item.key === 'admin') {
      navigate(item.currentHref);
    } else {
      // Use language-aware navigation for other pages
      navigate(item.currentHref);
    }
  };

  return (
    <nav className="hidden md:flex space-x-8">
      {visibleNavItems.map((item) => (
        <button
          key={item.key}
          onClick={() => handleClick(item)}
          className={`px-3 py-2 text-sm font-medium transition-colors ${
            isActive(item.currentHref)
              ? 'text-black border-b-2 border-black' 
              : 'text-gray-700 hover:text-black'
          }`}
        >
          {item.currentLabel}
        </button>
      ))}
    </nav>
  );
};

export default NavigationMenu;
