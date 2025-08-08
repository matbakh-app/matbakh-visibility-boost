import { useState, useEffect } from 'react';

export interface AppState {
  isLoading: boolean;
  isOffline: boolean;
  showFeatureTour: boolean;
  publicMode: boolean;
  widgets: string[];
}

export const useAppState = () => {
  const [state, setState] = useState<AppState>({
    isLoading: false,
    isOffline: false,
    showFeatureTour: false,
    publicMode: false,
    widgets: ['analytics', 'reviews', 'visibility-score']
  });

  const updateState = (updates: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  return {
    ...state,
    updateState
  };
};