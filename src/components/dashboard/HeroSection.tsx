
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePartnerProfile } from '@/hooks/usePartnerProfile';
import { useKpiSummary } from '@/hooks/useKpiSummary';
import { useAiRecommendations } from '@/hooks/useAiRecommendations';
import { getTimeBasedGreeting, getGreetingEmoji } from '@/utils/timeGreeting';
import QuickActionButton from './QuickActionButton';
import ActionModal from './ActionModal';
import { Skeleton } from '@/components/ui/skeleton';

const HeroSection: React.FC = () => {
  const { t } = useTranslation('dashboard');
  const [selectedRecommendation, setSelectedRecommendation] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { data: partnerData, isLoading: partnerLoading } = usePartnerProfile();
  const { data: kpiData, isLoading: kpiLoading } = useKpiSummary();
  const { data: recommendations, isLoading: recommendationsLoading } = useAiRecommendations();

  const greetingKey = getTimeBasedGreeting();
  const greetingEmoji = getGreetingEmoji();

  const handleQuickAction = (recommendation: any) => {
    setSelectedRecommendation(recommendation);
    setIsModalOpen(true);
  };

  const getTrendIcon = (trend: string) => {
    return trend.startsWith('+') ? '📈' : '📉';
  };

  const getTrendColor = (trend: string) => {
    return trend.startsWith('+') ? 'text-green-600' : 'text-red-600';
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
    <>
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
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-5xl font-extrabold">
                {kpiData?.score || 87}
                <span className="text-lg">/100</span>
              </div>
              <p className="text-sm opacity-75 mt-1">
                {t('hero.visibilityScore', { defaultValue: 'Sichtbarkeits-Score' })}
              </p>
            </div>
            
            {kpiData?.insights && (
              <div className="space-y-2">
                {kpiData.insights.slice(0, 2).map((insight, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span>{getTrendIcon(insight.trend)}</span>
                    <span className={`text-sm ${getTrendColor(insight.trend)}`}>
                      {insight.type === 'visibility' 
                        ? t('hero.visibilityChange', { 
                            value: insight.value,
                            defaultValue: `Sichtbarkeit ${insight.trend}${insight.value}` 
                          })
                        : t('hero.reviewsCount', { 
                            value: insight.value,
                            defaultValue: `${insight.value} Bewertungen` 
                          })
                      }
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {recommendations && recommendations.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {recommendations.slice(0, 2).map((recommendation) => (
                <QuickActionButton
                  key={recommendation.id}
                  recommendation={recommendation}
                  onClick={handleQuickAction}
                />
              ))}
              {recommendations.length > 2 && (
                <button className="text-sm underline opacity-75 hover:opacity-100">
                  {t('hero.moreActions', { 
                    count: recommendations.length - 2,
                    defaultValue: `+${recommendations.length - 2} weitere` 
                  })}
                </button>
              )}
            </div>
          )}
        </div>
        
        <div className="mt-4 text-sm italic opacity-75">
          {t('hero.poweredBy')}
        </div>
      </section>

      <ActionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        recommendation={selectedRecommendation}
      />
    </>
  );
};

export default HeroSection;
