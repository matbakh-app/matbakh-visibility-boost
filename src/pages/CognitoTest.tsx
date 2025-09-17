// src/pages/CognitoTest.tsx
/**
 * Cognito Test Page for matbakh.app
 * Phase A3.2 - Cognito Auth Integration
 *
 * Test page to verify Cognito authentication functionality.
 * Route-Tipp: Im Router unter "/cognito-test" erreichbar.
 */

import React, { useEffect, useState } from 'react';
import {
  signUp,
  confirmSignUp,
  signIn,
  signOut,
  fetchAuthSession,
} from 'aws-amplify/auth';
// Falls ihr useAuth hier nicht benötigt, könnt ihr den Import löschen.
// import { useAuth } from '@/contexts/AuthContext';
import apiClient from '../api/client';

type TestResult = Record<
  string,
  | {
      status: 'success' | 'error' | 'no_session' | string;
      [key: string]: any;
    }
  | any
>;

const CognitoTest: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Test credentials for development
  const [email, setEmail] = useState('rabieb@gmx.de');
  const [password, setPassword] = useState('TestPassword123!');
  const [confirmationCode, setConfirmationCode] = useState('');

  /**
   * Test Amplify configuration (liest VITE-Variablen)
   */
  const testAmplifyConfig = async () => {
    try {
      const clientId =
        (import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID ??
          import.meta.env.VITE_COGNITO_USER_POOL_WEB_CLIENT_ID ??
          '') as string;

      setTestResults((prev) => ({
        ...prev,
        amplifyConfig: {
          status: 'success',
          userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
          region: import.meta.env.VITE_AWS_REGION,
          // Beide Varianten werden im Code an anderer Stelle genutzt:
          clientIdShort: clientId ? clientId.toString().substring(0, 8) + '...' : '(leer)',
        },
      }));
    } catch (err) {
      setTestResults((prev) => ({
        ...prev,
        amplifyConfig: {
          status: 'error',
          error: err instanceof Error ? err.message : 'Unknown error',
        },
      }));
    }
  };

  /**
   * Test current session
   */
  const testCurrentSession = async () => {
    try {
      const session = await fetchAuthSession();
      const accessToken = session.tokens?.accessToken?.toString?.() ?? '';
      const exp = session.tokens?.accessToken?.payload?.exp;

      setTestResults((prev) => ({
        ...prev,
        currentSession: {
          status: 'success',
          hasTokens: Boolean(session.tokens),
          accessToken: accessToken ? accessToken.substring(0, 20) + '...' : '',
          expiresAt: exp ? new Date(exp * 1000).toISOString() : 'unknown',
        },
      }));
    } catch (err) {
      setTestResults((prev) => ({
        ...prev,
        currentSession: {
          status: 'no_session',
          error: err instanceof Error ? err.message : 'No active session',
        },
      }));
    }
  };

  /**
   * Test user sign up
   * Hinweis: KEINE custom-Attribute verwenden, solange sie im Pool nicht definiert sind.
   */
  const testSignUp = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
            given_name: 'Test',
            family_name: 'User',
            // KEINE custom:locale oder custom:user_role ohne vorherige Schema-Definition in Cognito
          },
        },
      });

      setTestResults((prev) => ({
        ...prev,
        signUp: {
          status: 'success',
          userSub: result.userSub,
          codeDelivery: result.nextStep,
        },
      }));
    } catch (err) {
      setTestResults((prev) => ({
        ...prev,
        signUp: {
          status: 'error',
          error: err instanceof Error ? err.message : 'Sign up failed',
        },
      }));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Test email confirmation
   */
  const testConfirmSignUp = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await confirmSignUp({
        username: email,
        confirmationCode,
      });

      setTestResults((prev) => ({
        ...prev,
        confirmSignUp: {
          status: 'success',
          message: 'Email confirmed successfully',
          nextStep: result.nextStep,
        },
      }));
    } catch (err) {
      setTestResults((prev) => ({
        ...prev,
        confirmSignUp: {
          status: 'error',
          error: err instanceof Error ? err.message : 'Confirmation failed',
        },
      }));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Test user sign in
   */
  const testSignIn = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await signIn({
        username: email,
        password,
      });

      setTestResults((prev) => ({
        ...prev,
        signIn: {
          status: 'success',
          isSignedIn: result.isSignedIn,
          nextStep: result.nextStep,
        },
      }));

      // Also test session after sign in
      await testCurrentSession();
    } catch (err) {
      setTestResults((prev) => ({
        ...prev,
        signIn: {
          status: 'error',
          error: err instanceof Error ? err.message : 'Sign in failed',
        },
      }));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Test API call with authentication
   */
  const testAPICall = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get('/health');
      setTestResults((prev) => ({
        ...prev,
        apiCall: {
          status: 'success',
          response: (response as any).data ?? response,
          timestamp: new Date().toISOString(),
        },
      }));
    } catch (err) {
      setTestResults((prev) => ({
        ...prev,
        apiCall: {
          status: 'error',
          error: err instanceof Error ? err.message : 'API call failed',
        },
      }));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Test sign out
   */
  const testSignOut = async () => {
    try {
      setLoading(true);
      setError(null);

      await signOut();

      setTestResults((prev) => ({
        ...prev,
        signOut: {
          status: 'success',
          message: 'Signed out successfully',
        },
      }));

      // Clear session test result
      await testCurrentSession();
    } catch (err) {
      setTestResults((prev) => ({
        ...prev,
        signOut: {
          status: 'error',
          error: err instanceof Error ? err.message : 'Sign out failed',
        },
      }));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Run all tests
   */
  const runAllTests = async () => {
    setTestResults({});
    await testAmplifyConfig();
    await testCurrentSession();
  };

  // Run initial tests on mount
  useEffect(() => {
    void runAllTests();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'no_session':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'no_session':
        return '⚠️';
      default:
        return 'ℹ️';
    }
  };

  const apiBase =
    (import.meta.env.VITE_PUBLIC_API_BASE as string | undefined) ??
    (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
    '';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            🔐 Cognito Authentication Test
          </h1>

          <p className="text-gray-600 mb-8">
            Test page to verify AWS Cognito integration and authentication
            functionality.
          </p>

          {/* Test Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Sign Up Test */}
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Sign Up Test</h3>
              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                />
                <button
                  onClick={testSignUp}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Test Sign Up
                </button>
              </div>
            </div>

            {/* Confirmation Test */}
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Email Confirmation</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Confirmation Code"
                  value={confirmationCode}
                  onChange={(e) => setConfirmationCode(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                />
                <button
                  onClick={testConfirmSignUp}
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  Confirm Email
                </button>
              </div>
            </div>

            {/* Sign In Test */}
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Sign In Test</h3>
              <button
                onClick={testSignIn}
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                Test Sign In
              </button>
            </div>

            {/* API Test */}
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">API Call Test</h3>
              <button
                onClick={testAPICall}
                disabled={loading}
                className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50"
              >
                Test API Call
              </button>
            </div>
          </div>

          {/* Additional Controls */}
          <div className="flex flex-wrap gap-4 mb-8">
            <button
              onClick={runAllTests}
              disabled={loading}
              className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 disabled:opacity-50"
            >
              Run All Tests
            </button>
            <button
              onClick={testCurrentSession}
              disabled={loading}
              className="bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 disabled:opacity-50"
            >
              Check Session
            </button>
            <button
              onClick={testSignOut}
              disabled={loading}
              className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              Sign Out
            </button>
          </div>

          {/* Test Results */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Test Results</h2>

            {Object.entries(testResults).map(([testName, result]) => {
              const status = (result && (result as any).status) || 'info';
              return (
                <div key={testName} className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    {getStatusIcon(status)}{' '}
                    {testName
                      .replace(/([A-Z])/g, ' $1')
                      .replace(/^./, (str) => str.toUpperCase())}
                    <span
                      className={`ml-2 text-sm ${getStatusColor(status)}`}
                    >
                      ({status})
                    </span>
                  </h3>
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              );
            })}
          </div>

          {/* Environment Info */}
          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-semibold mb-3">Environment Information</h3>
            <div className="bg-gray-100 p-4 rounded">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Region:</strong> {import.meta.env.VITE_AWS_REGION}
                </div>
                <div>
                  <strong>Environment:</strong>{' '}
                  {import.meta.env.VITE_ENVIRONMENT}
                </div>
                <div>
                  <strong>User Pool ID:</strong>{' '}
                  {import.meta.env.VITE_COGNITO_USER_POOL_ID}
                </div>
                <div>
                  <strong>API Base URL:</strong> {apiBase || '(nicht gesetzt)'}
                </div>
              </div>
            </div>
          </div>

          {loading && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="bg-white p-6 rounded-lg">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4"></div>
                <p>Running test...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 rounded bg-red-50 text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CognitoTest;
