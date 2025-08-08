import React, { useState } from 'react';
import { I18nProvider } from './contexts/i18nContext';
import { ThemeProvider } from './contexts/themeContext';
import { UsageLimitManager } from './components/UsageLimitManager';
import { PromoCodeSystem } from './components/PromoCodeSystem';
import { AdminPromoConsole } from './components/AdminPromoConsole';
import { BusinessIntelligenceDashboard } from './components/BusinessIntelligenceDashboard';
import { CompetitiveIntelligenceDashboard } from './components/CompetitiveIntelligenceDashboard';
import { FinancialAnalyticsDashboard } from './components/FinancialAnalyticsDashboard';
import { CustomerDemographicsDashboard } from './components/CustomerDemographicsDashboard';
import { AILoadingScreen } from './components/AILoadingScreen';
import { AIResultsScreen } from './components/AIResultsScreen';
import { GuestLandingPage } from './components/GuestLandingPage';
import { GuestResultsScreen } from './components/GuestResultsScreen';
import { SmartSchedulingInterface } from './components/SmartSchedulingInterface';
import { AnalysisCard, MetricCard } from './components/AnalysisCard';
import { PaywallOverlay } from './components/PaywallOverlay';
import { ScoreCard, MultiScoreCard } from './components/ProgressRing';
import { RestaurantInfoStep } from './components/RestaurantInfoStep';
import { WebsiteAnalysisStep } from './components/WebsiteAnalysisStep';
import { DashboardHeader } from './components/DashboardHeader';
import { DashboardTabs } from './components/DashboardTabs';
import { ResultsTabContent } from './components/ResultsTabContent';
import { DashboardOverviewTab } from './components/DashboardOverviewTab';
import { MyProfile } from './components/MyProfile';
import { CompanyProfile } from './components/CompanyProfile';
import { LanguageSwitch } from './components/LanguageSwitch';
import { ThemeToggle } from './components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent } from '@/components/ui/tabs';

// Import types and utilities
import { UserPlan, AIStatus, RestaurantFormData, WebsiteAnalysisFormData, ScheduleSettings, UserType, GuestCodeInfo } from './types/app';
import { getUsageData, canStartAnalysis, shouldShowCostPreview, getPlanDescription, getUpgradeFeatures, getUpgradeTitle } from './utils/appHelpers';
import { mockAnalysisData, PLATFORM_SCORES, METRIC_CARDS_DATA } from './constants/mockData';
import { useAppNavigation } from './hooks/useAppNavigation';
import { createAppEventHandlers } from './utils/appEventHandlers';
import { useI18n } from './contexts/i18nContext';

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
  const { language } = useI18n();

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
        aiStatus={aiStatus}
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
                <BusinessIntelligenceDashboard
                  userPlan={userPlan}
                  dateRange={dateRange}
                  onDateRangeChange={setDateRange}
                />
              </TabsContent>

              <TabsContent value="financial" className="space-y-6">
                <FinancialAnalyticsDashboard
                  userPlan={userPlan}
                  dateRange={dateRange}
                  onDateRangeChange={setDateRange}
                  onUpgrade={() => setShowPaywall(true)}
                />
              </TabsContent>

              <TabsContent value="customers" className="space-y-6">
                <CustomerDemographicsDashboard
                  userPlan={userPlan}
                  onUpgrade={() => setShowPaywall(true)}
                />
              </TabsContent>

              <TabsContent value="competitive" className="space-y-6">
                <CompetitiveIntelligenceDashboard
                  userPlan={userPlan}
                  onUpgrade={() => setShowPaywall(true)}
                />
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
    <ThemeProvider defaultTheme="system" storageKey="vc-ui-theme">
      <I18nProvider>
        <AppContent />
      </I18nProvider>
    </ThemeProvider>
  );
}