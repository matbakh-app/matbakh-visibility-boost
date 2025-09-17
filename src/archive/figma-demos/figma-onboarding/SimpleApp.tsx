import React, { useState } from 'react';
import { I18nProvider } from '@/contexts/i18nContext';
import { ThemeProvider } from '@/contexts/themeContext';
import { AILoadingScreen } from './AILoadingScreen';
import { AIResultsScreen } from './AIResultsScreen';
import { AnalysisCard } from './AnalysisCard';
import { LanguageSwitch } from './LanguageSwitch';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlan } from '@/types/app';
import { useI18n } from '@/contexts/i18nContext';

function AppContent() {
  const [activeView, setActiveView] = useState<'dashboard' | 'loading' | 'results'>('dashboard');
  const [userPlan, setUserPlan] = useState<UserPlan>('business');
  const { language } = useI18n();

  const mockUsageData = {
    used: 5,
    total: 20
  };

  if (activeView === 'loading') {
    return (
      <AILoadingScreen
        isVisible={true}
        onComplete={() => setActiveView('results')}
        onCancel={() => setActiveView('dashboard')}
        userPlan={userPlan}
        usedAnalyses={mockUsageData.used}
        totalAnalyses={mockUsageData.total}
      />
    );
  }

  if (activeView === 'results') {
    return (
      <AIResultsScreen
        userPlan={userPlan}
        onBack={() => setActiveView('dashboard')}
        onUpgrade={() => setUserPlan('premium')}
        onScheduleNext={() => setActiveView('dashboard')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold">Matbakh Analytics</h1>
            <div className="flex items-center gap-3">
              <LanguageSwitch />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Restaurant Visibility Dashboard</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Analyze your restaurant's online visibility across multiple platforms.
              </p>
              <div className="flex gap-4">
                <Button onClick={() => setActiveView('loading')}>
                  Start Analysis
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setActiveView('results')}
                >
                  View Results
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnalysisCard
              title="Google Business Profile"
              score={85}
              status="success"
              platform="Google"
              description="Your Google Business Profile is well optimized with complete information."
              recommendations={[
                "Add more customer photos",
                "Respond to recent reviews",
                "Update business hours for holidays"
              ]}
            />
            
            <AnalysisCard
              title="Social Media Presence"
              score={65}
              status="warning"
              platform="Facebook & Instagram"
              description="Your social media presence needs improvement."
              recommendations={[
                "Post more regularly",
                "Engage with customer comments",
                "Use relevant hashtags"
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SimpleApp() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AppContent />
      </I18nProvider>
    </ThemeProvider>
  );
}