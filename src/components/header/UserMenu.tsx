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
        onClick={() => navigate('/business/partner/login')}
        className="hidden md:flex"
      >
        {tNav('login')}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="hidden md:flex">
          {user.email || tAuth('profile')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => navigate('/dashboard')}>
          {tAuth('dashboard')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/dashboard/profile')}>
          {tAuth('profile')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/dashboard/calendar')}>
          {tAuth('calendar')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? tAuth('redirecting') : tAuth('logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;