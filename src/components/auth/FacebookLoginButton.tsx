
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';

interface FacebookLoginButtonProps {
  onFacebookAuth: () => void;
  loading: boolean;
}

const FacebookLoginButton: React.FC<FacebookLoginButtonProps> = ({ onFacebookAuth, loading }) => {
  const { t } = useTranslation('auth');

  return (
    <div className="space-y-3">
      {/* Facebook Login Button */}
      <Button
        onClick={onFacebookAuth}
        variant="outline"
        className="w-full bg-white hover:bg-gray-50 border-gray-300 text-gray-800"
        disabled={loading}
      >
        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
          <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
        {loading ? t('facebook.loading') : t('facebook.loginButton')}
      </Button>

      {/* DSGVO-konformer rechtlicher Hinweis */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs">
        <p className="text-gray-700 leading-relaxed">
          {t('facebook.legalNotice')}
        </p>
      </div>

      {/* Security Note */}
      <div className="flex items-center justify-center space-x-1 text-xs text-gray-500">
        <Shield className="w-3 h-3" />
        <span>{t('facebook.securityNote')}</span>
      </div>
    </div>
  );
};

export default FacebookLoginButton;
