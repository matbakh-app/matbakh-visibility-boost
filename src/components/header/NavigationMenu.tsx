
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getVisibleNavItems, getNavLink, validateNavigationConfig } from '../navigation/NavigationConfig';
import { useAuth } from '@/contexts/AuthContext';
import { isSafeTranslationKey } from '@/lib/i18n-validator';

// 💡 Dieses File nur ändern, wenn NavigationConfig geändert wurde (Genehmigung!)
if (process.env.NODE_ENV === 'development') {
  console.warn('💡 NavigationMenu.tsx geladen – abhängig von NavigationConfig!');
}

const NavigationMenu: React.FC = () => {
  const { t, i18n } = useTranslation('nav');
  const { isAdmin } = useAuth();
  const location = useLocation();
  const lng = (i18n.language || 'de') as 'de' | 'en';

  // Validate navigation configuration in development
  if (process.env.NODE_ENV === 'development') {
    validateNavigationConfig();
  }

  const visibleItems = getVisibleNavItems(isAdmin, lng);

  return (
    <nav className="hidden md:flex space-x-8">
      {visibleItems.map((item) => {
        const labelKey = item.labelKey;
        const label = isSafeTranslationKey(labelKey) ? t(labelKey) : labelKey;
        const href = getNavLink(item.key, lng);
        const isActive = location.pathname === href;

        return (
          <Link
            key={item.key}
            to={href}
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'text-black border-b-2 border-black' 
                : 'text-gray-700 hover:text-black'
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
};

export default NavigationMenu;
