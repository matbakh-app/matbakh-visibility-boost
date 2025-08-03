import React, { useState, useEffect } from 'react';
import { Settings, Eye, EyeOff, Layout, Palette, Bell, Download, Upload, RotateCw, Save, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Slider } from './ui/slider';
import { toast } from 'sonner@2.0.3';

interface WidgetConfig {
  id: string;
  name: string;
  isVisible: boolean;
  priority: number;
  refreshInterval: number;
  category: 'core' | 'analytics' | 'business-intelligence' | 'secondary';
  isCollapsible: boolean;
  allowExport: boolean;
}

interface DashboardSettings {
  widgets: Record<string, WidgetConfig>;
  layout: 'compact' | 'standard' | 'extended';
  theme: 'light' | 'dark' | 'auto';
  refreshInterval: number;
  notifications: {
    enabled: boolean;
    email: boolean;
    push: boolean;
    sound: boolean;
  };
  exports: {
    defaultFormat: 'pdf' | 'excel' | 'csv';
    includeCharts: boolean;
    autoSchedule: boolean;
  };
  accessibility: {
    reducedMotion: boolean;
    highContrast: boolean;
    largerText: boolean;
  };
  performance: {
    lazyLoading: boolean;
    cacheLevel: 'minimal' | 'standard' | 'aggressive';
    prefetchData: boolean;
  };
}

const defaultSettings: DashboardSettings = {
  widgets: {
    'visibility-score': {
      id: 'visibility-score',
      name: 'Visibility Score',
      isVisible: true,
      priority: 1,
      refreshInterval: 15,
      category: 'core',
      isCollapsible: false,
      allowExport: true
    },
    'reviews': {
      id: 'reviews',
      name: 'Google Reviews',
      isVisible: true,
      priority: 2,
      refreshInterval: 30,
      category: 'core',
      isCollapsible: false,
      allowExport: true
    },
    'analytics': {
      id: 'analytics',
      name: 'Multi-Platform Analytics',
      isVisible: true,
      priority: 3,
      refreshInterval: 10,
      category: 'analytics',
      isCollapsible: true,
      allowExport: true
    },
    'orders-revenue': {
      id: 'orders-revenue',
      name: 'Orders & Revenue',
      isVisible: true,
      priority: 4,
      refreshInterval: 5,
      category: 'core',
      isCollapsible: false,
      allowExport: true
    },
    'reservations': {
      id: 'reservations',
      name: 'Reservations',
      isVisible: true,
      priority: 5,
      refreshInterval: 15,
      category: 'core',
      isCollapsible: false,
      allowExport: true
    },
    'marketing': {
      id: 'marketing',
      name: 'Marketing Performance',
      isVisible: true,
      priority: 6,
      refreshInterval: 30,
      category: 'analytics',
      isCollapsible: true,
      allowExport: true
    },
    'competitor-monitoring': {
      id: 'competitor-monitoring',
      name: 'Wettbewerber-Analyse',
      isVisible: true,
      priority: 7,
      refreshInterval: 240, // 4 hours
      category: 'business-intelligence',
      isCollapsible: true,
      allowExport: true
    },
    'performance-trends': {
      id: 'performance-trends',
      name: 'Performance-Trends',
      isVisible: true,
      priority: 8,
      refreshInterval: 60,
      category: 'business-intelligence',
      isCollapsible: true,
      allowExport: true
    },
    'cultural-insights': {
      id: 'cultural-insights',
      name: 'Kulturdimensionen-Analyse',
      isVisible: true,
      priority: 9,
      refreshInterval: 1440, // 24 hours
      category: 'business-intelligence',
      isCollapsible: true,
      allowExport: true
    },
    'ab-testing': {
      id: 'ab-testing',
      name: 'A/B Test Performance',
      isVisible: true,
      priority: 10,
      refreshInterval: 5,
      category: 'business-intelligence',
      isCollapsible: true,
      allowExport: true
    },
    'location-overview': {
      id: 'location-overview',
      name: 'Location Overview',
      isVisible: true,
      priority: 15,
      refreshInterval: 60,
      category: 'secondary',
      isCollapsible: true,
      allowExport: true
    }
  },
  layout: 'standard',
  theme: 'auto',
  refreshInterval: 300, // 5 minutes
  notifications: {
    enabled: true,
    email: true,
    push: true,
    sound: false
  },
  exports: {
    defaultFormat: 'pdf',
    includeCharts: true,
    autoSchedule: false
  },
  accessibility: {
    reducedMotion: false,
    highContrast: false,
    largerText: false
  },
  performance: {
    lazyLoading: true,
    cacheLevel: 'standard',
    prefetchData: true
  }
};

