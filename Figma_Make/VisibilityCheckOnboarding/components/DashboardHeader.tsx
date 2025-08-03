import React from 'react';
import { Button } from './ui/button';
import { BarChart3, Bell, Shield, Crown } from 'lucide-react';
import { AIStatusIndicator, UsageCounter } from './AIStatusIndicator';
import { UserPlan, AIStatus, UsageData } from '../types/app';

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
  return (
    <header className="border-b bg-white sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold">Visibility Check</h1>
            </div>
            
            <AIStatusIndicator status={aiStatus} />
          </div>
          
          <div className="flex items-center gap-4">
            <UsageCounter 
              used={usageData.used} 
              total={usageData.total} 
              plan={userPlan} 
            />
            
            <Button variant="ghost" size="sm">
              <Bell className="w-4 h-4" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onAdminToggle}
              className={isAdmin ? 'bg-warning/10 text-warning' : ''}
            >
              <Shield className="w-4 h-4" />
              {isAdmin && <span className="ml-1 text-xs">Admin</span>}
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={onUpgrade}
            >
              {userPlan === 'premium' ? (
                <>
                  <Crown className="w-4 h-4 mr-2 text-warning" />
                  Premium
                </>
              ) : (
                <>
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}