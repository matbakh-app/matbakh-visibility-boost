import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { MyProfile } from '@/components/Profile/MyProfile';
import { CompanyProfile } from '@/components/Profile/CompanyProfile';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const ProfileRoutes: React.FC = () => {
  return (
    <Routes>
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <MyProfile 
              onNavigateToCompanyProfile={() => window.location.href = '/company-profile'}
              onBack={() => window.location.href = '/dashboard'}
            />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/company-profile" 
        element={
          <ProtectedRoute requireCompleteProfile>
            <CompanyProfile 
              onSave={(data) => console.log('Company profile saved:', data)}
              onBack={() => window.location.href = '/profile'}
            />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
};

export default ProfileRoutes;