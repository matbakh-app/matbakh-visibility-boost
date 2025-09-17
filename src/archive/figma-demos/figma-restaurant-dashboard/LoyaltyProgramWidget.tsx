import React from 'react';
import { Gift } from 'lucide-react';
import ComingSoonWidget from './ComingSoonWidget';

const LoyaltyProgramWidget = () => {
  return (
    <ComingSoonWidget
      icon={Gift}
      title="Kundenloyalität-Programm"
      description="Erstelle Belohnungsprogramme, verwalte Kundenpunkte und steigere die Wiederkehrrate deiner Gäste."
      progressLabel="Planning Phase"
      progressValue={25}
      onEarlyAccess={() => console.log('Early Access requested for Customer Loyalty Program')}
    />
  );
};

export default LoyaltyProgramWidget;