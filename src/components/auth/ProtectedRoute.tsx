import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { Role } from '@/lib/rbac';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requirePartner?: boolean;
  requireCompleteProfile?: boolean;
  requireRole?: Role;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requirePartner = false,
  requireCompleteProfile = false,
  requireRole
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  console.log('ProtectedRoute:', { 
    path: location.pathname, 
    user: user?.email, 
    loading, 
    requireRole 
  });

  // 🚨 EMERGENCY BYPASS: NO DATABASE TABLES EXIST YET!
  // Allow ALL authenticated users access to ALL routes until DB is deployed
  
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

  // 🚨 TEMPORARY BYPASS: Allow ALL authenticated users access to ALL routes
  // This will be removed once the database schema is deployed
  console.log('ProtectedRoute: BYPASSING all role checks - allowing access for:', user?.email);
  
  return <>{children}</>;
};

export default ProtectedRoute;