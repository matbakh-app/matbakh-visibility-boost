
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const UserMenu: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { t: tNav } = useTranslation('nav');
  const { t: tAuth } = useTranslation('auth');
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!user) {
    return (
      <Button
        variant="outline"
        onClick={() => navigate('/login')}
        className=""
      >
        {tNav('login', 'Login')}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="">
          {user.email || tAuth('profile', 'Profil')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => navigate('/dashboard')}>
          {tAuth('dashboard', 'Dashboard')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/dashboard/profile')}>
          {tAuth('profile', 'Profil')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/dashboard/calendar')}>
          {tAuth('calendar', 'Kalender')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? tAuth('redirecting', 'Lädt...') : tAuth('logout', 'Abmelden')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
