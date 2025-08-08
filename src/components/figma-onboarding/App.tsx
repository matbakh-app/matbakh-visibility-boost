import React, { useState } from 'react';
import { I18nProvider } from '@/contexts/i18nContext';
import { ThemeProvider } from '@/contexts/themeContext';
import { DashboardHeader } from './DashboardHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent } from '@/components/ui/tabs';

// Mock components for missing imports
const UsageLimitManager = ({ children }: any) => <div>{children}</div>;
const PromoCodeSystem = ({ children }: any) => <div>{children}</div>;
const AdminPromoConsole = ({ children }: any) => <div>{children}</div>;
const BusinessIntelligenceDashboard = () => <div>Business Intelligence Dashboard - Coming Soon</div>;
const CompetitiveIntelligenceDashboard = () => <div>Competitive Intelligence Dashboard - Coming Soon</div>;
const FinancialAnalyticsDashboard = () => <div>Financial Analytics Dashboard - Coming Soon</div>;
const CustomerDemographicsDashboard = () => <div>Customer Demographics Dashboard - Coming Soon</div>;
const AILoadingScreen = ({ onComplete, onCancel }: any) => (
  <div className="p-8">
    <h2>AI Loading...</h2>
    <Button onClick={() => onComplete?.()}>Complete</Button>
    <Button onClick={() => onCancel?.()}>Cancel</Button>
  </div>
);
const AIResultsScreen = ({ onBack }: any) => (
  <div className="p-8">
    <h2>AI Results</h2>
    <Button onClick={() => onBack?.()}>Back</Button>
  </div>
);
const GuestLandingPage = ({ onCodeValidated, onContinueWithoutCode, onLogin }: any) => (
  <div className="p-8">
    <h2>Guest Landing Page</h2>
    <Button onClick={() => onCodeValidated?.()}>Validate Code</Button>
    <Button onClick={() => onContinueWithoutCode?.()}>Continue Without Code</Button>
    <Button onClick={() => onLogin?.()}>Login</Button>
  </div>
);
const GuestResultsScreen = ({ onBack }: any) => (
  <div className="p-8">
    <h2>Guest Results</h2>
    <Button onClick={() => onBack?.()}>Back</Button>
  </div>
);
const SmartSchedulingInterface = ({ userPlan, onUpgrade, ...props }: any) => (
  <div className="p-4">
    <h3>Smart Scheduling Interface - Coming Soon</h3>
    <Button onClick={() => onUpgrade?.()}>Upgrade</Button>
  </div>
);
const AnalysisCard = ({ title, ...props }: any) => <Card className="p-4"><h3>{title}</h3></Card>;
const MetricCard = ({ title, ...props }: any) => <Card className="p-4"><h3>{title}</h3></Card>;
const PaywallOverlay = ({ children }: any) => <div>{children}</div>;
const ScoreCard = ({ title, score }: any) => <Card className="p-4"><h3>{title}: {score}</h3></Card>;
const MultiScoreCard = ({ title, scores }: any) => <Card className="p-4"><h3>{title}</h3></Card>;
const RestaurantInfoStep = ({ onNext, onBack }: any) => (
  <div className="p-8">
    <h2>Restaurant Info Step</h2>
    <Button onClick={() => onNext?.()}>Next</Button>
    <Button onClick={() => onBack?.()}>Back</Button>
  </div>
);
const WebsiteAnalysisStep = ({ onNext, onBack }: any) => (
  <div className="p-8">
    <h2>Website Analysis Step</h2>
    <Button onClick={() => onNext?.()}>Next</Button>
    <Button onClick={() => onBack?.()}>Back</Button>
  </div>
);
const DashboardTabs = ({ isAdmin }: any) => <div>Dashboard Tabs</div>;
const ResultsTabContent = ({ userPlan, onResultsView }: any) => (
  <TabsContent value="results">
    <div className="p-4">
      <h3>Results Content</h3>
      <Button onClick={() => onResultsView?.()}>View Results</Button>
    </div>
  </TabsContent>
);
const DashboardOverviewTab = ({ onStartAnalysis }: any) => (
  <div className="p-4">
    <h3>Dashboard Overview</h3>
    <Button onClick={() => onStartAnalysis?.()}>Start Analysis</Button>
  </div>
);
const MyProfile = ({ onBack }: any) => (
  <div className="p-8">
    <h2>My Profile</h2>
    <Button onClick={() => onBack?.()}>Back</Button>
  </div>
);
const CompanyProfile = ({ onSave, onBack }: any) => (
  <div className="p-8">
    <h2>Company Profile</h2>
    <Button onClick={() => onSave?.({})}>Save</Button>
    <Button onClick={() => onBack?.()}>Back</Button>
  </div>
);
const LanguageSwitch = ({ variant }: any) => <Button variant="outline">Language</Button>;
const ThemeToggle = ({ variant }: any) => <Button variant="outline">Theme</Button>;

