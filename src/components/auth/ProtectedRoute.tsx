import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requirePartner?: boolean;
  requireCompleteProfile?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requirePartner = false,
  requireCompleteProfile = false
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Lädt...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login page with return URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if complete profile is required
  if (requireCompleteProfile && !user) {
    return <Navigate to="/profile" state={{ from: location }} replace />;
  }

  // If we need to check for partner status, we could add that logic here
  // For now, we just check if user is authenticated

  return <>{children}</>;
};

export default ProtectedRoute;