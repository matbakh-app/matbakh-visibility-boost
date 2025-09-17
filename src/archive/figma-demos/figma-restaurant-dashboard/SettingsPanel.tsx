import React from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Settings, 
  Palette, 
  Bell, 
  Globe, 
  Monitor, 
  Smartphone, 
  Tablet,
  Eye,
  EyeOff,
  Download,
  RefreshCw,
  Trash2,
  Info
} from 'lucide-react';
// Simplified hook
const useLanguage = () => ({ language: 'de' as const });

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const { language } = useLanguage();
  const [settings, setSettings] = React.useState({
    darkMode: false,
    notifications: true,
    autoRefresh: true,
    compactView: false,
    showTooltips: true,
    enableAnimations: true,
    highContrast: false,
    exportFormat: 'pdf',
    refreshInterval: 30,
    dataRetention: 90
  });

  // Settings translations
  const translations = {
    title: {
      de: 'Dashboard Einstellungen',
      en: 'Dashboard Settings'
    },
    description: {
      de: 'Passen Sie Ihr Dashboard an Ihre Bedürfnisse an',
      en: 'Customize your dashboard to fit your needs'
    },
    appearance: {
      de: 'Erscheinungsbild',
      en: 'Appearance'
    },
    darkMode: {
      de: 'Dunkler Modus',
      en: 'Dark Mode'
    },
    darkModeDesc: {
      de: 'Dunkles Design für bessere Lesbarkeit bei schwachem Licht',
      en: 'Dark design for better readability in low light'
    },
    compactView: {
      de: 'Kompakte Ansicht',
      en: 'Compact View'
    },
    compactViewDesc: {
      de: 'Zeigt mehr Widgets auf kleinerem Raum an',
      en: 'Shows more widgets in smaller space'
    },
    highContrast: {
      de: 'Hoher Kontrast',
      en: 'High Contrast'
    },
    highContrastDesc: {
      de: 'Verbesserte Lesbarkeit für bessere Zugänglichkeit',
      en: 'Enhanced readability for better accessibility'
    },
    notifications: {
      de: 'Benachrichtigungen',
      en: 'Notifications'
    },
    enableNotifications: {
      de: 'Benachrichtigungen aktivieren',
      en: 'Enable Notifications'
    },
    notificationsDesc: {
      de: 'Erhalten Sie Echtzeit-Updates zu wichtigen Ereignissen',
      en: 'Receive real-time updates about important events'
    },
    dataAndSync: {
      de: 'Daten & Synchronisation',
      en: 'Data & Sync'
    },
    autoRefresh: {
      de: 'Automatische Aktualisierung',
      en: 'Auto Refresh'
    },
    autoRefreshDesc: {
      de: 'Dashboard-Daten automatisch aktualisieren',
      en: 'Automatically refresh dashboard data'
    },
    refreshInterval: {
      de: 'Aktualisierungsintervall',
      en: 'Refresh Interval'
    },
    seconds: {
      de: 'Sekunden',
      en: 'seconds'
    },
    userExperience: {
      de: 'Benutzererfahrung',
      en: 'User Experience'
    },
    showTooltips: {
      de: 'Tooltips anzeigen',
      en: 'Show Tooltips'
    },
    tooltipsDesc: {
      de: 'Hilfreiche Informationen beim Hover anzeigen',
      en: 'Display helpful information on hover'
    },
    enableAnimations: {
      de: 'Animationen aktivieren',
      en: 'Enable Animations'
    },
    animationsDesc: {
      de: 'Flüssige Übergänge und Mikrointeraktionen',
      en: 'Smooth transitions and micro-interactions'
    },
    dataManagement: {
      de: 'Datenverwaltung',
      en: 'Data Management'
    },
    exportFormat: {
      de: 'Export-Format',
      en: 'Export Format'
    },
    dataRetention: {
      de: 'Datenaufbewahrung',
      en: 'Data Retention'
    },
    days: {
      de: 'Tage',
      en: 'days'
    },
    exportData: {
      de: 'Daten exportieren',
      en: 'Export Data'
    },
    clearCache: {
      de: 'Cache leeren',
      en: 'Clear Cache'
    },
    resetSettings: {
      de: 'Einstellungen zurücksetzen',
      en: 'Reset Settings'
    },
    saveSettings: {
      de: 'Einstellungen speichern',
      en: 'Save Settings'
    },
    cancel: {
      de: 'Abbrechen',
      en: 'Cancel'
    },
    deviceOptimization: {
      de: 'Geräte-Optimierung',
      en: 'Device Optimization'
    },
    desktop: {
      de: 'Desktop',
      en: 'Desktop'
    },
    tablet: {
      de: 'Tablet',
      en: 'Tablet'
    },
    mobile: {
      de: 'Mobil',
      en: 'Mobile'
    },
    optimizedFor: {
      de: 'Optimiert für',
      en: 'Optimized for'
    },
    currentDevice: {
      de: 'Aktuelles Gerät',
      en: 'Current Device'
    },
    version: {
      de: 'Version',
      en: 'Version'
    },
    lastUpdated: {
      de: 'Zuletzt aktualisiert',
      en: 'Last updated'
    }
  };

  const getText = (key: keyof typeof translations) => {
    return translations[key][language];
  };

  const handleSettingChange = (key: string, value: boolean | string | number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    // Save settings logic here
    console.log('Saving settings:', settings);
    onClose();
  };

  const handleReset = () => {
    setSettings({
      darkMode: false,
      notifications: true,
      autoRefresh: true,
      compactView: false,
      showTooltips: true,
      enableAnimations: true,
      highContrast: false,
      exportFormat: 'pdf',
      refreshInterval: 30,
      dataRetention: 90
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="space-y-3">
          <SheetTitle className="headline-lg text-foreground flex items-center gap-2">
            <Settings className="icon-md text-primary" />
            {getText('title')}
          </SheetTitle>
          <SheetDescription className="body-md text-muted-foreground">
            {getText('description')}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Appearance Settings */}
          <Card className="border border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="headline-md text-foreground flex items-center gap-2">
                <Palette className="icon-sm text-primary" />
                {getText('appearance')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="body-md font-medium">{getText('darkMode')}</Label>
                  <p className="caption text-muted-foreground">
                    {getText('darkModeDesc')}
                  </p>
                </div>
                <Switch
                  checked={settings.darkMode}
                  onCheckedChange={(checked) => handleSettingChange('darkMode', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="body-md font-medium">{getText('compactView')}</Label>
                  <p className="caption text-muted-foreground">
                    {getText('compactViewDesc')}
                  </p>
                </div>
                <Switch
                  checked={settings.compactView}
                  onCheckedChange={(checked) => handleSettingChange('compactView', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="body-md font-medium">{getText('highContrast')}</Label>
                  <p className="caption text-muted-foreground">
                    {getText('highContrastDesc')}
                  </p>
                </div>
                <Switch
                  checked={settings.highContrast}
                  onCheckedChange={(checked) => handleSettingChange('highContrast', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="border border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="headline-md text-foreground flex items-center gap-2">
                <Bell className="icon-sm text-primary" />
                {getText('notifications')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="body-md font-medium">{getText('enableNotifications')}</Label>
                  <p className="caption text-muted-foreground">
                    {getText('notificationsDesc')}
                  </p>
                </div>
                <Switch
                  checked={settings.notifications}
                  onCheckedChange={(checked) => handleSettingChange('notifications', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Data & Sync */}
          <Card className="border border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="headline-md text-foreground flex items-center gap-2">
                <RefreshCw className="icon-sm text-primary" />
                {getText('dataAndSync')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="body-md font-medium">{getText('autoRefresh')}</Label>
                  <p className="caption text-muted-foreground">
                    {getText('autoRefreshDesc')}
                  </p>
                </div>
                <Switch
                  checked={settings.autoRefresh}
                  onCheckedChange={(checked) => handleSettingChange('autoRefresh', checked)}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="body-md font-medium">{getText('refreshInterval')}</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={settings.refreshInterval}
                    onChange={(e) => handleSettingChange('refreshInterval', parseInt(e.target.value))}
                    className="flex h-9 w-20 rounded-md border border-input bg-input-background px-3 py-1 text-sm shadow-sm"
                    min="10"
                    max="300"
                  />
                  <span className="caption text-muted-foreground">{getText('seconds')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Experience */}
          <Card className="border border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="headline-md text-foreground flex items-center gap-2">
                <Eye className="icon-sm text-primary" />
                {getText('userExperience')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="body-md font-medium">{getText('showTooltips')}</Label>
                  <p className="caption text-muted-foreground">
                    {getText('tooltipsDesc')}
                  </p>
                </div>
                <Switch
                  checked={settings.showTooltips}
                  onCheckedChange={(checked) => handleSettingChange('showTooltips', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="body-md font-medium">{getText('enableAnimations')}</Label>
                  <p className="caption text-muted-foreground">
                    {getText('animationsDesc')}
                  </p>
                </div>
                <Switch
                  checked={settings.enableAnimations}
                  onCheckedChange={(checked) => handleSettingChange('enableAnimations', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Device Optimization Info */}
          <Card className="border border-border/50 bg-accent/10">
            <CardHeader className="pb-3">
              <CardTitle className="headline-md text-foreground flex items-center gap-2">
                <Monitor className="icon-sm text-primary" />
                {getText('deviceOptimization')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="body-md text-foreground">{getText('currentDevice')}</span>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Monitor className="w-3 h-3" />
                  {getText('desktop')}
                </Badge>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 rounded-lg bg-accent/20">
                  <Monitor className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                  <span className="caption text-muted-foreground">{getText('desktop')}</span>
                </div>
                <div className="text-center p-2 rounded-lg bg-accent/20">
                  <Tablet className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                  <span className="caption text-muted-foreground">{getText('tablet')}</span>
                </div>
                <div className="text-center p-2 rounded-lg bg-accent/20">
                  <Smartphone className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                  <span className="caption text-muted-foreground">{getText('mobile')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={handleReset} className="touch-target">
                <Trash2 className="w-4 h-4 mr-2" />
                {getText('resetSettings')}
              </Button>
              <Button variant="outline" className="touch-target">
                <Download className="w-4 h-4 mr-2" />
                {getText('exportData')}
              </Button>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1 touch-target">
                {getText('cancel')}
              </Button>
              <Button onClick={handleSave} className="flex-1 touch-target">
                {getText('saveSettings')}
              </Button>
            </div>
          </div>

          {/* Version Info */}
          <div className="pt-4 border-t border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="caption text-muted-foreground">{getText('version')}</span>
              <span className="caption text-muted-foreground">2.1.0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="caption text-muted-foreground">{getText('lastUpdated')}</span>
              <span className="caption text-muted-foreground">
                {language === 'de' ? '03.08.2025' : '08/03/2025'}
              </span>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SettingsPanel;