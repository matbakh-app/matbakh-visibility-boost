
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { isSafeTranslationKey } from '@/lib/i18n-validator';

interface NavigationItemMobileProps {
  item: {
    key: string;
    labelKey: string;
    currentHref: string;
    currentLabel: string;
  };
  language: 'de' | 'en';
  onItemClick: () => void;
}

const NavigationItemMobile: React.FC<NavigationItemMobileProps> = ({ 
  item, 
  language, 
  onItemClick 
}) => {
  const { t } = useTranslation('nav');
  const location = useLocation();
  
  const href = item.currentHref;
  const label = isSafeTranslationKey(item.labelKey)
    ? t(item.labelKey, item.currentLabel)
    : item.currentLabel;
  const isActive = location.pathname === href;

  return (
    <Link
      to={href}
      onClick={onItemClick}
      className={`block w-full text-left px-3 py-2 text-base font-medium transition-colors ${
        isActive
          ? 'text-black bg-gray-50'
          : 'text-gray-700 hover:text-black hover:bg-gray-50'
      }`}
    >
      {label}
    </Link>
  );
};

export default NavigationItemMobile;
