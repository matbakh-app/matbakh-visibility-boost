import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { signInWithGoogle, signInWithFacebook } = useAuth();
  const { t } = useTranslation('auth');

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-card p-8 rounded-lg border shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-6">
          Anmeldung erforderlich
        </h1>
        
        <p className="text-muted-foreground text-center mb-6">
          Sie müssen sich anmelden, um auf diese Seite zugreifen zu können.
        </p>
        
        <div className="space-y-4">
          <button
            onClick={signInWithGoogle}
            className="w-full bg-primary text-primary-foreground py-2 px-4 rounded hover:bg-primary/90 transition-colors"
          >
            Mit Google anmelden
          </button>
          
          <button
            onClick={signInWithFacebook}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
          >
            Mit Facebook anmelden
          </button>
          
          <button
            onClick={() => navigate('/login')}
            className="w-full border border-border py-2 px-4 rounded hover:bg-muted transition-colors"
          >
            Zur Anmeldeseite
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;