import { useLanguage } from '@/hooks/useLanguage';

// Mock types and utilities
type UserPlan = 'basic' | 'business' | 'premium';
type AIStatus = 'ready' | 'loading' | 'error';
type UserType = 'guest' | 'registered';
type GuestCodeInfo = { code: string; valid: boolean };
type RestaurantFormData = { name: string; address: string };
type WebsiteAnalysisFormData = { website: string; emailConfirmed?: boolean; benchmarks?: any };
type ScheduleSettings = { enabled: boolean; time: string; weekdays: string[]; emailNotification: boolean };

// Mock utility functions
const getUsageData = (plan: UserPlan) => ({ used: 2, total: plan === 'basic' ? 5 : plan === 'business' ? 25 : 100 });
const canStartAnalysis = (plan: UserPlan, usage: any, userType: UserType) => usage.used < usage.total;
const shouldShowCostPreview = (canStart: boolean, plan: UserPlan, userType: UserType) => !canStart && plan === 'basic';
const getPlanDescription = (plan: UserPlan) => `${plan} Plan`;
const getUpgradeFeatures = (plan: UserPlan) => ['Feature 1', 'Feature 2'];
const getUpgradeTitle = (plan: UserPlan) => `Upgrade from ${plan}`;

// Mock data
const mockAnalysisData = [{ title: 'Google My Business Optimierung', description: 'Test analysis' }];
const PLATFORM_SCORES = [{ name: 'Google', score: 85 }];
const METRIC_CARDS_DATA = [{ title: 'Visibility', value: '78%' }];

// Mock hooks
const useAppNavigation = () => {
  const [activeView, setActiveView] = React.useState('landing');
  return { activeView, navigateToView: setActiveView };
};

const createAppEventHandlers = (...args: any[]) => ({
  handleGuestCodeValidated: () => {},
  handleContinueWithoutCode: () => {},
  handleLogin: () => {},
  handleAnalysisComplete: () => {},
  handleAnalysisCancel: () => {},
  handleBackToVCLanding: () => {},
  handleGuestCreateAccount: () => {},
  handleEmailResults: () => {},
  handleBackToDashboard: () => {},
  handleStep1Complete: () => {},
  handleStep2Complete: () => {},
  handleBackToStep1: () => {},
  handlePurchaseAnalysis: () => {},
  handleStartAnalysis: () => {},
  handleScheduleChange: () => {},
  handleSmartScheduleChange: () => {}
});

// Company Profile Data Type
interface CompanyProfileData {
  companyName: string;
  logo: string;
  address: {
    street: string;
    zipCode: string;
    city: string;
  };
  taxId: string;
  vatNumber: string;
  legalForm: string;
  website: string;
  socialMedia: {
    twitter: string;
    facebook: string;
    instagram: string;
  };
  competitors: string[];
}

