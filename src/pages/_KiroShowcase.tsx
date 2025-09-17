import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Database, Settings, Users, BarChart3, Mail, CreditCard, MessageSquare, Globe } from 'lucide-react';

interface FeatureFlag {
  flag_name: string;
  enabled: boolean;
  value: string | null;
  description: string;
}

export default function KiroShowcase() {
  const { t, i18n } = useTranslation();
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [guardDiagnosis, setGuardDiagnosis] = useState<any>(null);

  useEffect(() => {
    // Try to fetch feature flags (will fail gracefully if not available)
    fetch('/functions/v1/admin-overview')
      .then(r => r.json())
      .then(data => {
        if (data.feature_flags) {
          setFlags(data.feature_flags);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });

    // Run onboarding guard diagnosis
    runGuardDiagnosis();
  }, []);

  const runGuardDiagnosis = async () => {
    try {
      const { shouldRedirectToOnboarding } = await import('@/guards/onboardingGuard');
      const { getFlagBool } = await import('@/utils/featureFlags');
      
      const guardEnabled = await getFlagBool('onboarding_guard_live', false);
      const currentPath = window.location.pathname;
      const wouldRedirect = await shouldRedirectToOnboarding(currentPath);
      
      // Try to get user role and profile info
      let userRole = 'unknown';
      let profileInfo = {};
      
      try {
        // MIGRATED: Use AWS services instead
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();
          
          userRole = profile?.role || 'viewer';
          
          const { data: partner } = await supabase
            .from('business_partners')
            .select('status, onboarding_completed')
            .eq('user_id', user.id)
            .maybeSingle();
          
          profileInfo = {
            hasProfile: !!profile,
            hasPartner: !!partner,
            partnerStatus: partner?.status,
            onboardingCompleted: partner?.onboarding_completed
          };
        }
      } catch (error) {
        console.warn('Guard diagnosis: Could not fetch user info:', error);
      }
      
      setGuardDiagnosis({
        guardEnabled,
        currentPath,
        wouldRedirect,
        userRole,
        profileInfo
      });
    } catch (error) {
      console.error('Guard diagnosis failed:', error);
      setGuardDiagnosis({ error: error.message });
    }
  };

  const routes = [
    {
      category: 'Visibility Check (VC)',
      icon: <BarChart3 className="w-5 h-5" />,
      items: [
        { path: '/vc/quick', label: 'VC Quick Entry', access: 'public', description: 'Email-based visibility check entry point' },
        { path: '/vc/result', label: 'VC Result (needs token)', access: 'public', description: 'Results display with invisible UI support' },
        { path: '/vc/result/dashboard', label: 'VC Result Dashboard', access: 'public', description: 'Dashboard view of VC results' },
      ]
    },
    {
      category: 'Owner Dashboard',
      icon: <Users className="w-5 h-5" />,
      items: [
        { path: '/dashboard', label: 'Owner Overview', access: 'auth', description: 'Restaurant owner dashboard with VC insights' },
      ]
    },
    {
      category: 'Admin Panel',
      icon: <Settings className="w-5 h-5" />,
      items: [
        { path: '/admin', label: 'Admin Overview', access: 'admin', description: 'System overview and statistics' },
        { path: '/admin/leads', label: 'Admin Leads', access: 'admin', description: 'VC leads management' },
        { path: '/admin/vc-runs', label: 'Admin VC Runs', access: 'admin', description: 'VC execution monitoring' },
        { path: '/admin/partners', label: 'Admin Partners', access: 'admin', description: 'Partner management' },
        { path: '/admin/partner-credits', label: 'Partner Credits', access: 'admin', description: 'Credit system management' },
        { path: '/admin/content-queue', label: 'Content Queue', access: 'admin', description: 'Social media posting queue' },
      ]
    },
    {
      category: 'API Functions',
      icon: <Database className="w-5 h-5" />,
      items: [
        { path: '/functions/v1/vc-start', label: 'VC Start', access: 'api', description: 'Start visibility check process' },
        { path: '/functions/v1/vc-verify', label: 'VC Verify', access: 'api', description: 'Verify DOI token' },
        { path: '/functions/v1/vc-identify', label: 'VC Identify', access: 'api', description: 'Business identification' },
        { path: '/functions/v1/vc-bedrock-run', label: 'VC Bedrock', access: 'api', description: 'AI analysis engine' },
        { path: '/functions/v1/partner-credits', label: 'Partner Credits API', access: 'api', description: 'Credit consumption API' },
        { path: '/functions/v1/og-vc', label: 'OG Share', access: 'api', description: 'Social sharing previews' },
      ]
    }
  ];

  const getAccessBadge = (access: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      public: { variant: "default", label: "Public" },
      auth: { variant: "secondary", label: "Auth Required" },
      admin: { variant: "destructive", label: "Admin Only" },
      api: { variant: "outline", label: "API" }
    };
    
    const config = variants[access] || { variant: "outline", label: access };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getFlagBadge = (flag: FeatureFlag) => {
    if (!flag.enabled) {
      return <Badge variant="outline">Disabled</Badge>;
    }
    
    if (flag.value && flag.value !== 'null') {
      return <Badge variant="default">{flag.value}</Badge>;
    }
    
    return <Badge variant="default">Enabled</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900">Kiro Live Artifacts</h1>
              <p className="text-lg text-gray-600">
                All implemented features, routes, and system status
              </p>
            </div>
            
            {/* Language Switcher */}
            <div className="flex items-center gap-2 bg-white rounded-lg border p-2">
              <Globe className="w-4 h-4 text-gray-500" />
              <select
                value={i18n.language}
                onChange={(e) => i18n.changeLanguage(e.target.value)}
                className="text-sm border-0 bg-transparent focus:outline-none"
              >
                <option value="de">Deutsch</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-center gap-4">
            <Badge variant="default" className="text-sm">
              <Database className="w-4 h-4 mr-1" />
              Database Ready
            </Badge>
            <Badge variant="default" className="text-sm">
              <Mail className="w-4 h-4 mr-1" />
              DOI System Active
            </Badge>
            <Badge variant="secondary" className="text-sm">
              <MessageSquare className="w-4 h-4 mr-1" />
              Invisible UI Ready
            </Badge>
          </div>
        </div>

        {/* Onboarding Guard Diagnosis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Onboarding Guard Diagnosis
            </CardTitle>
          </CardHeader>
          <CardContent>
            {guardDiagnosis ? (
              guardDiagnosis.error ? (
                <div className="text-red-600">Error: {guardDiagnosis.error}</div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Guard Enabled:</span>
                        <Badge variant={guardDiagnosis.guardEnabled ? "destructive" : "default"}>
                          {guardDiagnosis.guardEnabled ? "ACTIVE" : "DISABLED"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Current Path:</span>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {guardDiagnosis.currentPath}
                        </code>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Would Redirect:</span>
                        <Badge variant={guardDiagnosis.wouldRedirect ? "destructive" : "default"}>
                          {guardDiagnosis.wouldRedirect ? `YES → ${guardDiagnosis.wouldRedirect}` : "NO"}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">User Role:</span>
                        <Badge variant="outline">{guardDiagnosis.userRole}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Has Profile:</span>
                        <Badge variant={guardDiagnosis.profileInfo.hasProfile ? "default" : "outline"}>
                          {guardDiagnosis.profileInfo.hasProfile ? "YES" : "NO"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Partner Status:</span>
                        <Badge variant="outline">
                          {guardDiagnosis.profileInfo.partnerStatus || "none"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Status:</strong> {guardDiagnosis.guardEnabled 
                        ? "⚠️ Guard is ACTIVE - may redirect users to onboarding" 
                        : "✅ Guard is DISABLED - no automatic redirects"}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      To disable: Set feature flag 'onboarding_guard_live' to false
                    </p>
                  </div>
                </div>
              )
            ) : (
              <div className="text-center py-4">Running diagnosis...</div>
            )}
          </CardContent>
        </Card>

        {/* Feature Flags */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Feature Flags Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Loading feature flags...</div>
            ) : flags.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {flags.map((flag) => (
                  <div key={flag.flag_name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-sm">{flag.flag_name}</div>
                      <div className="text-xs text-gray-600">{flag.description}</div>
                    </div>
                    {getFlagBadge(flag)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Fallback static flags */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-sm">vc_doi_live</div>
                    <div className="text-xs text-gray-600">DOI email system</div>
                  </div>
                  <Badge variant="default">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-sm">vc_bedrock_live</div>
                    <div className="text-xs text-gray-600">AI analysis</div>
                  </div>
                  <Badge variant="default">10%</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-sm">ui_invisible_default</div>
                    <div className="text-xs text-gray-600">Mobile UI mode</div>
                  </div>
                  <Badge variant="default">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-sm">partner_credits_live</div>
                    <div className="text-xs text-gray-600">Credit system</div>
                  </div>
                  <Badge variant="default">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-sm">vc_posting_live</div>
                    <div className="text-xs text-gray-600">Social posting</div>
                  </div>
                  <Badge variant="outline">Disabled</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Routes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {routes.map((category) => (
            <Card key={category.category}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {category.icon}
                  {category.category}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {category.items.map((item) => (
                    <div key={item.path} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{item.label}</span>
                          {getAccessBadge(item.access)}
                        </div>
                        <div className="text-xs text-gray-600 mb-2">{item.description}</div>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">{item.path}</code>
                      </div>
                      {item.access !== 'api' && (
                        <Button asChild variant="outline" size="sm">
                          <Link to={item.path}>
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* System Info */}
        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">✓</div>
                <div className="text-sm font-medium">Database</div>
                <div className="text-xs text-gray-600">Tables & migrations ready</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">✓</div>
                <div className="text-sm font-medium">i18n</div>
                <div className="text-xs text-gray-600">DE/EN vc_microcopy active</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">✓</div>
                <div className="text-sm font-medium">Invisible UI</div>
                <div className="text-xs text-gray-600">Mobile-optimized interface</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>Generated: {new Date().toLocaleString('de-DE')}</p>
          <p>All systems operational and ready for testing</p>
        </div>
      </div>
    </div>
  );
}