const SettingsPanel: React.FC = () => {
  const [settings, setSettings] = useState<DashboardSettings>(defaultSettings);
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('widgets');

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('dashboard-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }, []);

  // Save settings
  const saveSettings = () => {
    localStorage.setItem('dashboard-settings', JSON.stringify(settings));
    setHasUnsavedChanges(false);
    toast.success('Einstellungen gespeichert');
    
    // Apply theme changes immediately
    if (settings.theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else if (settings.theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      // Auto theme based on system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }

    // Trigger dashboard refresh with new settings
    window.dispatchEvent(new CustomEvent('dashboard-settings-changed', { 
      detail: settings 
    }));
  };

  // Reset to defaults
  const resetToDefaults = () => {
    setSettings(defaultSettings);
    setHasUnsavedChanges(true);
    toast.info('Auf Standardwerte zurückgesetzt');
  };

  // Export settings
  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'dashboard-settings.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Einstellungen exportiert');
  };

  // Import settings
  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedSettings = JSON.parse(e.target?.result as string);
        setSettings({ ...defaultSettings, ...importedSettings });
        setHasUnsavedChanges(true);
        toast.success('Einstellungen importiert');
      } catch (error) {
        toast.error('Fehler beim Importieren der Einstellungen');
      }
    };
    reader.readAsText(file);
  };

  // Update widget settings
  const updateWidgetSettings = (widgetId: string, updates: Partial<WidgetConfig>) => {
    setSettings(prev => ({
      ...prev,
      widgets: {
        ...prev.widgets,
        [widgetId]: { ...prev.widgets[widgetId], ...updates }
      }
    }));
    setHasUnsavedChanges(true);
  };

  // Update general settings
  const updateGeneralSettings = <K extends keyof DashboardSettings>(
    key: K,
    value: DashboardSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
  };

  const categorizedWidgets = Object.entries(settings.widgets).reduce((acc, [id, widget]) => {
    if (!acc[widget.category]) acc[widget.category] = [];
    acc[widget.category].push({ id, ...widget });
    return acc;
  }, {} as Record<string, Array<WidgetConfig & { id: string }>>);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="touch-target p-2 hover:bg-accent button-hover transition-colors duration-200"
        >
          <Settings className="icon-md text-muted-foreground hover:text-foreground transition-colors duration-150" />
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-full sm:max-w-2xl bg-background border-border">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-foreground">Dashboard-Einstellungen</SheetTitle>
            {hasUnsavedChanges && (
              <Badge variant="secondary" className="text-warning">
                Nicht gespeichert
              </Badge>
            )}
          </div>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="widgets">Widgets</TabsTrigger>
            <TabsTrigger value="appearance">Design</TabsTrigger>
            <TabsTrigger value="notifications">Benachrichtigungen</TabsTrigger>
            <TabsTrigger value="advanced">Erweitert</TabsTrigger>
          </TabsList>

          {/* Widget Configuration */}
          <TabsContent value="widgets" className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
            <div className="space-y-6">
              {Object.entries(categorizedWidgets).map(([category, widgets]) => (
                <div key={category}>
                  <h3 className="font-medium text-foreground mb-3 capitalize">
                    {category === 'core' ? 'Kern-Widgets' :
                     category === 'analytics' ? 'Analytics' :
                     category === 'business-intelligence' ? 'Business Intelligence' :
                     'Sekundäre Widgets'}
                  </h3>
                  
                  <div className="space-y-3">
                    {widgets.map(widget => (
                      <Card key={widget.id} className="bg-card border-border">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Switch
                                checked={widget.isVisible}
                                onCheckedChange={(checked) =>
                                  updateWidgetSettings(widget.id, { isVisible: checked })
                                }
                              />
                              <div>
                                <Label className="font-medium text-foreground">
                                  {widget.name}
                                </Label>
                                <p className="caption text-muted-foreground">
                                  Aktualisierung alle {widget.refreshInterval} Min
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Badge 
                                variant="outline" 
                                className="text-xs"
                              >
                                Priorität {widget.priority}
                              </Badge>
                              
                              {widget.isVisible ? (
                                <Eye className="w-4 h-4 text-success" />
                              ) : (
                                <EyeOff className="w-4 h-4 text-muted-foreground" />
                              )}
                            </div>
                          </div>

                          {widget.isVisible && (
                            <div className="mt-4 grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-xs text-muted-foreground">
                                  Aktualisierungsintervall
                                </Label>
                                <Select
                                  value={widget.refreshInterval.toString()}
                                  onValueChange={(value) =>
                                    updateWidgetSettings(widget.id, { 
                                      refreshInterval: parseInt(value) 
                                    })
                                  }
                                >
                                  <SelectTrigger className="h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="5">5 Minuten</SelectItem>
                                    <SelectItem value="15">15 Minuten</SelectItem>
                                    <SelectItem value="30">30 Minuten</SelectItem>
                                    <SelectItem value="60">1 Stunde</SelectItem>
                                    <SelectItem value="240">4 Stunden</SelectItem>
                                    <SelectItem value="1440">24 Stunden</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={widget.allowExport}
                                  onCheckedChange={(checked) =>
                                    updateWidgetSettings(widget.id, { allowExport: checked })
                                  }
                                />
                                <Label className="text-xs text-muted-foreground">
                                  Export erlauben
                                </Label>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Appearance Settings */}
          <TabsContent value="appearance" className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label className="text-foreground font-medium">Layout-Modus</Label>
                <Select
                  value={settings.layout}
                  onValueChange={(value: 'compact' | 'standard' | 'extended') =>
                    updateGeneralSettings('layout', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compact">Kompakt</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="extended">Erweitert</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-foreground font-medium">Theme</Label>
                <Select
                  value={settings.theme}
                  onValueChange={(value: 'light' | 'dark' | 'auto') =>
                    updateGeneralSettings('theme', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Hell</SelectItem>
                    <SelectItem value="dark">Dunkel</SelectItem>
                    <SelectItem value="auto">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label className="text-foreground font-medium">Barrierefreiheit</Label>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Reduzierte Animationen</Label>
                    <Switch
                      checked={settings.accessibility.reducedMotion}
                      onCheckedChange={(checked) =>
                        updateGeneralSettings('accessibility', {
                          ...settings.accessibility,
                          reducedMotion: checked
                        })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>Hoher Kontrast</Label>
                    <Switch
                      checked={settings.accessibility.highContrast}
                      onCheckedChange={(checked) =>
                        updateGeneralSettings('accessibility', {
                          ...settings.accessibility,
                          highContrast: checked
                        })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>Größere Schrift</Label>
                    <Switch
                      checked={settings.accessibility.largerText}
                      onCheckedChange={(checked) =>
                        updateGeneralSettings('accessibility', {
                          ...settings.accessibility,
                          largerText: checked
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-foreground font-medium">Benachrichtigungen aktivieren</Label>
                <Switch
                  checked={settings.notifications.enabled}
                  onCheckedChange={(checked) =>
                    updateGeneralSettings('notifications', {
                      ...settings.notifications,
                      enabled: checked
                    })
                  }
                />
              </div>

              {settings.notifications.enabled && (
                <div className="space-y-3 ml-6">
                  <div className="flex items-center justify-between">
                    <Label>E-Mail-Benachrichtigungen</Label>
                    <Switch
                      checked={settings.notifications.email}
                      onCheckedChange={(checked) =>
                        updateGeneralSettings('notifications', {
                          ...settings.notifications,
                          email: checked
                        })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>Push-Benachrichtigungen</Label>
                    <Switch
                      checked={settings.notifications.push}
                      onCheckedChange={(checked) =>
                        updateGeneralSettings('notifications', {
                          ...settings.notifications,
                          push: checked
                        })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>Sound</Label>
                    <Switch
                      checked={settings.notifications.sound}
                      onCheckedChange={(checked) =>
                        updateGeneralSettings('notifications', {
                          ...settings.notifications,
                          sound: checked
                        })
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Advanced Settings */}
          <TabsContent value="advanced" className="space-y-6">
            <div className="space-y-6">
              <div className="space-y-4">
                <Label className="text-foreground font-medium">Performance</Label>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Lazy Loading</Label>
                    <Switch
                      checked={settings.performance.lazyLoading}
                      onCheckedChange={(checked) =>
                        updateGeneralSettings('performance', {
                          ...settings.performance,
                          lazyLoading: checked
                        })
                      }
                    />
                  </div>
                  
                  <div>
                    <Label>Cache-Level</Label>
                    <Select
                      value={settings.performance.cacheLevel}
                      onValueChange={(value: 'minimal' | 'standard' | 'aggressive') =>
                        updateGeneralSettings('performance', {
                          ...settings.performance,
                          cacheLevel: value
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minimal">Minimal</SelectItem>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="aggressive">Aggressiv</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label className="text-foreground font-medium">Import/Export</Label>
                
                <div className="flex space-x-2">
                  <Button
                    onClick={exportSettings}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exportieren
                  </Button>
                  
                  <Button
                    onClick={() => document.getElementById('import-settings')?.click()}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Importieren
                  </Button>
                  
                  <input
                    id="import-settings"
                    type="file"
                    accept=".json"
                    onChange={importSettings}
                    className="hidden"
                  />
                </div>
                
                <Button
                  onClick={resetToDefaults}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <RotateCw className="w-4 h-4 mr-2" />
                  Auf Standardwerte zurücksetzen
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-background border-t border-border">
          <div className="flex space-x-3">
            <Button
              onClick={saveSettings}
              className="flex-1"
              disabled={!hasUnsavedChanges}
            >
              <Save className="w-4 h-4 mr-2" />
              Speichern
            </Button>
            
            <Button
              onClick={() => setIsOpen(false)}
              variant="outline"
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Schließen
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SettingsPanel;