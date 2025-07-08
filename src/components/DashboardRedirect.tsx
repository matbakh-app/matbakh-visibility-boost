import { Navigate } from 'react-router-dom';

// Redirect-Komponente für alte Dashboard-Pfade
export const DashboardRedirect = () => {
  return <Navigate to="/dashboard" replace />;
};

export const ProfileRedirect = () => {
  return <Navigate to="/dashboard/profile" replace />;
};

export const CalendarRedirect = () => {
  return <Navigate to="/dashboard/calendar" replace />;
};