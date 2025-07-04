
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { getNavLink, getVisibleNavItems } from './NavigationConfig';
import { isSafeTranslationKey } from '@/lib/i18n-validator';
import { useAuth } from '@/contexts/AuthContext';

interface MobileMenuProps {
  isOpen: boolean;
  onToggle: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onToggle }) => {
  const { t, i18n } = useTranslation('nav');
  const { isAdmin } = useAuth();
  const location = useLocation();
  const lng = (i18n.language || 'de') as 'de' | 'en';

  const visibleItems = getVisibleNavItems(isAdmin, lng);

  return (
    <>
      {/* Toggle Button */}
      <div className="md:hidden">
        <button
          onClick={onToggle}
          className="text-gray-700 hover:text-black focus:outline-none p-2"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div className="md:hidden fixed top-16 left-0 w-full bg-white shadow-lg z-40 border-b border-gray-200">
          <div className="px-4 py-4 space-y-4">
            {visibleItems.map((item) => {
              const href = getNavLink(item.key, lng);
              const label = isSafeTranslationKey(item.labelKey)
                ? t(item.labelKey)
                : item.labelKey;
              const isActive = location.pathname === href;

              return (
                <Link
                  key={item.key}
                  to={href}
                  onClick={onToggle}
                  className={`block w-full text-left px-3 py-2 text-base font-medium transition-colors ${
                    isActive
                      ? 'text-black bg-gray-50'
                      : 'text-gray-700 hover:text-black hover:bg-gray-50'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};

export default MobileMenu;
