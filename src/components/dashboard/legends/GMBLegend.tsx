
import React from 'react';
import { useTranslation } from 'react-i18next';

interface GMBLegendProps {
  lang: string;
}

const GMBLegend: React.FC<GMBLegendProps> = ({ lang }) => {
  const { t, ready } = useTranslation('dashboard', { useSuspense: false });

  // Debug: Welche Sprache, Keys, Status?
  console.log('[GMBLegend] lang:', lang, 'ready:', ready, 'profileViews:', t('charts.legend.profileViews'));

  // Fallback, falls noch nicht geladen
  if (!ready) return <div>Lädt…</div>;

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 mt-4" key={lang}>
      <span className="flex items-center gap-2">
        <span className="inline-block w-3 h-3 rounded bg-[#3b82f6]" />
        <span className="text-sm">{t('charts.legend.profileViews', 'Profilaufrufe')}</span>
      </span>
      <span className="flex items-center gap-2">
        <span className="inline-block w-3 h-3 rounded bg-[#10b981]" />
        <span className="text-sm">{t('charts.legend.clicks', 'Klicks')}</span>
      </span>
    </div>
  );
};

export default GMBLegend;
