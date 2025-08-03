import React, { useState, useEffect } from 'react';
import { I18nProvider } from './contexts/i18nContext';
import { UsageLimitCard, CostPreviewCard } from './components/UsageLimitCard';
import { UsageLimitManager } from './components/UsageLimitManager';
import { PromoCodeSystem } from './components/PromoCodeSystem';
import { AdminPromoConsole } from './components/AdminPromoConsole';
import { BusinessIntelligenceDashboard } from './components/BusinessIntelligenceDashboard';
import { CompetitiveIntelligenceDashboard } from './components/CompetitiveIntelligenceDashboard';
import { FinancialAnalyticsDashboard } from './components/FinancialAnalyticsDashboard';
import { CustomerDemographicsDashboard } from './components/CustomerDemographicsDashboard';
import { AnalysisStartSection, AnalysisQueueStatus } from './components/AnalysisStartSection';
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
import { LanguageSwitch } from './components/LanguageSwitch';
import { Button } from './components/ui/button';
import { Card } from './components/ui/card';
import { Input } from './components/ui/input';
import { Tabs, TabsContent } from './components/ui/tabs';
import { 
  Globe, 
  Target, 
  Zap, 
  UtensilsCrossed, 
  Gift
} from 'lucide-react';

// Import types and utilities
import { UserPlan, AIStatus, RestaurantFormData, WebsiteAnalysisFormData, ScheduleSettings, UserType, GuestCodeInfo } from './types/app';
import { getUsageData, canStartAnalysis, shouldShowCostPreview, getPlanDescription, getUpgradeFeatures, getUpgradeTitle, getCodeFromURL } from './utils/appHelpers';
import { mockAnalysisData, DEMO_PIPELINE_FEATURES, PLATFORM_SCORES, METRIC_CARDS_DATA } from './constants/mockData';

