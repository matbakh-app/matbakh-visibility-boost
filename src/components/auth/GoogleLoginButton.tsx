import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';

interface GoogleLoginButtonProps {
  onGoogleAuth: () => void;
  loading: boolean;
}

const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ onGoogleAuth, loading }) => {
  const { t } = useTranslation('auth');

  return (
    <div className="space-y-3">
      {/* Google CTA Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
        <p className="text-blue-800 leading-relaxed">
          {t('google.ctaNotice')}
        </p>
      </div>

      {/* Permission Notice */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs">
        <p className="text-gray-700 leading-relaxed">
          {t('google.permissionNotice')}
        </p>
      </div>

      {/* Google Login Button */}
      <Button
        onClick={onGoogleAuth}
        variant="outline"
        className="w-full"
        disabled={loading}
      >
        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        {loading ? t('google.loading') : t('google.loginButton')}
      </Button>

      {/* Security Note */}
      <div className="flex items-center justify-center space-x-1 text-xs text-gray-500">
        <Shield className="w-3 h-3" />
        <span>{t('google.securityNote')}</span>
      </div>
    </div>
  );
};

export default GoogleLoginButton;