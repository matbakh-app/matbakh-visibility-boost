// File: src/pages/Dashboard.tsx
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TrialBanner from '@/components/TrialBanner';
import DashboardCard from '@/components/dashboard/DashboardCard';
import DashboardTabs from '@/components/dashboard/DashboardTabs';
import QuotaWidget from '@/components/dashboard/QuotaWidget';
import HeroSection from '@/components/dashboard/HeroSection';
import { useSyncGmb } from '@/hooks/useSyncGmb';
import { useSyncGa4 } from '@/hooks/useSyncGa4';
import { useTranslation } from 'react-i18next';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardOverview from './DashboardOverview';
import DashboardGmb from './DashboardGmb';
import DashboardGa4 from './DashboardGa4';
import DashboardSocial from './DashboardSocial';
import DashboardReports from './DashboardReports';

export default function Dashboard() {
  // ... existing code ...
}

// File: src/pages/DashboardOverview.tsx
import React from 'react';
import { GMBChart } from '@/components/dashboard/GMBChart';
import { GA4Chart } from '@/components/dashboard/GA4Chart';
import { SocialMediaChart } from '@/components/dashboard/SocialMediaChart';
import { KpiGrid } from '@/components/dashboard/KpiGrid';

export default function DashboardOverview() {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <GMBChart />
        <GA4Chart />
        <SocialMediaChart />
      </div>
      <KpiGrid category="all" />
    </>
  );
}

// File: src/pages/DashboardGmb.tsx
import React from 'react';
import { KpiGrid } from '@/components/dashboard/KpiGrid';

export default function DashboardGmb() {
  return <KpiGrid category="gmb" />;
}

// File: src/pages/DashboardGa4.tsx
import React from 'react';
import { KpiGrid } from '@/components/dashboard/KpiGrid';

export default function DashboardGa4() {
  return <KpiGrid category="ga4" />;
}

// File: src/pages/DashboardSocial.tsx
import React from 'react';
import { KpiGrid } from '@/components/dashboard/KpiGrid';

export default function DashboardSocial() {
  return <KpiGrid category="social" />;
}

// File: src/pages/DashboardReports.tsx
import React from 'react';

export default function DashboardReports() {
  return <div className="p-4">Berichte & Auswertungen folgen hier.</div>;
}
