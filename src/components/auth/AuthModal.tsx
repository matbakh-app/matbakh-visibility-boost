import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { useUserJourney } from '@/services/UserJourneyManager';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Mail, Eye, EyeOff, ArrowLeft } from 'lucide-react';

interface AuthModalProps {
  defaultMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({ defaultMode }) => {
  const { 
    showAuthModal, 
    closeAuthModal, 
    authModalMode, 
    signInWithGoogle, 
    signInWithFacebook, 
    signIn,
    vcData,
    oauthError 
  } = useAuth();

  // UserJourneyManager hooks
  const { getNextStepAfterAuth, isFromVisibilityCheck } = useUserJourney();
  const navigate = useNavigate();
  const location = useLocation();

  // Auto-close modal on public VC routes to keep VC flow truly public
  useEffect(() => {
    const publicPrefixes = ['/visibilitycheck', '/visibility-check'];
    const isVC = publicPrefixes.some(p => location.pathname === p || location.pathname.startsWith(p + '/'));
    if (showAuthModal && isVC) {
      closeAuthModal();
    }
  }, [location.pathname, showAuthModal, closeAuthModal]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [gdprConsent, setGdprConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);

  const mode = defaultMode || authModalMode;

  // Success handler for navigation
  const handleAuthSuccess = () => {
    closeAuthModal();
    resetForm();
    
    // Navigate based on UserJourneyManager
    if (isFromVisibilityCheck()) {
      navigate('/visibilitycheck/onboarding/step1');
    } else {
      const nextStep = getNextStepAfterAuth();
      navigate(nextStep);
    }
  };

  const handleEmailAuth = async () => {
    if (!email || !password) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie E-Mail und Passwort ein.",
        variant: "destructive"
      });
      return;
    }

    if (mode === 'register') {
      if (password !== confirmPassword) {
        toast({
          title: "Fehler",
          description: "Die Passwörter stimmen nicht überein.",
          variant: "destructive"
        });
        return;
      }

      if (!gdprConsent) {
        toast({
          title: "Fehler",
          description: "Bitte stimmen Sie den Datenschutzbestimmungen zu.",
          variant: "destructive"
        });
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: "Anmeldung fehlgeschlagen",
            description: error.message,
            variant: "destructive"
          });
          return;
        }
        toast({
          title: "Erfolgreich angemeldet",
          description: "Willkommen zurück!"
        });
        handleAuthSuccess();
      } else {
        // Register - for VC flow, redirect to proper onboarding
        const redirectUrl = isFromVisibilityCheck() 
          ? `${window.location.origin}/visibilitycheck/onboarding/step1`
          : `${window.location.origin}/onboarding/standard`;
          
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              gdpr_consent: gdprConsent,
              marketing_consent: marketingConsent,
              vc_data: vcData
            }
          }
        });

        if (error) {
          toast({
            title: "Registrierung fehlgeschlagen",
            description: error.message,
            variant: "destructive"
          });
          return;
        }

        if (data.user && !data.session) {
          toast({
            title: "Bestätigen Sie Ihre E-Mail",
            description: "Wir haben Ihnen eine E-Mail zur Bestätigung gesendet. Bitte prüfen Sie Ihr Postfach.",
          });
        } else {
          toast({
            title: "Erfolgreich registriert",
            description: "Willkommen bei matbakh.app!"
          });
          handleAuthSuccess();
        }
      }

      // Don't call navigation here - handleAuthSuccess does it

    } catch (error) {
      console.error('Auth error:', error);
      toast({
        title: "Fehler",
        description: "Ein unerwarteter Fehler ist aufgetreten.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie Ihre E-Mail-Adresse ein.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/password-reset`
      });

      if (error) {
        toast({
          title: "Fehler",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "E-Mail gesendet",
        description: "Wir haben Ihnen einen Link zum Zurücksetzen des Passworts gesendet."
      });

      setForgotPassword(false);

    } catch (error) {
      console.error('Password reset error:', error);
      toast({
        title: "Fehler",
        description: "Ein unerwarteter Fehler ist aufgetreten.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuth = async (provider: 'google' | 'facebook') => {
    setLoading(true);
    try {
      if (provider === 'google') {
        await signInWithGoogle();
      } else {
        await signInWithFacebook();
      }
    } catch (error) {
      console.error(`${provider} auth error:`, error);
      toast({
        title: "Anmeldung fehlgeschlagen",
        description: `Die Anmeldung mit ${provider === 'google' ? 'Google' : 'Facebook'} ist fehlgeschlagen.`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setGdprConsent(false);
    setMarketingConsent(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setForgotPassword(false);
  };

  const handleClose = () => {
    closeAuthModal();
    resetForm();
  };

  if (forgotPassword) {
    return (
      <Dialog open={showAuthModal} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setForgotPassword(false)}
                className="p-0 h-auto"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <DialogTitle>Passwort zurücksetzen</DialogTitle>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="reset-email">E-Mail-Adresse</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="ihre@email.de"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <Button 
              onClick={handleForgotPassword}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Wird gesendet...' : 'Link senden'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={showAuthModal} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'login' ? 'Anmelden' : 'Registrieren'}
          </DialogTitle>
        </DialogHeader>

        {/* OAuth Error Display */}
        {oauthError && (
          <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
            {oauthError}
          </div>
        )}

        <div className="space-y-4">
          {/* Social Auth Buttons */}
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleSocialAuth('google')}
              disabled={loading}
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Mit Google {mode === 'login' ? 'anmelden' : 'registrieren'}
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleSocialAuth('facebook')}
              disabled={loading}
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Mit Facebook {mode === 'login' ? 'anmelden' : 'registrieren'}
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">oder</span>
            </div>
          </div>

          {/* Email Form */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="email">E-Mail-Adresse</Label>
              <Input
                id="email"
                type="email"
                placeholder="ihre@email.de"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="password">Passwort</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}

            {mode === 'register' && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="gdpr"
                    checked={gdprConsent}
                    onCheckedChange={(checked) => setGdprConsent(checked === true)}
                  />
                  <Label htmlFor="gdpr" className="text-sm">
                    Ich stimme den{' '}
                    <a href="/datenschutz" target="_blank" className="text-primary underline">
                      Datenschutzbestimmungen
                    </a>{' '}
                    zu *
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="marketing"
                    checked={marketingConsent}
                    onCheckedChange={(checked) => setMarketingConsent(checked === true)}
                  />
                  <Label htmlFor="marketing" className="text-sm">
                    Ich möchte Marketing-E-Mails erhalten (optional)
                  </Label>
                </div>
              </div>
            )}

            <Button 
              onClick={handleEmailAuth}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Wird bearbeitet...' : (mode === 'login' ? 'Anmelden' : 'Registrieren')}
            </Button>

            {mode === 'login' && (
              <div className="text-center">
                <Button
                  variant="link"
                  onClick={() => setForgotPassword(true)}
                  className="text-sm text-muted-foreground"
                >
                  Passwort vergessen?
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};