
import React from 'react';
import { useTranslation } from 'react-i18next';

interface SocialMediaLegendProps {
  lang: string;
}

const SocialMediaLegend: React.FC<SocialMediaLegendProps> = ({ lang }) => {
  const { t, i18n, ready } = useTranslation('dashboard', { useSuspense: false });

  // Debug: Welche Sprache, Keys, Status?
  console.log('[SocialMediaLegend] lang:', lang, 'ready:', ready, 'i18n.language:', i18n.language, 'followers:', t('charts.legend.followers'));

  // Fallback, falls noch nicht geladen
  if (!ready) return <div>Loading...</div>;

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 mt-4" key={lang}>
      <span className="flex items-center gap-2">
        <span className="inline-block w-3 h-3 rounded bg-[#3b82f6]" />
        <span className="text-sm">{t('charts.legend.followers')}</span>
      </span>
      <span className="flex items-center gap-2">
        <span className="inline-block w-3 h-3 rounded bg-[#10b981]" />
        <span className="text-sm">{t('charts.legend.likes')}</span>
      </span>
      <span className="flex items-center gap-2">
        <span className="inline-block w-3 h-3 rounded bg-[#f59e0b]" />
        <span className="text-sm">{t('charts.legend.postViews')}</span>
      </span>
      <span className="flex items-center gap-2">
        <span className="inline-block w-3 h-3 rounded bg-[#8b5cf6]" />
        <span className="text-sm">{t('charts.legend.comments')}</span>
      </span>
    </div>
  );
};

export default SocialMediaLegend;
