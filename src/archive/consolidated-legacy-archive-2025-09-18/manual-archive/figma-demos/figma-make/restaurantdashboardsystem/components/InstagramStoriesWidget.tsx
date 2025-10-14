import React from 'react';
import { Instagram } from 'lucide-react';
import ComingSoonWidget from './ComingSoonWidget';

const InstagramStoriesWidget = () => {
  return (
    <ComingSoonWidget
      icon={Instagram}
      title="Instagram Stories Insights"
      description="Analysiere die Performance deiner Instagram Stories und erhalte detaillierte Einblicke in Reichweite und Engagement."
      progressLabel="Beta Development"
      progressValue={75}
      onEarlyAccess={() => console.log('Early Access requested for Instagram Stories Insights')}
    />
  );
};

export default InstagramStoriesWidget;