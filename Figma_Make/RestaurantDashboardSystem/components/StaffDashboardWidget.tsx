import React from 'react';
import { Users } from 'lucide-react';
import ComingSoonWidget from './ComingSoonWidget';

const StaffDashboardWidget = () => {
  return (
    <ComingSoonWidget
      icon={Users}
      title="Mitarbeiter-Dashboard"
      description="Verwalte Schichten, verfolge Arbeitszeiten und optimiere die Personalplanung für alle Standorte."
      progressLabel="Alpha Testing"
      progressValue={40}
      onEarlyAccess={() => console.log('Early Access requested for Staff Dashboard')}
    />
  );
};

export default StaffDashboardWidget;