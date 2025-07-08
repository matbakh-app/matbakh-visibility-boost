
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BarChart3, Globe, TrendingUp, Users, FileText, User, Calendar } from 'lucide-react';

const DashboardNavigation: React.FC = () => {
  const { t } = useTranslation('dashboard');
  const location = useLocation();

  const navItems = [
    {
      path: '/dashboard/overview',
      label: t('tabs.overview'),
      icon: BarChart3
    },
    {
      path: '/dashboard/gmb',
      label: t('tabs.gmb'),
      icon: Globe
    },
    {
      path: '/dashboard/ga4',
      label: t('tabs.ga4'),
      icon: TrendingUp
    },
    {
      path: '/dashboard/social',
      label: t('tabs.social'),
      icon: Users
    },
    {
      path: '/dashboard/reports',
      label: t('tabs.reports'),
      icon: FileText
    },
    {
      path: '/dashboard/profile',
      label: t('tabs.profile', 'Profil'),
      icon: User
    },
    {
      path: '/dashboard/calendar',
      label: t('tabs.calendar', 'Kalender'),
      icon: Calendar
    }
  ];

  return (
    <nav className="border-b border-gray-200 mb-6">
      <div className="flex space-x-8 overflow-x-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default DashboardNavigation;
