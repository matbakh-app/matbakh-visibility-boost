
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, X } from 'lucide-react';
import { useNavigationUtils } from './navigationUtils';
import { getVisibleNavItems } from '../navigation/NavigationConfig';
import { useAuth } from '@/contexts/AuthContext';

interface MobileMenuProps {
  isOpen: boolean;
  onToggle: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onToggle }) => {
  const { t } = useTranslation('nav');
  const { handleNavigation, isActive } = useNavigationUtils();
  const { isAdmin } = useAuth();

  const visibleNavItems = getVisibleNavItems(isAdmin);

  const handleMenuNavigation = (item: any) => {
    if (item.key === 'home' || item.key === 'services' || item.key === 'admin') {
      // Direct navigation for these pages
      window.location.href = item.href;
    } else {
      handleNavigation(item.href);
    }
    onToggle();
  };

  return (
    <>
      {/* Mobile Menu Toggle */}
      <div className="md:hidden">
        <button
          onClick={onToggle}
          className="text-gray-700 hover:text-black focus:outline-none p-2"
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="md:hidden fixed top-16 left-0 w-full bg-white shadow-lg z-40 border-b border-gray-200">
          <div className="px-4 py-4 space-y-4">
            {visibleNavItems.map((item) => (
              <button 
                key={item.key}
                onClick={() => handleMenuNavigation(item)} 
                className={`block w-full text-left px-3 py-2 text-base font-medium transition-colors ${
                  isActive(item.href) ? 'text-black bg-gray-50' : 'text-gray-700 hover:text-black hover:bg-gray-50'
                }`}
              >
                {t(item.translationKey)}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default MobileMenu;
