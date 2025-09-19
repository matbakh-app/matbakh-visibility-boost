import React from 'react';
import { useAuthUnified } from '@/hooks/useAuthUnified';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';
import { useSafeAuth } from '@/hooks/useSafeAuth';
import { useSafeTranslation } from '@/hooks/useSafeTranslation';

const AuthDebug: React.FC = () => {
  const authUnified = useAuthUnified();
  const unifiedAuth = useUnifiedAuth();
  const safeAuth = useSafeAuth();
  const { t, isReady } = useSafeTranslation();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔧 Auth System Debug</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* NEW: Auth Unified Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-emerald-600">
              ✨ Auth Unified (NEW)
            </h2>
            <div className="space-y-2 text-sm">
              <div>
                <strong>User:</strong> {authUnified.user?.email || 'None'}
              </div>
              <div>
                <strong>Authenticated:</strong> {authUnified.isAuthenticated ? '✅' : '❌'}
              </div>
              <div>
                <strong>Loading:</strong> {authUnified.isLoading ? '⏳' : '✅'}
              </div>
              <div>
                <strong>Admin:</strong> {authUnified.isAdmin ? '✅' : '❌'}
              </div>
              <div>
                <strong>Session:</strong> {authUnified.session ? '✅ Active' : '❌ None'}
              </div>
              <div>
                <strong>Error:</strong> {authUnified.oauthError || 'None'}
              </div>
            </div>
          </div>

          {/* DEPRECATED: Unified Auth Status */}
          <div className="bg-white rounded-lg shadow p-6 opacity-75">
            <h2 className="text-xl font-semibold mb-4 text-blue-600">
              🔗 Unified Auth (DEPRECATED)
            </h2>
            <div className="space-y-2 text-sm">
              <div>
                <strong>User:</strong> {unifiedAuth.user?.email || 'None'}
              </div>
              <div>
                <strong>Authenticated:</strong> {unifiedAuth.isAuthenticated ? '✅' : '❌'}
              </div>
              <div>
                <strong>Loading:</strong> {unifiedAuth.isLoading ? '⏳' : '✅'}
              </div>
              <div>
                <strong>Error:</strong> {unifiedAuth.error || 'None'}
              </div>
            </div>
          </div>

          {/* DEPRECATED: Safe Auth Status */}
          <div className="bg-white rounded-lg shadow p-6 opacity-75">
            <h2 className="text-xl font-semibold mb-4 text-green-600">
              🛡️ Safe Auth (DEPRECATED)
            </h2>
            <div className="space-y-2 text-sm">
              <div>
                <strong>User:</strong> {safeAuth.user?.email || 'None'}
              </div>
              <div>
                <strong>User ID:</strong> {safeAuth.user?.id || 'None'}
              </div>
              <div>
                <strong>Authenticated:</strong> {safeAuth.isAuthenticated ? '✅' : '❌'}
              </div>
              <div>
                <strong>Loading:</strong> {safeAuth.isLoading ? '⏳' : '✅'}
              </div>
              <div>
                <strong>Session:</strong> {safeAuth.session ? '✅ Active' : '❌ None'}
              </div>
              <div>
                <strong>Admin:</strong> {safeAuth.isAdmin ? '✅' : '❌'}
              </div>
              <div>
                <strong>Error:</strong> {safeAuth.error || 'None'}
              </div>
            </div>
            
            {safeAuth.session && (
              <div className="mt-4 p-3 bg-gray-50 rounded text-xs">
                <strong>Session Details:</strong>
                <div>Access Token: {safeAuth.session.access_token ? '✅ Present' : '❌ Missing'}</div>
                <div>Provider Token: {safeAuth.session.provider_token ? '✅ Present' : '❌ Missing'}</div>
                <div>Expires: {safeAuth.session.expires_at ? new Date(safeAuth.session.expires_at * 1000).toLocaleString() : 'Unknown'}</div>
              </div>
            )}
            
            <button 
              onClick={() => safeAuth.signOut?.()}
              className="mt-4 px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
            >
              🚪 Sign Out (Test)
            </button>
          </div>

          {/* i18n Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-purple-600">
              🌐 i18n Status
            </h2>
            <div className="space-y-2 text-sm">
              <div>
                <strong>Ready:</strong> {isReady ? '✅' : '❌'}
              </div>
              <div>
                <strong>Test Translation:</strong> {t('common.loading')}
              </div>
            </div>
          </div>

          {/* System Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-orange-600">
              ⚙️ System Info
            </h2>
            <div className="space-y-2 text-sm">
              <div>
                <strong>Port:</strong> {window.location.port || 'Default'}
              </div>
              <div>
                <strong>Host:</strong> {window.location.hostname}
              </div>
              <div>
                <strong>Protocol:</strong> {window.location.protocol}
              </div>
              <div>
                <strong>URL:</strong> {window.location.href}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">
            🎯 JTBD Success Criteria
          </h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>✅ No "useAuth must be used within AuthProvider" errors</li>
            <li>✅ No "i18n not initialized" errors</li>
            <li>✅ Unified auth interface works</li>
            <li>✅ Safe fallbacks prevent crashes</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AuthDebug;