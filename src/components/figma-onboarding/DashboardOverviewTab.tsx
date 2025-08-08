import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Gift } from 'lucide-react';
import { UsageLimitCard, CostPreviewCard } from './UsageLimitCard';
import { AnalysisStartSection, AnalysisQueueStatus } from './AnalysisStartSection';
import { DashboardQuickActions } from './DashboardQuickActions';
import { FormDebugCard } from './FormDebugCard';
import { UserPlan } from '@/types/app';

type ViewType = 'step1' | 'step2' | 'dashboard' | 'results';
type UserType = 'restaurant' | 'admin' | 'guest';

interface RestaurantFormData {
  restaurantName: string;
  location: string;
  website: string;
  category: string;
}

interface WebsiteAnalysisFormData {
  url: string;
  competitor1: string;
  competitor2: string;
  targetAudience: string;
}

interface DashboardOverviewTabProps {
  // State
  userPlan: UserPlan;
  userType: UserType;
  activeView: ViewType;
  usageData: { used: number; total: number | 'unlimited' };
  canStart: boolean;
  showCostPreview: boolean;
  isAnalysisRunning: boolean;
  analysisQueue: number | null;
  restaurantData: RestaurantFormData | null;
  websiteAnalysisData: WebsiteAnalysisFormData | null;
  
  // Event handlers
  onUpgrade: () => void;
  onPurchaseAnalysis: () => void;
  onStartAnalysis: () => void;
  onScheduleChange: (enabled: boolean, time: string, emailNotification: boolean) => void;
  onNavigateToView: (view: ViewType) => void;
  onSetUserType: (userType: UserType) => void;
  onBackToVCLanding: () => void;
}

export function DashboardOverviewTab({
  userPlan,
  userType,
  activeView,
  usageData,
  canStart,
  showCostPreview,
  isAnalysisRunning,
  analysisQueue,
  restaurantData,
  websiteAnalysisData,
  onUpgrade,
  onPurchaseAnalysis,
  onStartAnalysis,
  onScheduleChange,
  onNavigateToView,
  onSetUserType,
  onBackToVCLanding
}: DashboardOverviewTabProps) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <UsageLimitCard
            plan={userPlan}
            used={usageData.used}
            total={usageData.total}
            resetTime="00:00"
            onUpgrade={onUpgrade}
          />
        </div>
        
        <div className="space-y-6">
          <Card className="p-4 card-dark-enhanced">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center">
                <Gift className="w-4 h-4 text-success" />
              </div>
              <div>
                <h4 className="font-medium text-sm">🎁 Promo-Code?</h4>
                <p className="text-xs text-muted-foreground">Zusätzliche Analysen freischalten</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Input placeholder="Code eingeben" className="text-sm h-8 input-dark-enhanced" />
              <Button size="sm" className="h-8 btn-hover-enhanced">Einlösen</Button>
            </div>
          </Card>

          {showCostPreview && (
            <CostPreviewCard
              isVisible={true}
              costPerAnalysis={4.99}
              onPurchase={onPurchaseAnalysis}
              onWaitUntilTomorrow={() => console.log('Waiting until tomorrow')}
            />
          )}
          
          {analysisQueue && (
            <AnalysisQueueStatus
              queuePosition={analysisQueue}
              estimatedWaitTime="2-3 Minuten"
              isPriority={userType === 'guest' || userPlan === 'premium'}
            />
          )}
        </div>
      </div>

      <AnalysisStartSection
        canStartAnalysis={canStart}
        isAnalysisRunning={isAnalysisRunning}
        estimatedDuration="3-5 Minuten"
        onStartAnalysis={onStartAnalysis}
        onScheduleChange={onScheduleChange}
      />

      <DashboardQuickActions 
        userPlan={userPlan}
        onNavigateToView={onNavigateToView}
      />

      <FormDebugCard 
        restaurantData={{
          restaurantName: 'Sample Restaurant',
          address: 'Sample Address',
          mainCategory: 'Restaurant',
          priceRange: '€€'
        }}
        websiteAnalysisData={{
          website: 'https://example.com',
          email: 'test@example.com',
          emailConfirmed: false,
          benchmarks: {
            local: false,
            regional: false,
            national: false
          }
        }}
        onNavigateToView={onNavigateToView}
        onStartAnalysis={onStartAnalysis}
      />
    </div>
  );
}