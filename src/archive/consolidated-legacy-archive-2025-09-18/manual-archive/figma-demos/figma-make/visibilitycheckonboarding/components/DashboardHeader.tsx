import React from 'react';
import { Button } from './ui/button';
import { LanguageSwitch } from './LanguageSwitch';
import { ThemeToggle } from './ThemeToggle';
import { BarChart3, Bell, Shield, Crown } from 'lucide-react';
import { AIStatusIndicator, UsageCounter } from './AIStatusIndicator';
import { UserPlan, AIStatus, UsageData } from '../types/app';
import { useI18n } from '../contexts/i18nContext';

interface DashboardHeaderProps {
  aiStatus: AIStatus;
  usageData: UsageData;
  userPlan: UserPlan;
  isAdmin: boolean;
  onAdminToggle: () => void;
  onUpgrade: () => void;
}

export function DashboardHeader({
  aiStatus,
  usageData,
  userPlan,
  isAdmin,
  onAdminToggle,
  onUpgrade
}: DashboardHeaderProps) {
  const { language } = useI18n();
  
  const texts = {
    de: {
      title: "Sichtbarkeitsanalyse starten",
      admin: "Admin",
      premium: "Premium",
      upgrade: "Upgrade"
    },
    en: {
      title: "Start Visibility Check",
      admin: "Admin", 
      premium: "Premium",
      upgrade: "Upgrade"
    }
  };

  const t = texts[language];

  return (
    <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10 theme-transition">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold">{t.title}</h1>
            </div>
            
            <AIStatusIndicator status={aiStatus} />
          </div>
          
          <div className="flex items-center gap-3">
            <UsageCounter 
              used={usageData.used} 
              total={usageData.total} 
              plan={userPlan} 
            />
            
            <Button variant="ghost" size="sm" className="btn-hover-enhanced">
              <Bell className="w-4 h-4" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onAdminToggle}
              className={`btn-hover-enhanced ${isAdmin ? 'bg-warning/10 text-warning' : ''}`}
            >
              <Shield className="w-4 h-4" />
              {isAdmin && <span className="ml-1 text-xs">{t.admin}</span>}
            </Button>

            <LanguageSwitch variant="compact" />
            
            <ThemeToggle variant="icon-only" size="sm" />
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={onUpgrade}
              className="btn-hover-enhanced"
            >
              {userPlan === 'premium' ? (
                <>
                  <Crown className="w-4 h-4 mr-2 text-warning" />
                  {t.premium}
                </>
              ) : (
                <>
                  <Crown className="w-4 h-4 mr-2" />
                  {t.upgrade}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}