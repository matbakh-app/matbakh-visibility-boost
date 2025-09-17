import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { 
  Play, 
  Clock, 
  Zap, 
  Mail, 
  Calendar, 
  Bot, 
  Sparkles,
  Timer,
  Bell
} from 'lucide-react';

interface AnalysisStartSectionProps {
  canStartAnalysis: boolean;
  isAnalysisRunning: boolean;
  estimatedDuration: string;
  onStartAnalysis: () => void;
  onScheduleChange?: (enabled: boolean, time: string, emailNotification: boolean) => void;
}

export function AnalysisStartSection({ 
  canStartAnalysis, 
  isAnalysisRunning, 
  estimatedDuration,
  onStartAnalysis,
  onScheduleChange 
}: AnalysisStartSectionProps) {
  const [autoSchedule, setAutoSchedule] = useState(false);
  const [scheduleTime, setScheduleTime] = useState('08:00');
  const [emailNotification, setEmailNotification] = useState(true);

  const handleScheduleToggle = (enabled: boolean) => {
    setAutoSchedule(enabled);
    onScheduleChange?.(enabled, scheduleTime, emailNotification);
  };

  const handleTimeChange = (time: string) => {
    setScheduleTime(time);
    onScheduleChange?.(autoSchedule, time, emailNotification);
  };

  const handleEmailToggle = (enabled: boolean) => {
    setEmailNotification(enabled);
    onScheduleChange?.(autoSchedule, scheduleTime, enabled);
  };

  const getNextScheduledAnalysis = () => {
    const now = new Date();
    const [hours, minutes] = scheduleTime.split(':').map(Number);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(hours, minutes, 0, 0);
    
    return tomorrow.toLocaleDateString('de-DE', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Manual Analysis */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <Play className="w-6 h-6 text-primary" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-card-foreground">
                Neue Visibility-Analyse starten
              </h3>
              <Badge variant="outline" className="border-primary text-primary">
                <Bot className="w-3 h-3 mr-1" />
                KI-gestützt
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground mb-4">
              Umfassende Analyse Ihrer Online-Sichtbarkeit mit modernster KI-Technologie
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Timer className="w-4 h-4" />
                <span>⏱️ Geschätzte Dauer: {estimatedDuration}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="w-4 h-4" />
                <span>Powered by AWS Bedrock + OnPal Intelligence</span>
              </div>
            </div>

            <Button 
              onClick={onStartAnalysis}
              disabled={!canStartAnalysis || isAnalysisRunning}
              size="lg"
              className="w-full md:w-auto"
            >
              {isAnalysisRunning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Analyse läuft...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Analyse jetzt starten
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Automated Scheduling */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
            <Calendar className="w-6 h-6 text-success" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-card-foreground mb-1">
                  Automatische tägliche Analyse
                </h3>
                <p className="text-sm text-muted-foreground">
                  Lassen Sie Ihre Sichtbarkeit täglich automatisch überwachen
                </p>
              </div>
              
              <Switch
                checked={autoSchedule}
                onCheckedChange={handleScheduleToggle}
                className="ml-4"
              />
            </div>

            {autoSchedule && (
              <div className="space-y-4 p-4 bg-success/5 rounded-lg border border-success/20">
                {/* Time Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Analyse-Zeit
                    </Label>
                    <Select value={scheduleTime} onValueChange={handleTimeChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="06:00">06:00 Uhr</SelectItem>
                        <SelectItem value="07:00">07:00 Uhr</SelectItem>
                        <SelectItem value="08:00">08:00 Uhr</SelectItem>
                        <SelectItem value="09:00">09:00 Uhr</SelectItem>
                        <SelectItem value="10:00">10:00 Uhr</SelectItem>
                        <SelectItem value="12:00">12:00 Uhr</SelectItem>
                        <SelectItem value="18:00">18:00 Uhr</SelectItem>
                        <SelectItem value="20:00">20:00 Uhr</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Nächste Analyse</Label>
                    <div className="px-3 py-2 bg-background rounded-md border text-sm">
                      {getNextScheduledAnalysis()}
                    </div>
                  </div>
                </div>

                {/* Email Notification */}
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="email-notification"
                    checked={emailNotification}
                    onCheckedChange={handleEmailToggle}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="email-notification" className="flex items-center gap-2 cursor-pointer">
                      <Mail className="w-4 h-4" />
                      Email-Benachrichtigung für Ergebnisse
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Erhalten Sie automatisch einen Report nach jeder Analyse
                    </p>
                  </div>
                </div>

                {/* Preview */}
                <div className="flex items-center gap-2 text-sm text-success">
                  <Bell className="w-4 h-4" />
                  <span>✅ Automatische Analyse täglich um {scheduleTime} Uhr aktiviert</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

interface AnalysisQueueStatusProps {
  queuePosition?: number;
  estimatedWaitTime?: string;
  isPriority?: boolean;
}

export function AnalysisQueueStatus({ 
  queuePosition, 
  estimatedWaitTime, 
  isPriority = false 
}: AnalysisQueueStatusProps) {
  if (!queuePosition) return null;

  return (
    <Card className="p-4 border-primary/20 bg-primary/5">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
          <Clock className="w-4 h-4 text-primary" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-card-foreground">
              Analyse in Warteschlange
            </h4>
            {isPriority && (
              <Badge variant="outline" className="border-warning text-warning">
                <Sparkles className="w-3 h-3 mr-1" />
                Priority
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Position: #{queuePosition}</span>
            {estimatedWaitTime && (
              <span>⏱️ Geschätzte Wartezeit: {estimatedWaitTime}</span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}