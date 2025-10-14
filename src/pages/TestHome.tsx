import React from 'react';
import { useSafeTranslation } from '@/hooks/useSafeTranslation';
import { useAuthUnified } from '@/hooks/useAuthUnified';

const TestHome: React.FC = () => {
  const { t, isReady: i18nReady } = useSafeTranslation();
  const { user, isAuthenticated } = useAuthUnified();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6">
          🚀 matbakh.app Test
        </h1>
        
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 rounded">
            <h3 className="font-semibold text-blue-800">i18n Status</h3>
            <p className="text-sm text-blue-600">
              {i18nReady ? '✅ Ready' : '⏳ Loading...'}
            </p>
          </div>
          
          <div className="p-3 bg-green-50 rounded">
            <h3 className="font-semibold text-green-800">Auth Status</h3>
            <p className="text-sm text-green-600">
              {isAuthenticated ? `✅ Logged in: ${user?.email}` : '❌ Not logged in'}
            </p>
          </div>
          
          <div className="p-3 bg-purple-50 rounded">
            <h3 className="font-semibold text-purple-800">Translation Test</h3>
            <p className="text-sm text-purple-600">
              {t('common.loading')}
            </p>
          </div>
        </div>
        
        <div className="mt-6 space-y-2">
          <div className="flex space-x-2">
            <a 
              href="/auth-debug" 
              className="flex-1 px-3 py-2 bg-blue-600 text-white text-center rounded text-sm hover:bg-blue-700"
            >
              🔐 Auth Debug
            </a>
            <a 
              href="/" 
              className="flex-1 px-3 py-2 bg-gray-600 text-white text-center rounded text-sm hover:bg-gray-700"
            >
              🏠 Home
            </a>
          </div>
          <p className="text-xs text-gray-500 text-center">
            Provider Architecture Test - Task 6.4.4
          </p>
        </div>
      </div>
    </div>
  );
};

export default TestHome;