function AppContent() {
  // Core state
  const [currentStep, setCurrentStep] = useState(1);
  const [showPaywall, setShowPaywall] = useState(false);
  const [activeView, setActiveView] = useState<'landing' | 'dashboard' | 'step1' | 'step2' | 'loading' | 'results'>('landing');
  const [restaurantData, setRestaurantData] = useState<RestaurantFormData | null>(null);
  const [websiteAnalysisData, setWebsiteAnalysisData] = useState<WebsiteAnalysisFormData | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // User type and guest state
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

  // Check for URL code parameter on app load
  useEffect(() => {
    const urlCode = getCodeFromURL();
    if (urlCode) {
      // If there's a code in URL, stay on landing page but pre-fill code
      setActiveView('landing');
    } else {
      // Check if user is registered (in real app, check auth token)
      const isRegisteredUser = localStorage.getItem('isRegistered') === 'true';
      if (isRegisteredUser) {
        setUserType('registered');
        setActiveView('dashboard');
      } else {
        setActiveView('landing');
      }
    }
  }, []);

  // Computed values
  const usageData = getUsageData(userPlan);
  const canStart = canStartAnalysis(userPlan, usageData, userType);
  const showCostPreview = shouldShowCostPreview(canStart, userPlan, userType);

  // Event handlers
  const handleStep1Complete = (data: RestaurantFormData) => {
    setRestaurantData(data);
    setCurrentStep(2);
    
    // For guest users, go to step2; for registered users, might skip depending on skipEmailGate
    if (userType === 'guest') {
      setActiveView('step2');
    } else {
      setActiveView('step2'); // Always go to step2 for complete flow
    }
    
    console.log('Restaurant data:', data);
  };

  const handleStep2Complete = (data: WebsiteAnalysisFormData) => {
    setWebsiteAnalysisData(data);
    
    // Check if email confirmation is required
    if (userType === 'guest' || data.emailConfirmed) {
      // Start analysis immediately
      handleStartAnalysis();
    } else {
      // Wait for email confirmation
      setActiveView('dashboard');
      alert('Bitte bestätigen Sie Ihre E-Mail-Adresse, bevor Sie die Analyse starten können.');
    }
    
    console.log('Website analysis data:', data);
  };

  const handleStartAnalysis = () => {
    if (!canStart) return;
    setIsAnalysisRunning(true);
    setAiStatus('busy');
    setActiveView('loading');
    setAnalysisQueue(userType === 'guest' || userPlan === 'premium' ? 1 : 3);
  };

  const handleAnalysisComplete = () => {
    setIsAnalysisRunning(false);
    setAiStatus('ready');
    setActiveView('results');
    setAnalysisQueue(null);
    if (userPlan !== 'premium' && userType !== 'guest') {
      console.log('Analysis completed, usage updated');
    }
  };

  const handleAnalysisCancel = () => {
    setIsAnalysisRunning(false);
    setAiStatus('ready');
    // CORRECTED: Always return to VC landing page
    setActiveView('landing');
    setAnalysisQueue(null);
  };

  const handlePurchaseAnalysis = () => {
    console.log('Purchasing additional analysis');
    alert('Payment successful! Analysis credit added.');
  };

  const handleScheduleChange = (enabled: boolean, time: string, emailNotification: boolean) => {
    console.log('Schedule changed:', { enabled, time, emailNotification });
  };

  const handleSmartScheduleChange = (settings: ScheduleSettings) => {
    setScheduleSettings(settings);
    console.log('Smart schedule settings:', settings);
  };

  // Guest user event handlers
  const handleGuestCodeValidated = (codeInfo: GuestCodeInfo) => {
    setGuestCodeInfo(codeInfo);
    setUserType('guest');
    setActiveView('step1'); // Guest users still need to enter restaurant info
    console.log('Guest code validated:', codeInfo);
  };

  const handleContinueWithoutCode = () => {
    setUserType('registered'); // Treat as basic registered user
    setActiveView('step1');
  };

  const handleLogin = () => {
    // Simulate login/register flow
    localStorage.setItem('isRegistered', 'true');
    setUserType('registered');
    setActiveView('dashboard');
  };

  const handleGuestCreateAccount = () => {
    // Convert guest to registered user
    localStorage.setItem('isRegistered', 'true');
    setUserType('registered');
    setUserPlan('business'); // Give them business plan for converting
    setActiveView('dashboard');
    alert('Account erstellt! Sie haben den Business Plan für 30 Tage kostenlos erhalten.');
  };

  const handleEmailResults = () => {
    console.log('Email results sent to guest user');
    alert('PDF-Report wurde an Ihre Email-Adresse gesendet!');
  };

  // Navigation handlers - CORRECTED: Always return to VC landing page (/vc)
  const handleBackToVCLanding = () => {
    setActiveView('landing');
    // Reset form state if needed
    setRestaurantData(null);
    setWebsiteAnalysisData(null);
    setCurrentStep(1);
  };

  // View handlers - Landing route is now /vc for both guest and registered users
  if (activeView === 'landing') {
    return (
      <GuestLandingPage
        onCodeValidated={handleGuestCodeValidated}
        onContinueWithoutCode={handleContinueWithoutCode}
        onLogin={handleLogin}
      />
    );
  }

  if (activeView === 'loading') {
    return (
      <AILoadingScreen
        isVisible={true}
        onComplete={handleAnalysisComplete}
        onCancel={handleAnalysisCancel}
        userPlan={userType === 'guest' ? 'premium' : userPlan} // Guest users get premium experience
        usedAnalyses={usageData.used}
        totalAnalyses={usageData.total}
      />
    );
  }

  if (activeView === 'results') {
    // Show guest results screen for guest users
    if (userType === 'guest' && guestCodeInfo) {
      return (
        <GuestResultsScreen
          guestCodeInfo={guestCodeInfo}
          onBack={handleBackToVCLanding} // CORRECTED: Return to VC landing
          onCreateAccount={handleGuestCreateAccount}
          onEmailResults={handleEmailResults}
        />
      );
    }

    // Show regular results screen for registered users
    return (
      <AIResultsScreen
        userPlan={userPlan}
        onBack={() => setActiveView('dashboard')}
        onUpgrade={() => setShowPaywall(true)}
        onScheduleNext={() => setActiveView('dashboard')}
      />
    );
  }

  if (activeView === 'step1') {
    return (
      <RestaurantInfoStep
        onNext={handleStep1Complete}
        onBack={handleBackToVCLanding} // CORRECTED: Return to VC landing
        skipEmailGate={true} // Always skip email gate in step1, move to step2
        guestCodeInfo={guestCodeInfo}
      />
    );
  }

  if (activeView === 'step2') {
    return (
      <WebsiteAnalysisStep
        onNext={handleStep2Complete}
        onBack={() => setActiveView('step1')} // Correctly return to step1
        guestCodeInfo={guestCodeInfo}
        emailConfirmed={websiteAnalysisData?.emailConfirmed}
      />
    );
  }

  // Main dashboard (only for registered users)
  return (
    <div className="min-h-screen bg-background">
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

          {/* Overview Tab (formerly dashboard) */}
          <TabsContent value="dashboard" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <UsageLimitCard
                  plan={userPlan}
                  used={usageData.used}
                  total={usageData.total}
                  resetTime="00:00"
                  onUpgrade={() => setShowPaywall(true)}
                />
              </div>
              
              <div className="space-y-6">
                <Card className="p-4">
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
                    <Input placeholder="Code eingeben" className="text-sm h-8" />
                    <Button size="sm" className="h-8">Einlösen</Button>
                  </div>
                </Card>

                {showCostPreview && (
                  <CostPreviewCard
                    isVisible={true}
                    costPerAnalysis={4.99}
                    onPurchase={handlePurchaseAnalysis}
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
              onStartAnalysis={handleStartAnalysis}
              onScheduleChange={handleScheduleChange}
            />

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6 cursor-pointer hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <UtensilsCrossed className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold">Restaurant hinzufügen</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Neues Restaurant zur Analyse hinzufügen
                </p>
                <Button variant="outline" size="sm" onClick={() => setActiveView('step1')}>
                  Jetzt starten
                </Button>
              </Card>

              <Card className="p-6 cursor-pointer hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-success" />
                  </div>
                  <h3 className="font-semibold">Competitor Tracking</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Wettbewerber analysieren und vergleichen
                </p>
                <Button variant="outline" size="sm" disabled={userPlan === 'basic'}>
                  {userPlan === 'basic' ? 'Premium Feature' : 'Aktivieren'}
                </Button>
              </Card>

              <Card className="p-6 cursor-pointer hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                    <Globe className="w-5 h-5 text-warning" />
                  </div>
                  <h3 className="font-semibold">Multi-Location</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Mehrere Standorte gleichzeitig überwachen
                </p>
                <Button variant="outline" size="sm" disabled={userPlan !== 'premium'}>
                  {userPlan === 'premium' ? 'Konfigurieren' : 'Premium only'}
                </Button>
              </Card>
            </div>

            {/* Form Data Debug */}
            {(restaurantData || websiteAnalysisData) && (
              <Card className="p-6 bg-muted/50">
                <h3 className="font-semibold mb-4">📋 Erfasste Daten</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  {restaurantData && (
                    <div>
                      <h4 className="font-medium mb-2">Restaurant Info</h4>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>Name: {restaurantData.restaurantName}</li>
                        <li>Adresse: {restaurantData.address}</li>
                        <li>Kategorie: {restaurantData.mainCategory}</li>
                        <li>Preisklasse: {restaurantData.priceRange}</li>
                      </ul>
                    </div>
                  )}
                  
                  {websiteAnalysisData && (
                    <div>
                      <h4 className="font-medium mb-2">Website & E-Mail</h4>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>Website: {websiteAnalysisData.website || 'Nicht angegeben'}</li>
                        <li>E-Mail: {websiteAnalysisData.email}</li>
                        <li>E-Mail bestätigt: {websiteAnalysisData.emailConfirmed ? '✅' : '❌'}</li>
                        <li>Benchmarks: {Object.values(websiteAnalysisData.benchmarks).filter(b => b).length}/3</li>
                      </ul>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => setActiveView('step1')}>
                    Step 1 bearbeiten
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setActiveView('step2')}>
                    Step 2 bearbeiten
                  </Button>
                  {websiteAnalysisData?.emailConfirmed && (
                    <Button size="sm" onClick={handleStartAnalysis}>
                      Analyse jetzt starten
                    </Button>
                  )}
                </div>
              </Card>
            )}

            {/* Development Testing Section - CLEANED: No demo references */}
            {process.env.NODE_ENV === 'development' && (
              <Card className="p-6 bg-gradient-to-r from-success/5 to-primary/5 border-success/20">
                <div className="text-center mb-4">
                  <h3 className="font-semibold">🌐 Production-Ready VC System</h3>
                  <p className="text-sm text-muted-foreground">
                    Navigation corrected • Demo-references removed • /vc landing for all users
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setUserType('guest');
                      setActiveView('landing');
                    }}
                    className="w-full"
                  >
                    <Gift className="w-4 h-4 mr-2" />
                    Guest Flow
                  </Button>

                  <Button 
                    variant="outline" 
                    onClick={() => setActiveView('step1')}
                    className="w-full"
                  >
                    <Target className="w-4 h-4 mr-2" />
                    Step 1
                  </Button>

                  <Button 
                    variant="outline" 
                    onClick={() => setActiveView('step2')}
                    className="w-full"
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    Step 2
                  </Button>

                  <Button 
                    variant="outline" 
                    onClick={handleBackToVCLanding}
                    className="w-full"
                  >
                    <UtensilsCrossed className="w-4 h-4 mr-2" />
                    Back to VC
                  </Button>
                </div>

                <div className="flex justify-center">
                  <LanguageSwitch variant="default" />
                </div>
              </Card>
            )}
          </TabsContent>

          {/* Analysis Tab */}
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
              onStartAnalysis={handleStartAnalysis}
              onScheduleChange={handleSmartScheduleChange}
              onUpgrade={() => setShowPaywall(true)}
            />
          </TabsContent>

          {/* Results Tab */}
          <ResultsTabContent
            userPlan={userPlan}
            onResultsView={() => setActiveView('results')}
            onPlanChange={setUserPlan}
          />

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Account Einstellungen</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Aktueller Plan</h3>
                    <p className="text-sm text-muted-foreground">
                      {getPlanDescription(userPlan)}
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => setShowPaywall(true)}>
                    Plan ändern
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Sprache / Language</h3>
                    <p className="text-sm text-muted-foreground">
                      Interface language settings
                    </p>
                  </div>
                  <LanguageSwitch variant="default" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">User Type</h3>
                    <p className="text-sm text-muted-foreground">
                      {userType === 'guest' ? 'Guest User (Code-basiert)' : 'Registered User'}
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setUserType('guest');
                      setActiveView('landing');
                    }}
                  >
                    Guest Mode
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Admin-Modus</h3>
                    <p className="text-sm text-muted-foreground">
                      Zugriff auf Admin-Features und Promo-Code-Management
                    </p>
                  </div>
                  <Button 
                    variant={isAdmin ? "default" : "outline"} 
                    onClick={() => setIsAdmin(!isAdmin)}
                  >
                    {isAdmin ? 'Deaktivieren' : 'Aktivieren'}
                  </Button>
                </div>

                {scheduleSettings.enabled && (
                  <div className="p-4 bg-success/5 rounded-lg border border-success/20">
                    <h4 className="font-medium mb-2">Aktives Scheduling</h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Zeit: Täglich um {scheduleSettings.time} Uhr</p>
                      <p>Wochentage: {scheduleSettings.weekdays.length} ausgewählt</p>
                      <p>Email: {scheduleSettings.emailNotification ? 'Aktiviert' : 'Deaktiviert'}</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Development Mode Tabs Access */}
            {process.env.NODE_ENV === 'development' && (
              <Card className="p-6 bg-muted/20 border-dashed">
                <h3 className="font-semibold mb-4">🔧 Developer Tools</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" onClick={() => setShowPaywall(true)}>
                    Test Paywall
                  </Button>
                  <Button variant="outline" onClick={() => setActiveView('loading')}>
                    Test Loading Screen
                  </Button>
                  <Button variant="outline" onClick={() => setActiveView('results')}>
                    Test Results Screen
                  </Button>
                </div>
              </Card>
            )}
          </TabsContent>

          {/* Hidden Admin Tabs - accessible through other means */}
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
                  onPurchaseAnalysis={handlePurchaseAnalysis}
                  onStartAnalysis={handleStartAnalysis}
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
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  );
}