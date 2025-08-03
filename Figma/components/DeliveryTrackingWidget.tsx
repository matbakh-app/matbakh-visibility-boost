import React from 'react';
import { Truck } from 'lucide-react';
import ComingSoonWidget from './ComingSoonWidget';

const DeliveryTrackingWidget = () => {
  return (
    <ComingSoonWidget
      icon={Truck}
      title="Lieferzeit-Tracking"
      description="Verfolge Lieferzeiten in Echtzeit und optimiere deine Delivery-Performance für alle Plattformen."
      progressLabel="Beta Development"
      progressValue={60}
      onEarlyAccess={() => console.log('Early Access requested for Delivery Tracking')}
    />
  );
};

export default DeliveryTrackingWidget;