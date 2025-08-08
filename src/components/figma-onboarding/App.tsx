import React, { useState } from 'react';
import { I18nProvider } from '@/contexts/i18nContext';
import { ThemeProvider } from '@/contexts/themeContext';
import { AILoadingScreen } from './AILoadingScreen';
import { AIResultsScreen } from './AIResultsScreen';
import { AnalysisCard } from './AnalysisCard';
import { AdminPromoConsole } from './AdminPromoConsole';
import { BusinessIntelligenceDashboard } from './BusinessIntelligenceDashboard';
import { CompetitiveIntelligenceDashboard } from './CompetitiveIntelligenceDashboard';
import { CustomerDemographicsDashboard } from './CustomerDemographicsDashboard';
import { CompanyProfile } from './CompanyProfile';
import { LanguageSwitch } from './LanguageSwitch';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlan } from '@/types/app';
import { useI18n } from '@/contexts/i18nContext';

type ViewType = 'dashboard' | 'loading' | 'results' | 'admin' | 'business-intelligence' | 'competitive-intelligence' | 'customer-demographics' | 'company-profile';

function AppContent() {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [userPlan, setUserPlan] = useState<UserPlan>('business');
  const [isAdmin, setIsAdmin] = useState(false);
  const { language } = useI18n();

  const mockUsageData = {
    used: 5,
    total: 20
  };

  const mockCompanyData = {
    companyName: 'Sample Restaurant',
    logo: '',
    address: {
      street: 'Main Street 123',
      zipCode: '12345',
      city: 'Sample City'
    },
    taxId: '123456789'
  };

  // Loading Screen
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

  // Results Screen
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

  // Admin Console
  if (activeView === 'admin') {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <h1 className="text-xl font-bold">Admin Console</h1>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={() => setActiveView('dashboard')}>
                  Back to Dashboard
                </Button>
                <LanguageSwitch />
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AdminPromoConsole />
        </div>
      </div>
    );
  }

  // Business Intelligence
  if (activeView === 'business-intelligence') {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <h1 className="text-xl font-bold">Business Intelligence</h1>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={() => setActiveView('dashboard')}>
                  Back to Dashboard
                </Button>
                <LanguageSwitch />
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <BusinessIntelligenceDashboard 
            userPlan={userPlan}
            dateRange="30d"
            onDateRangeChange={() => {}}
          />
        </div>
      </div>
    );
  }

  // Competitive Intelligence
  if (activeView === 'competitive-intelligence') {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <h1 className="text-xl font-bold">Competitive Intelligence</h1>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={() => setActiveView('dashboard')}>
                  Back to Dashboard
                </Button>
                <LanguageSwitch />
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <CompetitiveIntelligenceDashboard 
            userPlan={userPlan}
            onUpgrade={() => setUserPlan('premium')}
          />
        </div>
      </div>
    );
  }

  // Customer Demographics
  if (activeView === 'customer-demographics') {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <h1 className="text-xl font-bold">Customer Demographics</h1>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={() => setActiveView('dashboard')}>
                  Back to Dashboard
                </Button>
                <LanguageSwitch />
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <CustomerDemographicsDashboard 
            userPlan={userPlan}
            onUpgrade={() => setUserPlan('premium')}
          />
        </div>
      </div>
    );
  }

  // Company Profile
  if (activeView === 'company-profile') {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <h1 className="text-xl font-bold">Company Profile</h1>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={() => setActiveView('dashboard')}>
                  Back to Dashboard
                </Button>
                <LanguageSwitch />
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <CompanyProfile
            onSave={(data) => {
              console.log('Company data saved:', data);
              setActiveView('dashboard');
            }}
            onBack={() => setActiveView('dashboard')}
            initialData={mockCompanyData}
          />
        </div>
      </div>
    );
  }

  // Main Dashboard
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold">Matbakh Analytics Dashboard</h1>
            <div className="flex items-center gap-3">
              {isAdmin && (
                <Button variant="outline" onClick={() => setActiveView('admin')}>
                  Admin Console
                </Button>
              )}
              <Button variant="outline" onClick={() => setIsAdmin(!isAdmin)}>
                {isAdmin ? 'Exit Admin' : 'Admin Mode'}
              </Button>
              <LanguageSwitch />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="business-intel">Business Intel</TabsTrigger>
            <TabsTrigger value="competitive">Competitive</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
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
          </TabsContent>

          <TabsContent value="analysis">
            <Card>
              <CardHeader>
                <CardTitle>Analysis Results</CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={() => setActiveView('results')}>
                  View Detailed Analysis
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="business-intel">
            <Card>
              <CardHeader>
                <CardTitle>Business Intelligence</CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={() => setActiveView('business-intelligence')}>
                  Open Business Intelligence Dashboard
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="competitive">
            <Card>
              <CardHeader>
                <CardTitle>Competitive Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={() => setActiveView('competitive-intelligence')}>
                  Open Competitive Intelligence Dashboard
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="customers">
            <Card>
              <CardHeader>
                <CardTitle>Customer Demographics</CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={() => setActiveView('customer-demographics')}>
                  Open Customer Demographics Dashboard
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Company Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={() => setActiveView('company-profile')}>
                  Edit Company Profile
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AppContent />
      </I18nProvider>
    </ThemeProvider>
  );
}