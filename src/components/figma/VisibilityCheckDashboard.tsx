import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { VCPublicDashboard } from './VCPublicDashboard';
import { VCMemberDashboard } from './VCMemberDashboard';

export const VisibilityCheckDashboard: React.FC = () => {
  return (
    <Routes>
      <Route path="public" element={<VCPublicDashboard />} />
      <Route path="member" element={<VCMemberDashboard />} />
      <Route path="results" element={<VCPublicDashboard />} />
      <Route index element={<Navigate to="public" replace />} />
    </Routes>
  );
};