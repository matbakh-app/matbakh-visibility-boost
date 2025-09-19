import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Lock, Eye, Crown, ArrowRight, Users, TrendingUp, BarChart3, MessageSquare, Calendar, Target } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';


interface PublicDashboardModeProps {
  children: React.ReactNode;
  isPublicMode?: boolean;
}

const PublicDashboardMode: React.FC<PublicDashboardModeProps> = ({
  children,
  isPublicMode = true
}) => {
  const { language } = useLanguage();
  const [viewedDemo, setViewedDemo] = useState(false);

  // Public mode translations
  const translations = {
    demoMode: {
      de: 'Demo-Modus',
      en: 'Demo Mode'
    },
    demoNotice: {
      de: 'Sie betrachten eine Demo-Version mit eingeschränkten Daten',
      en: 'You are viewing a demo version with limited data'
    },
    fullAccess: {
      de: 'Vollzugriff erhalten',
      en: 'Get Full Access'
    },
    signUp: {
      de: 'Kostenlos registrieren',
      en: 'Sign Up Free'
    },
    features: {
      title: {
        de: 'Verfügbare Premium-Features',
        en: 'Available Premium Features'
      },
      realTimeData: {
        de: 'Echtzeit-Daten und Live-Updates',
        en: 'Real-time data and live updates'
      },
      fullReports: {
        de: 'Vollständige Berichte und Analysen',
        en: 'Complete reports and analytics'
      },
      competitorTracking: {
        de: 'Wettbewerber-Überwachung',
        en: 'Competitor tracking'
      },
      aiInsights: {
        de: 'KI-gestützte Insights',
        en: 'AI-powered insights'
      },
      exportData: {
        de: 'Datenexport und API-Zugang',
        en: 'Data export and API access'
      },
      support: {
        de: '24/7 Premium-Support',
        en: '24/7 Premium support'
      }
    },
    limitations: {
      title: {
        de: 'Demo-Einschränkungen',
        en: 'Demo Limitations'
      },
      sampleData: {
        de: 'Nur Beispieldaten verfügbar',
        en: 'Sample data only'
      },
      limitedWidgets: {
        de: 'Begrenzte Widget-Funktionalität',
        en: 'Limited widget functionality'
      },
      noExport: {
        de: 'Kein Datenexport möglich',
        en: 'No data export available'
      },
      noRealTime: {
        de: 'Keine Echtzeit-Updates',
        en: 'No real-time updates'
      }
    }
  };

  const getText = (key: string) => {
    const keys = key.split('.');
    let obj = translations;
    for (const k of keys) {
      obj = obj[k];
    }
    return obj?.[language] || key;
  };

  // Sample restricted widgets configuration
  const restrictedWidgets = [
    { id: 'competitor-monitoring', context: 'competitors' },
    { id: 'cultural-insights', context: 'insights' },
    { id: 'ab-testing', context: 'analytics' },
    { id: 'staff-dashboard', context: 'reports' },
    { id: 'marketing-widget', context: 'analytics' }
  ];

  // Premium features list
  const premiumFeatures = [
    { icon: TrendingUp, key: 'realTimeData' },
    { icon: BarChart3, key: 'fullReports' },
    { icon: Target, key: 'competitorTracking' },
    { icon: Crown, key: 'aiInsights' },
    { icon: ArrowRight, key: 'exportData' },
    { icon: Users, key: 'support' }
  ];

  // Demo limitations
  const demoLimitations = [
    { icon: Eye, key: 'sampleData' },
    { icon: Lock, key: 'limitedWidgets' },
    { icon: ArrowRight, key: 'noExport' },
    { icon: TrendingUp, key: 'noRealTime' }
  ];



  if (!isPublicMode) {
    return <>{children}</>;
  }

  return (
    <div className="public-dashboard-container">
      {/* Main Dashboard Content */}
      <div className="relative">
        {children}



        {/* Features Overview Section */}



      </div>


    </div>
  );
};

export default PublicDashboardMode;