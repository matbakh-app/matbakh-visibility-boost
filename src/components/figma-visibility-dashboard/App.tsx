import React from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import OfflineProvider from './components/OfflineDetector';
import FeatureTour from './components/FeatureTour';
import DashboardHeader from './components/DashboardHeader';
import DashboardGrid from './components/DashboardGrid';
import LoadingSkeleton from './components/LoadingSkeleton';
import PublicDashboardMode from './components/PublicDashboardMode';
import LocationOverviewWidget from './components/LocationOverviewWidget';
import OrdersRevenueWidget from './components/OrdersRevenueWidget';
import ReservationsWidget from './components/ReservationsWidget';
import RestrictedWidget from './components/RestrictedWidget';
import ReportPreviewModal from './components/ReportPreviewModal';

import { LanguageProvider, useLanguage } from './hooks/useLanguage';
import { useAppState, useKeyboardShortcuts } from './hooks/useAppState';

function DashboardApp() {
  const { language } = useLanguage();
  const {
    selectedLocation,
    setSelectedLocation,
    notificationCount,
    mobileMenuOpen,
    setMobileMenuOpen,
    isDarkMode,
    dashboardSettings,
    isLoading,
    toggleTheme,
    refreshDashboard,
    exportDashboard,
    isWidgetVisible,
    getWidgetPriority
  } = useAppState();

  // Setup keyboard shortcuts
  useKeyboardShortcuts(toggleTheme, refreshDashboard, exportDashboard, setMobileMenuOpen);

  // Public mode settings (for demo)
  const isPublicMode = true; // Set to false for authenticated users
  
  // Main content translations with new branding
  const mainTexts = {
    title: {
      de: 'Dashboard',
      en: 'Dashboard'
    },
    subtitle: {
      de: 'Überblick über Ihre Restaurant-Performance und wichtige Kennzahlen',
      en: 'Overview of your restaurant performance and key metrics'
    },
    publicSubtitle: {
      de: 'Demo-Dashboard mit Beispieldaten - Registrieren Sie sich für Live-Daten',
      en: 'Demo dashboard with sample data - Sign up for live data'
    },
    welcomeBack: {
      de: 'Willkommen zurück',
      en: 'Welcome back'
    },
    dataLastUpdated: {
      de: 'Daten zuletzt aktualisiert',
      en: 'Data last updated'
    },
    location: {
      de: 'Standort',
      en: 'Location'
    },
    demoData: {
      de: 'Demo-Daten',
      en: 'Demo Data'
    },
    liveData: {
      de: 'Live-Daten',
      en: 'Live Data'
    }
  };

  const getText = (key: keyof typeof mainTexts) => {
    return mainTexts[key][language];
  };

  // Show loading skeleton while initializing
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <ErrorBoundary fallbackType="dashboard" onError={(error, errorInfo) => {
      console.error('Dashboard Error:', error, errorInfo);
      // Send to monitoring service
    }}>
      <OfflineProvider>
        <FeatureTour>
          <PublicDashboardMode 
            isPublicMode={isPublicMode}
          >
            <div className="min-h-screen bg-background transition-colors duration-300">
              <DashboardHeader
                selectedLocation={selectedLocation}
                setSelectedLocation={setSelectedLocation}
                notificationCount={notificationCount}
                mobileMenuOpen={mobileMenuOpen}
                setMobileMenuOpen={setMobileMenuOpen}
                isDarkMode={isDarkMode}
                toggleTheme={toggleTheme}
              />

              {/* Main Content Container - NO PADDING HERE */}
              <main 
                className="relative z-10" 
                style={{ 
                  minHeight: 'calc(100vh - 80px)' // Account for header height
                }}
              >
                {/* Quick Stats Section - Only padding */}
                <div className="px-4 md:px-6 lg:px-8" style={{ paddingTop: '32px', paddingBottom: '24px' }}>

                  {/* Quick Stats Bar - Single row with 24px gaps, 8px grid aligned */}
                  <div 
                    className="flex flex-col sm:flex-row"
                    style={{ 
                      gap: '24px', // Exact 24px horizontal gap between widgets
                      marginBottom: '32px',
                      alignItems: 'stretch' // Align top edges to same Y-coordinate
                    }}
                  >
                    {/* Widget 1: Average Rating */}
                    <div 
                      className="bg-card border border-border rounded-lg text-center relative overflow-hidden flex-1"
                      style={{ 
                        padding: '24px',
                        minWidth: '0' // Allow flex shrinking
                      }}
                    >
                      {isPublicMode && (
                        <div className="absolute" style={{ top: '8px', right: '8px' }}>
                          <div className="w-2 h-2 bg-warning rounded-full"></div>
                        </div>
                      )}
                      <div className="metric-md text-success" style={{ marginBottom: '8px' }}>4.6</div>
                      <div className="caption text-muted-foreground">
                        {language === 'de' ? 'Durchschnittsbewertung' : 'Avg Rating'}
                      </div>
                    </div>
                    
                    {/* Widget 2: Today's Occupancy */}
                    <div 
                      className="bg-card border border-border rounded-lg text-center relative overflow-hidden flex-1"
                      style={{ 
                        padding: '24px',
                        minWidth: '0' // Allow flex shrinking
                      }}
                    >
                      {isPublicMode && (
                        <div className="absolute" style={{ top: '8px', right: '8px' }}>
                          <div className="w-2 h-2 bg-warning rounded-full"></div>
                        </div>
                      )}
                      <div className="metric-md text-primary" style={{ marginBottom: '8px' }}>87%</div>
                      <div className="caption text-muted-foreground">
                        {language === 'de' ? 'Auslastung heute' : 'Today\'s Occupancy'}
                      </div>
                    </div>
                    
                    {/* Widget 3: Today's Revenue */}
                    <div 
                      className="bg-card border border-border rounded-lg text-center relative overflow-hidden flex-1"
                      style={{ 
                        padding: '24px',
                        minWidth: '0' // Allow flex shrinking
                      }}
                    >
                      {isPublicMode && (
                        <div className="absolute" style={{ top: '8px', right: '8px' }}>
                          <div className="w-2 h-2 bg-warning rounded-full"></div>
                        </div>
                      )}
                      <div className="metric-md text-warning" style={{ marginBottom: '8px' }}>€3.2K</div>
                      <div className="caption text-muted-foreground">
                        {language === 'de' ? 'Umsatz heute' : 'Today\'s Revenue'}
                      </div>
                    </div>
                    
                    {/* Widget 4: Today's Guests */}
                    <div 
                      className="bg-card border border-border rounded-lg text-center relative overflow-hidden flex-1"
                      style={{ 
                        padding: '24px',
                        minWidth: '0' // Allow flex shrinking
                      }}
                    >
                      {isPublicMode && (
                        <div className="absolute" style={{ top: '8px', right: '8px' }}>
                          <div className="w-2 h-2 bg-warning rounded-full"></div>
                        </div>
                      )}
                      <div className="metric-md text-chart-2" style={{ marginBottom: '8px' }}>142</div>
                      <div className="caption text-muted-foreground">
                        {language === 'de' ? 'Gäste heute' : 'Today\'s Guests'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Layout: Dashboard Grid + Sidebar - Optimized for full width usage */}
                <div className="w-full">
                  <div 
                    className="flex flex-col xl:flex-row"
                    style={{ 
                      gap: '24px', // Reduced from 32px to 24px for better space usage
                      padding: '0 8px 0 8px', // Reduced from 16px to 8px for more widget space
                      paddingBottom: '96px' // Increased from 48px to 96px for longer main area
                    }}
                  >
                    {/* Main Dashboard Grid - Maximized space usage */}
                    <div className="flex-1 min-w-0" style={{ marginRight: '8px' }}> {/* Added 8px margin for 32px total spacing to sidebar */}
                      <DashboardGrid
                        isWidgetVisible={isWidgetVisible}
                        getWidgetPriority={getWidgetPriority}
                        dashboardSettings={dashboardSettings}
                        isPublicMode={isPublicMode}
                        className="dashboard-grid-maximized"
                      />
                    </div>

                    {/* Right Sidebar - Fixed width with 32px left spacing total */}
                    <div 
                      className="w-full xl:w-72 flex-shrink-0" 
                      style={{ 
                        minHeight: '480px',
                        paddingLeft: '24px' // Combined with 8px margin = 32px total spacing
                      }}
                    >
                      {/* Decorative Background Pattern */}
                      <div 
                        className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.05)_1px,transparent_1px)] bg-[length:20px_20px] pointer-events-none opacity-30 rounded-lg"
                        style={{ position: 'absolute' }}
                      ></div>
                      
                      {/* Sidebar Content with proper spacing */}
                      <div 
                        className="relative z-10"
                        style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
                      >
                        {/* Location Overview Widget */}
                        <div>
                          <LocationOverviewWidget />
                        </div>

                        {/* Coming Soon Preview Section */}
                        <div style={{ marginTop: '32px' }}>
                          <h3 
                            className="headline-md text-foreground"
                            style={{ marginBottom: '24px' }}
                          >
                            {language === 'de' ? 'Kommende Features' : 'Coming Soon Features'}
                          </h3>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {/* AI Assistant Preview */}
                            <div 
                              className="bg-gradient-to-br from-primary/10 to-chart-2/10 border border-primary/20 rounded-lg relative overflow-hidden"
                              style={{ padding: '16px' }}
                            >
                              <div className="absolute" style={{ top: '8px', right: '8px' }}>
                                <div 
                                  className="bg-primary text-primary-foreground text-xs rounded-full"
                                  style={{ padding: '4px 8px' }}
                                >
                                  Coming Soon
                                </div>
                              </div>
                              <div style={{ paddingTop: '8px' }}>
                                <h4 
                                  className="headline-md text-foreground"
                                  style={{ marginBottom: '8px' }}
                                >
                                  {language === 'de' ? 'KI-Assistent' : 'AI Assistant'}
                                </h4>
                                <p 
                                  className="caption text-muted-foreground"
                                  style={{ marginBottom: '8px' }}
                                >
                                  {language === 'de' 
                                    ? 'Intelligente Geschäftsempfehlungen und automatisierte Insights'
                                    : 'Intelligent business recommendations and automated insights'
                                  }
                                </p>
                                <div className="text-xs text-primary font-medium">
                                  {language === 'de' ? '85% Entwicklung' : '85% Development'}
                                </div>
                              </div>
                            </div>

                            {/* Multi-Location Management Preview */}
                            <div 
                              className="bg-gradient-to-br from-warning/10 to-chart-4/10 border border-warning/20 rounded-lg relative overflow-hidden"
                              style={{ padding: '16px' }}
                            >
                              <div className="absolute" style={{ top: '8px', right: '8px' }}>
                                <div 
                                  className="bg-warning text-warning-foreground text-xs rounded-full"
                                  style={{ padding: '4px 8px' }}
                                >
                                  Q2 2024
                                </div>
                              </div>
                              <div style={{ paddingTop: '8px' }}>
                                <h4 
                                  className="headline-md text-foreground"
                                  style={{ marginBottom: '8px' }}
                                >
                                  {language === 'de' ? 'Multi-Standort' : 'Multi-Location'}
                                </h4>
                                <p 
                                  className="caption text-muted-foreground"
                                  style={{ marginBottom: '8px' }}
                                >
                                  {language === 'de'
                                    ? 'Zentralisierte Verwaltung mehrerer Restaurant-Standorte'
                                    : 'Centralized management of multiple restaurant locations'
                                  }
                                </p>
                                <div className="text-xs text-warning font-medium">
                                  {language === 'de' ? 'Planung' : 'Planning'}
                                </div>
                              </div>
                            </div>

                            {/* Advanced Analytics Preview */}
                            <div 
                              className="bg-gradient-to-br from-chart-3/10 to-chart-5/10 border border-chart-3/20 rounded-lg relative overflow-hidden"
                              style={{ padding: '16px' }}
                            >
                              <div className="absolute" style={{ top: '8px', right: '8px' }}>
                                <div 
                                  className="bg-chart-3 text-white text-xs rounded-full"
                                  style={{ padding: '4px 8px' }}
                                >
                                  Beta
                                </div>
                              </div>
                              <div style={{ paddingTop: '8px' }}>
                                <h4 
                                  className="headline-md text-foreground"
                                  style={{ marginBottom: '8px' }}
                                >
                                  {language === 'de' ? 'Erweiterte Analytics' : 'Advanced Analytics'}
                                </h4>
                                <p 
                                  className="caption text-muted-foreground"
                                  style={{ marginBottom: '8px' }}
                                >
                                  {language === 'de'
                                    ? 'Detaillierte Kundenanalysen und Vorhersagemodelle'
                                    : 'Detailed customer analytics and predictive models'
                                  }
                                </p>
                                <div className="text-xs text-chart-3 font-medium">
                                  {language === 'de' ? 'Testphase' : 'Beta Testing'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Four Premium Analysis Widgets - No Background Container */}
                <div className="w-full px-4 md:px-6 lg:px-8" style={{ paddingBottom: '48px' }}>
                  <div 
                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 max-w-7xl mx-auto"
                    style={{ gap: '16px' }}
                  >
                    {/* SWOT Analyse Widget */}
                    <div className="relative">
                      <div 
                        className="bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-all duration-200 h-full"
                        style={{ 
                          padding: '24px',
                          display: 'flex',
                          flexDirection: 'column',
                          minHeight: '280px'
                        }}
                      >
                        {/* Premium Badge */}
                        <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mx-auto" style={{ marginBottom: '16px' }}>
                          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="fill-primary-foreground">
                              <path d="M6 0L7.854 4.146L12 6L7.854 7.854L6 12L4.146 7.854L0 6L4.146 4.146L6 0Z"/>
                            </svg>
                          </div>
                        </div>
                        
                        {/* Premium Label */}
                        <div 
                          className="bg-primary text-primary-foreground text-xs rounded-full text-center"
                          style={{ 
                            padding: '4px 12px',
                            marginBottom: '12px',
                            alignSelf: 'center'
                          }}
                        >
                          Premium
                        </div>
                        
                        {/* Title */}
                        <h3 
                          className="headline-md text-foreground text-center"
                          style={{ marginBottom: '8px' }}
                        >
                          SWOT Analyse
                        </h3>
                        
                        {/* Description */}
                        <p 
                          className="caption text-muted-foreground text-center flex-1"
                          style={{ marginBottom: '20px' }}
                        >
                          Strategische Analyse
                        </p>
                        
                        {/* Action Buttons */}
                        <div 
                          className="flex flex-col"
                          style={{ gap: '8px' }}
                        >
                          <button 
                            className="bg-primary text-primary-foreground rounded-lg button-hover button-padding w-full"
                            onClick={() => window.open('/pricing', '_blank')}
                          >
                            Jetzt Stärken Nutzen
                          </button>
                          <button 
                            className="bg-transparent border border-border text-foreground rounded-lg button-hover button-padding w-full"
                            onClick={() => window.open('/pricing', '_blank')}
                          >
                            Upgrade buchen
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Umfeld-Analyse Widget */}
                    <div className="relative">
                      <div 
                        className="bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-all duration-200 h-full"
                        style={{ 
                          padding: '24px',
                          display: 'flex',
                          flexDirection: 'column',
                          minHeight: '280px'
                        }}
                      >
                        {/* Premium Badge */}
                        <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mx-auto" style={{ marginBottom: '16px' }}>
                          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="fill-primary-foreground">
                              <path d="M6 0L7.854 4.146L12 6L7.854 7.854L6 12L4.146 7.854L0 6L4.146 4.146L6 0Z"/>
                            </svg>
                          </div>
                        </div>
                        
                        {/* Premium Label */}
                        <div 
                          className="bg-primary text-primary-foreground text-xs rounded-full text-center"
                          style={{ 
                            padding: '4px 12px',
                            marginBottom: '12px',
                            alignSelf: 'center'
                          }}
                        >
                          Premium
                        </div>
                        
                        {/* Title */}
                        <h3 
                          className="headline-md text-foreground text-center"
                          style={{ marginBottom: '8px' }}
                        >
                          Umfeld-Analyse (Kulturdimensionen)
                        </h3>
                        
                        {/* Description */}
                        <p 
                          className="caption text-muted-foreground text-center flex-1"
                          style={{ marginBottom: '20px' }}
                        >
                          Kulturelle Marktanalyse
                        </p>
                        
                        {/* Action Buttons */}
                        <div 
                          className="flex flex-col"
                          style={{ gap: '8px' }}
                        >
                          <button 
                            className="bg-primary text-primary-foreground rounded-lg button-hover button-padding w-full"
                            onClick={() => window.open('/pricing', '_blank')}
                          >
                            Jetzt aktivieren
                          </button>
                          <button 
                            className="bg-transparent border border-border text-foreground rounded-lg button-hover button-padding w-full"
                            onClick={() => window.open('/pricing', '_blank')}
                          >
                            Upgrade buchen
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Balanced Scorecard Widget */}
                    <div className="relative">
                      <div 
                        className="bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-all duration-200 h-full"
                        style={{ 
                          padding: '24px',
                          display: 'flex',
                          flexDirection: 'column',
                          minHeight: '280px'
                        }}
                      >
                        {/* Premium Badge */}
                        <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mx-auto" style={{ marginBottom: '16px' }}>
                          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="fill-primary-foreground">
                              <path d="M6 0L7.854 4.146L12 6L7.854 7.854L6 12L4.146 7.854L0 6L4.146 4.146L6 0Z"/>
                            </svg>
                          </div>
                        </div>
                        
                        {/* Premium Label */}
                        <div 
                          className="bg-primary text-primary-foreground text-xs rounded-full text-center"
                          style={{ 
                            padding: '4px 12px',
                            marginBottom: '12px',
                            alignSelf: 'center'
                          }}
                        >
                          Premium
                        </div>
                        
                        {/* Title */}
                        <h3 
                          className="headline-md text-foreground text-center"
                          style={{ marginBottom: '8px' }}
                        >
                          Balanced Scorecard Analyse
                        </h3>
                        
                        {/* Description */}
                        <p 
                          className="caption text-muted-foreground text-center flex-1"
                          style={{ marginBottom: '20px' }}
                        >
                          KPI-Bewertungssystem
                        </p>
                        
                        {/* Action Buttons */}
                        <div 
                          className="flex flex-col"
                          style={{ gap: '8px' }}
                        >
                          <button 
                            className="bg-primary text-primary-foreground rounded-lg button-hover button-padding w-full"
                            onClick={() => window.open('/pricing', '_blank')}
                          >
                            Neue Perspektiven sichern
                          </button>
                          <button 
                            className="bg-transparent border border-border text-foreground rounded-lg button-hover button-padding w-full"
                            onClick={() => window.open('/pricing', '_blank')}
                          >
                            Upgrade buchen
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Handlungsempfehlungen Widget */}
                    <div className="relative">
                      <div 
                        className="bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-all duration-200 h-full"
                        style={{ 
                          padding: '24px',
                          display: 'flex',
                          flexDirection: 'column',
                          minHeight: '280px'
                        }}
                      >
                        {/* Premium Badge */}
                        <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mx-auto" style={{ marginBottom: '16px' }}>
                          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="fill-primary-foreground">
                              <path d="M6 0L7.854 4.146L12 6L7.854 7.854L6 12L4.146 7.854L0 6L4.146 4.146L6 0Z"/>
                            </svg>
                          </div>
                        </div>
                        
                        {/* Premium Label */}
                        <div 
                          className="bg-primary text-primary-foreground text-xs rounded-full text-center"
                          style={{ 
                            padding: '4px 12px',
                            marginBottom: '12px',
                            alignSelf: 'center'
                          }}
                        >
                          Premium
                        </div>
                        
                        {/* Title */}
                        <h3 
                          className="headline-md text-foreground text-center"
                          style={{ marginBottom: '8px' }}
                        >
                          Handlungsempfehlungen
                        </h3>
                        
                        {/* Description */}
                        <p 
                          className="caption text-muted-foreground text-center flex-1"
                          style={{ marginBottom: '20px' }}
                        >
                          KI-basierte Optimierung
                        </p>
                        
                        {/* Action Buttons */}
                        <div 
                          className="flex flex-col"
                          style={{ gap: '8px' }}
                        >
                          <button 
                            className="bg-primary text-primary-foreground rounded-lg button-hover button-padding w-full"
                            onClick={() => window.open('/pricing', '_blank')}
                          >
                            Aktivieren Sie mehr Potential
                          </button>
                          <button 
                            className="bg-transparent border border-border text-foreground rounded-lg button-hover button-padding w-full"
                            onClick={() => window.open('/pricing', '_blank')}
                          >
                            Upgrade buchen
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </main>
            </div>
          </PublicDashboardMode>
        </FeatureTour>
      </OfflineProvider>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <DashboardApp />
    </LanguageProvider>
  );
}