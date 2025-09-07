/**
 * Login Page for matbakh.app
 * Phase A3.2 - Cognito Auth Integration
 * 
 * Login page using AWS Amplify UI components with custom theming
 */

import React from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import '@aws-amplify/ui-react/styles.css';

// Custom theme for matbakh.app branding
const theme = {
  name: 'matbakh-theme',
  tokens: {
    colors: {
      brand: {
        primary: {
          10: '#f0f9ff',
          20: '#e0f2fe',
          40: '#0ea5e9',
          60: '#0284c7',
          80: '#0369a1',
          90: '#0c4a6e',
          100: '#082f49'
        }
      },
      font: {
        primary: '#1f2937',
        secondary: '#6b7280',
        tertiary: '#9ca3af'
      },
      background: {
        primary: '#ffffff',
        secondary: '#f9fafb'
      }
    },
    fonts: {
      default: {
        variable: { value: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
        static: { value: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }
      }
    },
    space: {
      small: { value: '0.5rem' },
      medium: { value: '1rem' },
      large: { value: '1.5rem' },
      xl: { value: '2rem' }
    },
    radii: {
      small: { value: '0.375rem' },
      medium: { value: '0.5rem' },
      large: { value: '0.75rem' }
    }
  }
};

// Custom form fields configuration
const formFields = {
  signIn: {
    username: {
      placeholder: 'E-Mail-Adresse eingeben',
      label: 'E-Mail-Adresse',
      required: true
    },
    password: {
      placeholder: 'Passwort eingeben',
      label: 'Passwort',
      required: true
    }
  },
  signUp: {
    username: {
      placeholder: 'E-Mail-Adresse eingeben',
      label: 'E-Mail-Adresse',
      required: true,
      order: 1
    },
    password: {
      placeholder: 'Passwort eingeben (min. 8 Zeichen)',
      label: 'Passwort',
      required: true,
      order: 2
    },
    confirm_password: {
      placeholder: 'Passwort bestätigen',
      label: 'Passwort bestätigen',
      required: true,
      order: 3
    },
    given_name: {
      placeholder: 'Vorname eingeben',
      label: 'Vorname',
      required: false,
      order: 4
    },
    family_name: {
      placeholder: 'Nachname eingeben',
      label: 'Nachname',
      required: false,
      order: 5
    }
  },
  confirmSignUp: {
    confirmation_code: {
      placeholder: '6-stelligen Code eingeben',
      label: 'Bestätigungscode',
      required: true
    }
  },
  forgotPassword: {
    username: {
      placeholder: 'E-Mail-Adresse eingeben',
      label: 'E-Mail-Adresse',
      required: true
    }
  },
  confirmResetPassword: {
    confirmation_code: {
      placeholder: '6-stelligen Code eingeben',
      label: 'Bestätigungscode',
      required: true
    },
    password: {
      placeholder: 'Neues Passwort eingeben',
      label: 'Neues Passwort',
      required: true
    },
    confirm_password: {
      placeholder: 'Neues Passwort bestätigen',
      label: 'Passwort bestätigen',
      required: true
    }
  }
};

// Custom text translations
const texts = {
  'Sign In': 'Anmelden',
  'Sign Up': 'Registrieren',
  'Sign Out': 'Abmelden',
  'Sign in': 'Anmelden',
  'Sign up': 'Registrieren',
  'Create Account': 'Konto erstellen',
  'Forgot your password?': 'Passwort vergessen?',
  'Reset password': 'Passwort zurücksetzen',
  'Send code': 'Code senden',
  'Confirm': 'Bestätigen',
  'Back to Sign In': 'Zurück zur Anmeldung',
  'Confirm Sign Up': 'Registrierung bestätigen',
  'Resend Code': 'Code erneut senden',
  'We Emailed You': 'Wir haben Ihnen eine E-Mail gesendet',
  'Your code is on the way. To log in, enter the code we emailed to': 
    'Ihr Code ist unterwegs. Geben Sie den Code ein, den wir an folgende E-Mail-Adresse gesendet haben:',
  'It may take a minute to arrive.': 
    'Es kann eine Minute dauern, bis die E-Mail ankommt.',
  'Lost your code?': 'Code verloren?',
  'Skip': 'Überspringen',
  'or': 'oder',
  'Enter your email': 'E-Mail-Adresse eingeben',
  'Enter your password': 'Passwort eingeben',
  'Please confirm your password': 'Bitte bestätigen Sie Ihr Passwort',
  'Enter your given name': 'Vorname eingeben',
  'Enter your family name': 'Nachname eingeben'
};

interface LoginPageProps {
  onAuthSuccess?: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onAuthSuccess }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, profile } = useAuth();

  // Get redirect path from location state or default to dashboard
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  // Handle successful authentication
  const handleAuthSuccess = () => {
    console.log('✅ Authentication successful, redirecting to:', from);
    
    if (onAuthSuccess) {
      onAuthSuccess();
    }
    
    // Redirect to intended destination
    navigate(from, { replace: true });
  };

  // If already authenticated, redirect immediately
  React.useEffect(() => {
    if (isAuthenticated && profile) {
      handleAuthSuccess();
    }
  }, [isAuthenticated, profile]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            matbakh.app
          </h1>
          <p className="text-sm text-gray-600">
            Digitale Sichtbarkeit für Restaurants
          </p>
        </div>
      </div>

      {/* Authentication Form */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <Authenticator
            theme={theme}
            formFields={formFields}
            components={{
              Header() {
                return (
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-semibold text-gray-900">
                      Willkommen zurück
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                      Melden Sie sich in Ihrem Konto an
                    </p>
                  </div>
                );
              },
              Footer() {
                return (
                  <div className="mt-6 text-center">
                    <p className="text-xs text-gray-500">
                      Mit der Anmeldung stimmen Sie unseren{' '}
                      <a href="/legal/terms" className="text-blue-600 hover:text-blue-500">
                        Nutzungsbedingungen
                      </a>{' '}
                      und der{' '}
                      <a href="/legal/privacy" className="text-blue-600 hover:text-blue-500">
                        Datenschutzerklärung
                      </a>{' '}
                      zu.
                    </p>
                  </div>
                );
              }
            }}
            services={{
              async handleSignUp(formData) {
                // Add custom attributes for new users
                const customFormData = {
                  ...formData,
                  attributes: {
                    ...formData.attributes,
                    'custom:locale': 'de',
                    'custom:user_role': 'owner',
                    'custom:profile_complete': 'false',
                    'custom:onboarding_step': '0'
                  }
                };
                return customFormData;
              }
            }}
            hideSignUp={false}
            loginMechanisms={['email']}
            socialProviders={[]}
            variation="modal"
          >
            {({ signOut, user }) => {
              // This will be called when authentication is successful
              React.useEffect(() => {
                if (user) {
                  handleAuthSuccess();
                }
              }, [user]);

              return (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">
                    Weiterleitung...
                  </p>
                </div>
              );
            }}
          </Authenticator>
        </div>
      </div>

      {/* Additional Information */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="grid grid-cols-3 gap-4 text-sm text-gray-500">
            <div>
              <div className="font-medium text-gray-900">Sichtbarkeit</div>
              <div>Online-Präsenz analysieren</div>
            </div>
            <div>
              <div className="font-medium text-gray-900">Google</div>
              <div>My Business optimieren</div>
            </div>
            <div>
              <div className="font-medium text-gray-900">Social Media</div>
              <div>Reichweite aufbauen</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;