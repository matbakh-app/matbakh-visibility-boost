
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, X, User, LogOut } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getNavLink, getVisibleNavItems } from './NavigationConfig';
import { isSafeTranslationKey } from '@/lib/i18n-validator';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

// 💡 Dieses File nur ändern, wenn NavigationConfig geändert wurde (Genehmigung!)
if (process.env.NODE_ENV === 'development') {
  console.warn('💡 MobileMenu.tsx geladen – abhängig von NavigationConfig!');
}

interface MobileMenuProps {
  isOpen: boolean;
  onToggle: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onToggle }) => {
  const { t, i18n } = useTranslation('nav');
  const { t: tAuth } = useTranslation('auth');
  const { user, signOut, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const lng = (i18n.language || 'de') as 'de' | 'en';

  const visibleItems = getVisibleNavItems(isAdmin, lng);

  const handleLogin = () => {
    navigate('/business/partner/login');
    onToggle();
  };

  const handleLogout = async () => {
    try {
      await signOut();
      onToggle();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleDashboard = () => {
    navigate('/dashboard');
    onToggle();
  };

  const handleProfile = () => {
    navigate('/dashboard/profile');
    onToggle();
  };

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
            {/* Navigation Items */}
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

            {/* Divider */}
            <div className="border-t border-gray-200 my-4"></div>

            {/* Auth Section */}
            {!user ? (
              <div className="space-y-2">
                <Button
                  onClick={handleLogin}
                  variant="outline"
                  className="w-full justify-start"
                >
                  {t('login')}
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {/* User Info */}
                <div className="flex items-center px-3 py-2 text-sm text-gray-600">
                  <User className="h-4 w-4 mr-2" />
                  {user.email}
                </div>
                
                {/* Dashboard Link */}
                <button
                  onClick={handleDashboard}
                  className="w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-black hover:bg-gray-50 transition-colors"
                >
                  {tAuth('dashboard')}
                </button>

                {/* Profile Link */}
                <button
                  onClick={handleProfile}
                  className="w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-black hover:bg-gray-50 transition-colors"
                >
                  {tAuth('profile')}
                </button>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-3 py-2 text-base font-medium text-gray-700 hover:text-black hover:bg-gray-50 transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {tAuth('logout')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default MobileMenu;
