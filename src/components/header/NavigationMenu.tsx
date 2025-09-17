
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getVisibleNavItems, getNavLink, validateNavigationConfig } from '../navigation/NavigationConfig';
import { useAuthUnified } from '@/hooks/useAuthUnified';
import { isSafeTranslationKey } from '@/lib/i18n-validator';

// 💡 Dieses File nur ändern, wenn NavigationConfig geändert wurde (Genehmigung!)
if (process.env.NODE_ENV === 'development') {
  console.warn('💡 NavigationMenu.tsx geladen – abhängig von NavigationConfig!');
}

const NavigationMenu: React.FC = () => {
  const { t, i18n } = useTranslation('navigation');
  const { isAdmin } = useAuthUnified();
  const location = useLocation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
  const lng = (currentLanguage || 'de') as 'de' | 'en';

  // Listen for language changes
  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      setCurrentLanguage(lng);
    };

    i18n.on('languageChanged', handleLanguageChange);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  // Validate navigation configuration in development
  if (process.env.NODE_ENV === 'development') {
    validateNavigationConfig();
  }

  const visibleItems = getVisibleNavItems(isAdmin, lng);

  return (
    <nav className="hidden md:flex space-x-8">
      {visibleItems.map((item) => {
        const labelKey = item.labelKey.replace('nav.', '');
        const label = isSafeTranslationKey(labelKey) ? t(labelKey, item.currentLabel) : item.currentLabel;
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
