
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const DashboardRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/dashboard/overview', { replace: true });
  }, [navigate]);

  return null;
};

export default DashboardRedirect;
