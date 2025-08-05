import React from 'react';
import { Routes, Route } from 'react-router-dom';
import VisibilityCheckOnboarding from './visibility/VisibilityCheckOnboarding';
import VisibilityStepTwo from './visibility/VisibilityStepTwo';

export const FigmaMainRouter: React.FC = () => {
  return (
    <Routes>
      <Route path="onboarding/step1" element={<VisibilityCheckOnboarding />} />
      <Route path="onboarding/step2" element={<VisibilityStepTwo />} />
      <Route path="dashboard/*" element={<div>Dashboard coming soon</div>} />
    </Routes>
  );
};