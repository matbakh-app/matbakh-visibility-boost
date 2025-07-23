
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface InstagramCandidate {
  handle: string;
  score: number;
  profilePicture?: string;
  followerCount?: number;
  bio?: string;
  confidence: 'high' | 'medium' | 'low';
  matchReason: string;
}

interface Props {
  candidates: InstagramCandidate[];
  onSelect: (handle: string) => void;
  value?: string;
}

const InstagramCandidatePicker: React.FC<Props> = ({ candidates, onSelect, value }) => {
  if (!candidates || candidates.length === 0) {
    return null;
  }

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-4 bg-blue-50">
        <h4 className="font-medium text-sm text-blue-900 mb-2">
          📸 Instagram-Profile gefunden
        </h4>
        <p className="text-sm text-blue-700 mb-3">
          Wir haben {candidates.length} mögliche Instagram-Profile für Ihr Restaurant gefunden. 
          Wählen Sie das richtige aus oder geben Sie manuell ein:
        </p>
        
        <Select value={value} onValueChange={onSelect}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Wählen Sie Ihr Instagram-Profil aus..." />
          </SelectTrigger>
          <SelectContent>
            {candidates.map((candidate, index) => (
              <SelectItem key={index} value={candidate.handle}>
                <div className="flex items-center space-x-3 py-1">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={candidate.profilePicture} />
                    <AvatarFallback className="text-xs">
                      {candidate.handle.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">@{candidate.handle}</span>
                      <Badge className={`text-xs ${getConfidenceColor(candidate.confidence)}`}>
                        {candidate.confidence}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500">
                      {candidate.followerCount && `${candidate.followerCount} Follower`}
                      {candidate.bio && ` • ${candidate.bio.substring(0, 40)}...`}
                    </div>
                    <div className="text-xs text-gray-400">
                      {candidate.matchReason}
                    </div>
                  </div>
                </div>
              </SelectItem>
            ))}
            <SelectItem value="manual">
              <div className="flex items-center space-x-3 py-1">
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-xs">✏️</span>
                </div>
                <span className="font-medium">Keines davon / Manuell eingeben</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default InstagramCandidatePicker;
