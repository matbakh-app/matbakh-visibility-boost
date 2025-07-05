
import React from 'react';
import { useTranslation } from 'react-i18next';
import { usePartnerProfile } from '@/hooks/usePartnerProfile';
import { useKpiSummary } from '@/hooks/useKpiSummary';
import { getTimeBasedGreeting, getGreetingEmoji } from '@/utils/timeGreeting';
import { Skeleton } from '@/components/ui/skeleton';

const HeroSection: React.FC = () => {
  const { t } = useTranslation('dashboard');
  
  const { data: partnerData, isLoading: partnerLoading } = usePartnerProfile();
  const { data: kpiData, isLoading: kpiLoading } = useKpiSummary();

  const greetingKey = getTimeBasedGreeting();
  const greetingEmoji = getGreetingEmoji();

  // Erweiterte KPI-Trends für Hero-Bereich mit mehr Indikatoren
  const extendedKpiTrends = [
    { key: 'visibility', value: '+23%', trend: '+', type: 'visibility', icon: '📈', labelKey: 'visibilityChange' },
    { key: 'reviews', value: '+14', trend: '+', type: 'reviews', icon: '⭐', labelKey: 'reviewsCount' },
    { key: 'websiteSessions', value: '+15%', trend: '+', type: 'sessions', icon: '🌐', labelKey: 'sessionsChange' },
    { key: 'engagement', value: '+12%', trend: '+', type: 'engagement', icon: '💬', labelKey: 'engagementChange' },
    { key: 'ctr', value: '+8%', trend: '+', type: 'ctr', icon: '🎯', labelKey: 'ctrChange' },
    { key: 'profileViews', value: '+18%', trend: '+', type: 'profileViews', icon: '👁️', labelKey: 'profileViewsChange' },
    { key: 'clicks', value: '+11%', trend: '+', type: 'clicks', icon: '🖱️', labelKey: 'clicksChange' },
    { key: 'conversions', value: '+9%', trend: '+', type: 'conversions', icon: '🎯', labelKey: 'conversionsChange' },
    { key: 'photoViews', value: '+16%', trend: '+', type: 'photoViews', icon: '📸', labelKey: 'photoViewsChange' }
  ];

  const getTrendIcon = (trend: string, icon?: string) => {
    if (icon) return icon;
    return trend.startsWith('+') ? '↑' : '↓';
  };

  const getTrendColor = (trend: string) => {
    return trend.startsWith('+') ? 'text-green-400' : 'text-red-400';
  };

  if (partnerLoading || kpiLoading) {
    return (
      <section className="bg-gradient-to-r from-blue-600 to-blue-400 text-white rounded-lg p-6 mb-8">
        <Skeleton className="h-8 w-64 mb-4 bg-blue-300" />
        <Skeleton className="h-4 w-96 mb-6 bg-blue-300" />
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <Skeleton className="w-32 h-16 bg-blue-300" />
          <div className="mt-4 md:mt-0 space-y-2">
            <Skeleton className="h-4 w-48 bg-blue-300" />
            <Skeleton className="h-4 w-40 bg-blue-300" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-gradient-to-r from-blue-600 to-blue-400 text-white rounded-lg p-6 mb-8">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{greetingEmoji}</span>
        <h2 className="text-3xl font-bold">
          {t(`hero.${greetingKey}`, { 
            name: partnerData?.displayName || 'Partner',
            defaultValue: `Guten Tag, ${partnerData?.displayName || 'Partner'}!` 
          })}
        </h2>
      </div>
      
      <p className="mb-6 opacity-90">
        {t('hero.subtitle')}
      </p>
      
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Score prominent links */}
        <div className="text-center">
          <div className="text-5xl font-extrabold">
            {kpiData?.score || 87}
            <span className="text-lg">/100</span>
          </div>
          <p className="text-sm opacity-75 mt-1">
            {t('hero.visibilityScore', { defaultValue: 'Sichtbarkeits-Score' })}
          </p>
        </div>
        
        {/* KPI-Trends in 3er-Spalten Layout (3x3 Grid) */}
        <div className="grid grid-cols-3 gap-x-6 gap-y-2">
          {extendedKpiTrends.map((trend, index) => (
            <div key={trend.key || index} className="flex items-center gap-2">
              <span className="text-lg">{getTrendIcon(trend.trend, trend.icon)}</span>
              <div className="flex flex-col">
                <span className={`text-sm font-medium ${getTrendColor(trend.trend)}`}>
                  {t(`hero.${trend.labelKey}`, { 
                    value: trend.value,
                    defaultValue: `${trend.key} ${trend.value}` 
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-4 text-sm italic opacity-75 flex items-center gap-2">
        <span className="animate-pulse">🤖</span>
        {t('hero.poweredBy')} • {t('hero.liveStatus', { defaultValue: 'Live-Status: Aktiv' })}
      </div>
    </section>
  );
};

export default HeroSection;
