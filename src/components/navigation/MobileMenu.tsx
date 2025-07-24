
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import NavigationItemMobile from './NavigationItemMobile';
import { getVisibleNavItems } from './NavigationConfig';

const MobileMenu: React.FC = () => {
  const { t } = useTranslation('navigation');
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
    navigate('/');
  };

  const handleLogin = () => {
    navigate('/login'); // Fixed: was /business/partner/login
    setIsOpen(false);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const visibleItems = getVisibleNavItems(user?.role);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">{t('menu', 'Menü')}</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[280px] sm:w-[320px]">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between py-4 border-b">
            <h2 className="text-lg font-semibold">{t('navigation', 'Navigation')}</h2>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <nav className="flex-1 py-4">
            <ul className="space-y-2">
              {visibleItems.map((item) => (
                <NavigationItemMobile
                  key={item.key}
                  item={item}
                  onNavigate={handleNavigation}
                />
              ))}
            </ul>
          </nav>

          <div className="border-t pt-4">
            {user ? (
              <div className="space-y-2">
                <div className="px-4 py-2 text-sm text-gray-600">
                  {user.email}
                </div>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => handleNavigation('/dashboard')}
                >
                  {t('dashboard', 'Dashboard')}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => handleNavigation('/dashboard/profile')}
                >
                  {t('profile', 'Profil')}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={handleLogout}
                >
                  {t('logout', 'Abmelden')}
                </Button>
              </div>
            ) : (
              <Button
                variant="default"
                className="w-full"
                onClick={handleLogin}
              >
                {t('login', 'Anmelden')}
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileMenu;
