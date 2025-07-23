
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ExternalLink, Users, CheckCircle2, AlertCircle, Clock, Calendar } from 'lucide-react';

interface PlatformData {
  platform: 'google' | 'facebook' | 'instagram';
  score: number;
  maxScore: number;
  completedFeatures: string[];
  missingFeatures: string[];
  profileUrl?: string;
  profilePicture?: string;
  profileFound: boolean;
  autoDetected?: boolean;
  recommendations: string[];
  followerCount?: number;
  reservationAvailable?: boolean;
  hasHolidayHours?: boolean;
  askSectionVisible?: boolean;
  isListingComplete?: boolean;
  category?: string;
}

const getPlatformIcon = (platform: string) => {
  switch (platform) {
    case 'google': return '🔍';
    case 'facebook': return '📘';
    case 'instagram': return '📷';
    default: return '📊';
  }
};

const getPlatformColor = (platform: string) => {
  switch (platform) {
    case 'google': return 'border-blue-500';
    case 'facebook': return 'border-blue-600';
    case 'instagram': return 'border-pink-500';
    default: return 'border-gray-500';
  }
};

const ScoreDonut: React.FC<{ score: number; size?: 'sm' | 'lg' }> = ({ score, size = 'sm' }) => {
  const radius = size === 'lg' ? 40 : 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className={`relative ${size === 'lg' ? 'w-24 h-24' : 'w-16 h-16'}`}>
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="text-gray-200"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className={getScoreColor(score)}
          strokeLinecap="round"
        />
      </svg>
      <div className={`absolute inset-0 flex items-center justify-center ${size === 'lg' ? 'text-xl' : 'text-sm'} font-bold ${getScoreColor(score)}`}>
        {score}%
      </div>
    </div>
  );
};

// Helper function to ensure proper URL formatting
const formatProfileUrl = (url: string | undefined, platform: string): string | undefined => {
  if (!url) return undefined;
  
  // If URL already starts with http, return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Handle platform-specific URL formatting
  switch (platform) {
    case 'instagram':
      // If it's just a username, format as Instagram URL
      if (!url.includes('/')) {
        return `https://www.instagram.com/${url.replace('@', '')}`;
      }
      // If it's a partial URL, add https://www.instagram.com
      if (url.startsWith('/')) {
        return `https://www.instagram.com${url}`;
      }
      return `https://www.instagram.com/${url}`;
    
    case 'facebook':
      if (!url.includes('/')) {
        return `https://www.facebook.com/${url}`;
      }
      if (url.startsWith('/')) {
        return `https://www.facebook.com${url}`;
      }
      return `https://www.facebook.com/${url}`;
    
    case 'google':
      if (url.startsWith('/')) {
        return `https://www.google.com${url}`;
      }
      return url.includes('google.com') ? `https://${url}` : url;
    
    default:
      return url.startsWith('//') ? `https:${url}` : `https://${url}`;
  }
};

const PlatformProfileCard: React.FC<{ platform: PlatformData }> = ({ platform }) => {
  const formattedUrl = formatProfileUrl(platform.profileUrl, platform.platform);
  
  const handleLinkClick = (e: React.MouseEvent) => {
    if (!formattedUrl) {
      e.preventDefault();
      return;
    }
    
    // Log for debugging
    console.log(`Opening ${platform.platform} profile:`, formattedUrl);
  };

  return (
    <Card className={`border-2 ${getPlatformColor(platform.platform)}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-2">
            <CardTitle className="flex items-center gap-3 capitalize text-lg">
              <span className="text-xl">{getPlatformIcon(platform.platform)}</span>
              <span>{platform.platform}</span>
            </CardTitle>
            {platform.autoDetected && (
              <Badge variant="secondary" className="text-xs w-fit">Auto-erkannt</Badge>
            )}
          </div>
          
          {formattedUrl && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <a 
                    href={formattedUrl}
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={handleLinkClick}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <ExternalLink className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                  </a>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Profil öffnen</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Profile Picture and Basic Info */}
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <ScoreDonut score={platform.score} size="sm" />
          </div>
          
          {platform.profilePicture && (
            <div className="flex-shrink-0">
              <img 
                src={platform.profilePicture} 
                alt={`${platform.platform} Profilbild`}
                className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
              />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="text-lg font-bold">{platform.score}/100</p>
              {platform.followerCount !== undefined && platform.followerCount !== null && (
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{platform.followerCount.toLocaleString()}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {platform.profileFound ? (
                <div className="flex items-center gap-1 text-green-600 text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Profil gefunden</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>Kein Profil gefunden</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Special Features for Google */}
        {platform.platform === 'google' && platform.profileFound && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            {platform.reservationAvailable && (
              <div className="flex items-center gap-1 text-green-600">
                <Calendar className="w-3 h-3" />
                <span>Reservierung</span>
              </div>
            )}
            {platform.hasHolidayHours && (
              <div className="flex items-center gap-1 text-green-600">
                <Clock className="w-3 h-3" />
                <span>Feiertagszeiten</span>
              </div>
            )}
            {platform.askSectionVisible && (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle2 className="w-3 h-3" />
                <span>Fragen & Antworten</span>
              </div>
            )}
            {platform.isListingComplete && (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle2 className="w-3 h-3" />
                <span>Vollständig</span>
              </div>
            )}
          </div>
        )}

        {/* Category Info */}
        {platform.category && (
          <div className="text-xs text-gray-600">
            <span className="font-medium">Kategorie: </span>
            <span className="font-semibold">{platform.category}</span>
          </div>
        )}
        
        {/* Completed Features */}
        {platform.completedFeatures.length > 0 && (
          <div>
            <h4 className="font-medium text-green-700 mb-2 flex items-center gap-1 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              Vorhanden
            </h4>
            <ul className="text-xs space-y-1">
              {platform.completedFeatures.slice(0, 3).map((feature, idx) => (
                <li key={idx} className="text-green-600">• {feature}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Missing Features */}
        {platform.missingFeatures.length > 0 && (
          <div>
            <h4 className="font-medium text-red-700 mb-2 flex items-center gap-1 text-sm">
              <AlertCircle className="w-4 h-4" />
              Fehlt
            </h4>
            <ul className="text-xs space-y-1">
              {platform.missingFeatures.slice(0, 3).map((feature, idx) => (
                <li key={idx} className="text-red-600">• {feature}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Top Recommendations */}
        {platform.recommendations.length > 0 && (
          <div>
            <h4 className="font-medium text-blue-700 mb-2 text-sm">Top Empfehlungen</h4>
            <ul className="text-xs space-y-1">
              {platform.recommendations.slice(0, 2).map((rec, idx) => (
                <li key={idx} className="text-blue-600">• {rec}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PlatformProfileCard;
