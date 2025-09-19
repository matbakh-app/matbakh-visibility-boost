import { useState } from 'react';

export type ViewType = 
  | 'landing'
  | 'step1' 
  | 'step2'
  | 'loading'
  | 'results'
  | 'dashboard'
  | 'profile'
  | 'company-profile';

export function useAppNavigation() {
  const [activeView, setActiveView] = useState<ViewType>('landing');

  const navigateToView = (view: ViewType) => {
    setActiveView(view);
  };

  return {
    activeView,
    navigateToView
  };
}