function AppContent() {
  // Core state
  const [currentStep, setCurrentStep] = useState(1);
  const [showPaywall, setShowPaywall] = useState(false);
  const [restaurantData, setRestaurantData] = useState<RestaurantFormData | null>(null);
  const [websiteAnalysisData, setWebsiteAnalysisData] = useState<WebsiteAnalysisFormData | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Profile state
  const [companyProfileData, setCompanyProfileData] = useState<CompanyProfileData | null>(null);

  // User type and guest state - Reset to original guest state
  const [userType, setUserType] = useState<UserType>('guest');
  const [guestCodeInfo, setGuestCodeInfo] = useState<GuestCodeInfo | null>(null);

  // AI and Usage state
  const [aiStatus, setAiStatus] = useState<AIStatus>('ready');
  const [userPlan, setUserPlan] = useState<UserPlan>('business');
  const [isAnalysisRunning, setIsAnalysisRunning] = useState(false);
  const [analysisQueue, setAnalysisQueue] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState('30d');

  // Scheduling state
  const [scheduleSettings, setScheduleSettings] = useState<ScheduleSettings>({
    enabled: false,
    time: '08:00',
    weekdays: ['mo', 'di', 'mi', 'do', 'fr'],
    emailNotification: true
  });

  // Navigation hook - Back to original behavior (starts with 'landing')
  const { activeView, navigateToView } = useAppNavigation();
  const { language } = useLanguage();

  // Computed values
  const usageData = getUsageData(userPlan);
  const canStart = canStartAnalysis(userPlan, usageData, userType);
  const showCostPreview = shouldShowCostPreview(canStart, userPlan, userType);

  const resetFormData = () => {
    setRestaurantData(null);
    setWebsiteAnalysisData(null);
    setCurrentStep(1);
  };

  // Event handlers
  const eventHandlers = createAppEventHandlers(
    setRestaurantData,
    setWebsiteAnalysisData,
    setCurrentStep,
    setIsAnalysisRunning,
    setAiStatus,
    setAnalysisQueue,
    setGuestCodeInfo,
    setUserType,
    setUserPlan,
    setScheduleSettings,
    userType,
    userPlan,
    canStart,
    navigateToView,
    resetFormData
  );

  // Profile event handlers
  const handleCompanyProfileSave = (data: CompanyProfileData) => {
    setCompanyProfileData(data);
    console.log('Company profile saved:', data);
    // In real app, this would be an API call
    navigateToView('profile');
  };

  // Settings texts
  const settingsTexts = {
    de: {
      title: "Account Einstellungen",
      currentPlan: "Aktueller Plan",
      changePlan: "Plan ändern",
      language: "Sprache / Language",
      languageDesc: "Interface language settings",
      designTheme: "Design Theme",
      themeDesc: "Light, dark or system preference",
      userType: "User Type",
      userTypeDesc: (type: UserType) => type === 'guest' ? 'Guest User (Code-basiert)' : 'Registered User',
      guestMode: "Guest Mode",
      adminMode: "Admin-Modus",
      adminDesc: "Zugriff auf Admin-Features und Promo-Code-Management",
      activate: "Aktivieren",
      deactivate: "Deaktivieren",
      activeScheduling: "Aktives Scheduling",
      dailyTime: "Zeit: Täglich um",
      weekdaysSelected: "Wochentage:",
      emailStatus: "Email:",
      profileSettings: "Profil Einstellungen",
      profileDesc: "Persönliche und Firmen-Profile verwalten",
      manageProfile: "Profil verwalten"
    },
    en: {
      title: "Account Settings",
      currentPlan: "Current Plan",
      changePlan: "Change Plan",
      language: "Language / Sprache",
      languageDesc: "Interface language settings", 
      designTheme: "Design Theme",
      themeDesc: "Light, dark or system preference",
      userType: "User Type",
      userTypeDesc: (type: UserType) => type === 'guest' ? 'Guest User (Code-based)' : 'Registered User',
      guestMode: "Guest Mode",
      adminMode: "Admin Mode",
      adminDesc: "Access to admin features and promo code management",
      activate: "Activate",
      deactivate: "Deactivate",
      activeScheduling: "Active Scheduling",
      dailyTime: "Time: Daily at",
      weekdaysSelected: "Weekdays:",
      emailStatus: "Email:",
      profileSettings: "Profile Settings",
      profileDesc: "Manage personal and company profiles",
      manageProfile: "Manage Profile"
    }
  };

  const st = settingsTexts[language];

  // View Rendering
  if (activeView === 'landing') {
    return (
      <GuestLandingPage
        onCodeValidated={eventHandlers.handleGuestCodeValidated}
        onContinueWithoutCode={eventHandlers.handleContinueWithoutCode}
        onLogin={eventHandlers.handleLogin}
      />
    );
  }

  if (activeView === 'profile') {
    return (
      <MyProfile
        onNavigateToCompanyProfile={() => navigateToView('company-profile')}
        onBack={() => navigateToView('dashboard')}
      />
    );
  }

  if (activeView === 'company-profile') {
    return (
      <CompanyProfile
        onSave={handleCompanyProfileSave}
        onBack={() => navigateToView('profile')}
        initialData={companyProfileData || {
          website: websiteAnalysisData?.website || '',
          competitors: [
            websiteAnalysisData?.benchmarks?.benchmark1,
            websiteAnalysisData?.benchmarks?.benchmark2,
            websiteAnalysisData?.benchmarks?.benchmark3
          ].filter(Boolean) || []
        }}
      />
    );
  }

  if (activeView === 'loading') {
    return (
      <AILoadingScreen
        isVisible={true}
        onComplete={eventHandlers.handleAnalysisComplete}
        onCancel={eventHandlers.handleAnalysisCancel}
        userPlan={userType === 'guest' ? 'premium' : userPlan}
        usedAnalyses={usageData.used}
        totalAnalyses={usageData.total}
      />
    );
  }

  if (activeView === 'results') {
    if (userType === 'guest' && guestCodeInfo) {
      return (
        <GuestResultsScreen
          guestCodeInfo={guestCodeInfo}
          onBack={eventHandlers.handleBackToVCLanding}
          onCreateAccount={eventHandlers.handleGuestCreateAccount}
          onEmailResults={eventHandlers.handleEmailResults}
        />
      );
    }

    return (
      <AIResultsScreen
        userPlan={userPlan}
        onBack={eventHandlers.handleBackToDashboard}
        onUpgrade={() => setShowPaywall(true)}
        onScheduleNext={eventHandlers.handleBackToDashboard}
      />
    );
  }

  if (activeView === 'step1') {
    return (
      <RestaurantInfoStep
        onNext={eventHandlers.handleStep1Complete}
        onBack={eventHandlers.handleBackToVCLanding}
        skipEmailGate={true}
        guestCodeInfo={guestCodeInfo}
      />
    );
  }

  if (activeView === 'step2') {
    return (
      <WebsiteAnalysisStep
        onNext={eventHandlers.handleStep2Complete}
        onBack={eventHandlers.handleBackToStep1}
        guestCodeInfo={guestCodeInfo}
        emailConfirmed={websiteAnalysisData?.emailConfirmed}
      />
    );
  }

  // Main dashboard (only for registered users)
  return (
    <div className="min-h-screen bg-background theme-transition">
      <DashboardHeader
        aiStatus={'ready' as any}
        usageData={usageData}
        userPlan={userPlan}
        isAdmin={isAdmin}
        onAdminToggle={() => setIsAdmin(!isAdmin)}
        onUpgrade={() => setShowPaywall(true)}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="dashboard" className="space-y-8">
          <DashboardTabs isAdmin={isAdmin} />

          {/* Overview Tab */}
          <TabsContent value="dashboard">
            <DashboardOverviewTab
              userPlan={userPlan}
              userType={userType}
              activeView={activeView}
              usageData={usageData}
              canStart={canStart}
              showCostPreview={showCostPreview}
              isAnalysisRunning={isAnalysisRunning}
              analysisQueue={analysisQueue}
              restaurantData={restaurantData}
              websiteAnalysisData={websiteAnalysisData}
              onUpgrade={() => setShowPaywall(true)}
              onPurchaseAnalysis={eventHandlers.handlePurchaseAnalysis}
              onStartAnalysis={eventHandlers.handleStartAnalysis}
              onScheduleChange={eventHandlers.handleScheduleChange}
              onNavigateToView={navigateToView}
              onSetUserType={setUserType}
              onBackToVCLanding={eventHandlers.handleBackToVCLanding}
            />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ScoreCard
                title="Overall Visibility Score"
                score={78}
                description="Ihre Gesamtsichtbarkeit im digitalen Raum"
                trend="up"
                trendValue={12}
                size="lg"
              />
              <MultiScoreCard
                title="Platform Breakdown"
                description="Sichtbarkeit aufgeschlüsselt nach Plattformen"
                scores={PLATFORM_SCORES}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {mockAnalysisData.map((analysis, index) => (
                <AnalysisCard
                  key={index}
                  {...analysis}
                  isLocked={analysis.title !== 'Google My Business Optimierung' && userPlan === 'basic'}
                />
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {METRIC_CARDS_DATA.map((metric, index) => (
                <MetricCard key={index} {...metric} />
              ))}
            </div>
          </TabsContent>

          {/* Scheduling Tab */}
          <TabsContent value="scheduling" className="space-y-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">⏰ Intelligentes Scheduling</h2>
              <p className="text-muted-foreground">
                Automatisierte VC-Läufe mit KI-basierten Empfehlungen und flexibler Zeitplanung
              </p>
            </div>
            <SmartSchedulingInterface
              userPlan={userPlan}
              usedAnalyses={usageData.used}
              totalAnalyses={usageData.total}
              canStartAnalysis={canStart}
              onStartAnalysis={eventHandlers.handleStartAnalysis}
              onScheduleChange={eventHandlers.handleSmartScheduleChange}
              onUpgrade={() => setShowPaywall(true)}
            />
          </TabsContent>

          {/* Results Tab */}
          <ResultsTabContent
            userPlan={userPlan}
            onResultsView={() => navigateToView('results')}
            onPlanChange={setUserPlan}
          />

          {/* Settings Tab - Enhanced with Profile Management */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="p-6 card-dark-enhanced">
              <h2 className="text-xl font-semibold mb-4">{st.title}</h2>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{st.currentPlan}</h3>
                    <p className="text-sm text-muted-foreground">
                      {getPlanDescription(userPlan)}
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowPaywall(true)} 
                    className="btn-hover-enhanced"
                  >
                    {st.changePlan}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{st.profileSettings}</h3>
                    <p className="text-sm text-muted-foreground">
                      {st.profileDesc}
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => navigateToView('profile')}
                    className="btn-hover-enhanced"
                  >
                    {st.manageProfile}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{st.language}</h3>
                    <p className="text-sm text-muted-foreground">
                      {st.languageDesc}
                    </p>
                  </div>
                  <LanguageSwitch variant="compact" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{st.designTheme}</h3>
                    <p className="text-sm text-muted-foreground">
                      {st.themeDesc}
                    </p>
                  </div>
                  <ThemeToggle variant="compact" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{st.userType}</h3>
                    <p className="text-sm text-muted-foreground">
                      {st.userTypeDesc(userType)}
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setUserType('guest');
                      navigateToView('landing');
                    }}
                    className="btn-hover-enhanced"
                  >
                    {st.guestMode}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{st.adminMode}</h3>
                    <p className="text-sm text-muted-foreground">
                      {st.adminDesc}
                    </p>
                  </div>
                  <Button 
                    variant={isAdmin ? "default" : "outline"} 
                    onClick={() => setIsAdmin(!isAdmin)}
                    className="btn-hover-enhanced"
                  >
                    {isAdmin ? st.deactivate : st.activate}
                  </Button>
                </div>

                {scheduleSettings.enabled && (
                  <div className="p-4 bg-success/5 rounded-lg border border-success/20 theme-transition">
                    <h4 className="font-medium mb-2">{st.activeScheduling}</h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>{st.dailyTime} {scheduleSettings.time} Uhr</p>
                      <p>{st.weekdaysSelected} {scheduleSettings.weekdays.length} ausgewählt</p>
                      <p>{st.emailStatus} {scheduleSettings.emailNotification ? 'Aktiviert' : 'Deaktiviert'}</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Admin tabs */}
          {isAdmin && (
            <>
              <TabsContent value="business-intelligence" className="space-y-6">
                <BusinessIntelligenceDashboard />
              </TabsContent>

              <TabsContent value="financial" className="space-y-6">
                <FinancialAnalyticsDashboard />
              </TabsContent>

              <TabsContent value="customers" className="space-y-6">
                <CustomerDemographicsDashboard />
              </TabsContent>

              <TabsContent value="competitive" className="space-y-6">
                <CompetitiveIntelligenceDashboard />
              </TabsContent>

              <TabsContent value="promo-codes" className="space-y-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-2">🎁 Promo-Code & Referral System</h2>
                  <p className="text-muted-foreground">
                    Promo-Codes einlösen, Freunde empfehlen und Gutschriften verdienen
                  </p>
                </div>
                <PromoCodeSystem
                  userPlan={userPlan}
                  onUpgrade={() => setShowPaywall(true)}
                  isAdmin={isAdmin}
                />
              </TabsContent>

              <TabsContent value="admin" className="space-y-6">
                <AdminPromoConsole />
              </TabsContent>

              <TabsContent value="usage-manager" className="space-y-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-2">💰 Usage-Limit Management</h2>
                  <p className="text-muted-foreground">
                    Dynamische Paywall-States, Pay-per-Use und Promo-Codes mit Analytics
                  </p>
                </div>
                <UsageLimitManager
                  userPlan={userPlan}
                  usageData={usageData}
                  onUpgrade={() => setShowPaywall(true)}
                  onPurchaseAnalysis={eventHandlers.handlePurchaseAnalysis}
                  onStartAnalysis={eventHandlers.handleStartAnalysis}
                  canStartAnalysis={canStart}
                />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>

      <PaywallOverlay
        isVisible={showPaywall}
        title={getUpgradeTitle(userPlan)}
        features={getUpgradeFeatures(userPlan)}
        onUpgrade={() => {
          console.log('Upgrade clicked');
          setShowPaywall(false);
          setUserPlan(userPlan === 'basic' ? 'business' : 'premium');
        }}
        onClose={() => setShowPaywall(false)}
      />
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