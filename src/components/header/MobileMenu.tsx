
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, X } from 'lucide-react';
import { useNavigationUtils } from './navigationUtils';

interface MobileMenuProps {
  isOpen: boolean;
  onToggle: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onToggle }) => {
  const { t } = useTranslation('nav');
  const { handleNavigation, isActive } = useNavigationUtils();

  const handleMenuNavigation = (path: string) => {
    handleNavigation(path);
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
            <button 
              onClick={() => handleMenuNavigation('/')} 
              className={`block w-full text-left px-3 py-2 text-base font-medium transition-colors ${
                isActive('/') ? 'text-black bg-gray-50' : 'text-gray-700 hover:text-black hover:bg-gray-50'
              }`}
            >
              {t('home')}
            </button>
            <button 
              onClick={() => handleMenuNavigation('/services')} 
              className={`block w-full text-left px-3 py-2 text-base font-medium transition-colors ${
                isActive('/services') ? 'text-black bg-gray-50' : 'text-gray-700 hover:text-black hover:bg-gray-50'
              }`}
            >
              {t('services')}
            </button>
            <button 
              onClick={() => handleMenuNavigation('/angebote')} 
              className={`block w-full text-left px-3 py-2 text-base font-medium transition-colors ${
                isActive('/angebote') ? 'text-black bg-gray-50' : 'text-gray-700 hover:text-black hover:bg-gray-50'
              }`}
            >
              {t('packages')}
            </button>
            <button 
              onClick={() => handleMenuNavigation('/b2c')} 
              className={`block w-full text-left px-3 py-2 text-base font-medium transition-colors ${
                isActive('/b2c') ? 'text-black bg-gray-50' : 'text-gray-700 hover:text-black hover:bg-gray-50'
              }`}
            >
              {t('b2c')}
            </button>
            <button 
              onClick={() => handleMenuNavigation('/kontakt')} 
              className={`block w-full text-left px-3 py-2 text-base font-medium transition-colors ${
                isActive('/kontakt') ? 'text-black bg-gray-50' : 'text-gray-700 hover:text-black hover:bg-gray-50'
              }`}
            >
              {t('contact')}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileMenu;
