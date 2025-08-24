import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Eye, 
  Lock, 
  TrendingUp, 
  BarChart3, 
  Users, 
  Star, 
  Calendar,
  DollarSign,
  Target,
  Clock,
  Crown,
  ArrowRight,
  X,
  Shield
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

interface ReportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: 'orders-revenue' | 'reservations' | 'analytics' | 'competitors' | 'insights' | 'marketing';
  category?: 'inhouse' | 'takeaway' | 'delivery'; // For orders-revenue
  onUpgrade?: () => void;
}

const ReportPreviewModal: React.FC<ReportPreviewModalProps> = ({
  isOpen,
  onClose,
  reportType,
  category,
  onUpgrade
}) => {
  const { language } = useLanguage();
  const [previewData, setPreviewData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Prevent right-click and keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent common copy/save shortcuts
      if (
        (e.ctrlKey || e.metaKey) && 
        ['c', 'v', 's', 'a', 'p', 'x'].includes(e.key.toLowerCase())
      ) {
        e.preventDefault();
      }
      // Prevent F12, Ctrl+Shift+I, Ctrl+U
      if (
        e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.key === 'u')
      ) {
        e.preventDefault();
      }
    };

    const handlePrint = (e: Event) => e.preventDefault();

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('beforeprint', handlePrint);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('beforeprint', handlePrint);
    };
  }, [isOpen]);

  // Translations
  const translations = {
    preview: {
      de: 'Vorschau anzeigen',
      en: 'Show Preview'
    },
    previewTitle: {
      de: 'Premium-Berichte freischalten',
      en: 'Unlock Premium Reports'
    },
    disclaimer: {
      de: 'Dies ist nur eine Vorschau. Vollständige Daten und Funktionen sind in der Premium-Version verfügbar.',
      en: 'This is a preview only. Complete data and features are available in the premium version.'
    },
    limitations: {
      de: 'Eingeschränkte Vorschau - Nicht kopierbar, nicht downloadbar',
      en: 'Limited preview - Not copyable, not downloadable'
    },
    upgradeNow: {
      de: 'Jetzt upgraden',
      en: 'Upgrade Now'
    },
    close: {
      de: 'Schließen',
      en: 'Close'
    },
    reportTypes: {
      'orders-revenue': {
        title: {
          de: 'Bestellungen & Umsatz Analyse',
          en: 'Orders & Revenue Analysis'
        }
      },
      reservations: {
        title: {
          de: 'Reservierungen Management',
          en: 'Reservations Management'
        }
      },
      analytics: {
        title: {
          de: 'Website Analytics',
          en: 'Website Analytics'
        }
      },
      competitors: {
        title: {
          de: 'Wettbewerber-Monitoring',
          en: 'Competitor Monitoring'
        }
      },
      insights: {
        title: {
          de: 'KI-Insights',
          en: 'AI Insights'
        }
      },
      marketing: {
        title: {
          de: 'Marketing Performance',
          en: 'Marketing Performance'
        }
      }
    },
    categories: {
      inhouse: {
        title: {
          de: 'Inhouse Verkäufe',
          en: 'Inhouse Sales'
        },
        requirement: {
          de: 'POS-Integration erforderlich',
          en: 'POS integration required'
        }
      },
      takeaway: {
        title: {
          de: 'Takeaway Bestellungen',
          en: 'Takeaway Orders'
        },
        requirement: {
          de: 'Google My Business & Social Media Integration',
          en: 'Google My Business & Social Media integration'
        }
      },
      delivery: {
        title: {
          de: 'Lieferservice',
          en: 'Delivery Service'
        },
        requirement: {
          de: 'GMB, Social Media & Lieferdienst-Integration',
          en: 'GMB, Social Media & Delivery service integration'
        }
      }
    }
  };

  const getText = (key: string) => {
    const keys = key.split('.');
    let obj = translations;
    for (const k of keys) {
      obj = obj[k];
    }
    return obj?.[language] || key;
  };

  // Generate preview data based on report type
  const generatePreviewData = () => {
    setIsLoading(true);
    
    setTimeout(() => {
      let data = {};
      
      switch (reportType) {
        case 'orders-revenue':
          if (category === 'inhouse') {
            data = {
              metrics: [
                { label: language === 'de' ? 'Tagesumsatz' : 'Daily Revenue', value: '€2,847', trend: '+18%' },
                { label: language === 'de' ? 'Bestellungen' : 'Orders', value: '142', trend: '+12%' },
                { label: language === 'de' ? 'Ø Bestellwert' : 'Avg Order Value', value: '€27.10', trend: '+5%' }
              ],
              requirement: getText('categories.inhouse.requirement')
            };
          } else if (category === 'takeaway') {
            data = {
              metrics: [
                { label: language === 'de' ? 'Takeaway Umsatz' : 'Takeaway Revenue', value: '€1,234', trend: '+22%' },
                { label: language === 'de' ? 'Abholungen' : 'Pickups', value: '87', trend: '+15%' },
                { label: language === 'de' ? 'Wartezeit' : 'Wait Time', value: '12 min', trend: '-8%' }
              ],
              requirement: getText('categories.takeaway.requirement')
            };
          } else if (category === 'delivery') {
            data = {
              metrics: [
                { label: language === 'de' ? 'Lieferumsatz' : 'Delivery Revenue', value: '€1,567', trend: '+28%' },
                { label: language === 'de' ? 'Lieferungen' : 'Deliveries', value: '64', trend: '+33%' },
                { label: language === 'de' ? 'Lieferzeit' : 'Delivery Time', value: '31 min', trend: '-5%' }
              ],
              requirement: getText('categories.delivery.requirement')
            };
          }
          break;
          
        case 'reservations':
          data = {
            metrics: [
              { label: language === 'de' ? 'Reservierungen heute' : 'Reservations Today', value: '42', trend: '+12%' },
              { label: language === 'de' ? 'Auslastung' : 'Occupancy', value: '87%', trend: '+5%' },
              { label: language === 'de' ? 'No-Shows' : 'No-Shows', value: '2', trend: '-15%' }
            ],
            requirement: language === 'de' ? 'Google My Business Profil erforderlich' : 'Google My Business profile required'
          };
          break;
          
        case 'analytics':
          data = {
            metrics: [
              { label: language === 'de' ? 'Website Besucher' : 'Website Visitors', value: '2,341', trend: '+24%' },
              { label: language === 'de' ? 'Conversion Rate' : 'Conversion Rate', value: '3.8%', trend: '+12%' },
              { label: language === 'de' ? 'Absprungrate' : 'Bounce Rate', value: '42%', trend: '-8%' }
            ],
            requirement: language === 'de' ? 'Google Analytics Integration' : 'Google Analytics integration'
          };
          break;
          
        default:
          data = {
            metrics: [
              { label: language === 'de' ? 'Performance Score' : 'Performance Score', value: '85', trend: '+7%' },
              { label: language === 'de' ? 'Wachstum' : 'Growth', value: '+23%', trend: 'positive' }
            ],
            requirement: language === 'de' ? 'Premium Zugang erforderlich' : 'Premium access required'
          };
      }
      
      setPreviewData(data);
      setIsLoading(false);
    }, 800);
  };

  useEffect(() => {
    if (isOpen) {
      generatePreviewData();
    }
  }, [isOpen, reportType, category, language]);

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      window.open('/pricing', '_blank');
    }
    onClose();
  };

  const getReportTitle = () => {
    let title = getText(`reportTypes.${reportType}.title`);
    if (category && reportType === 'orders-revenue') {
      title = getText(`categories.${category}.title`);
    }
    return title;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-auto select-none"
        style={{ 
          userSelect: 'none', 
          WebkitUserSelect: 'none', 
          MozUserSelect: 'none',
          msUserSelect: 'none'
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <DialogHeader className="border-b border-border pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                <DialogTitle className="headline-lg">
                  {getText('preview')}
                </DialogTitle>
                <Badge variant="secondary" className="bg-primary/20 text-primary">
                  {language === 'de' ? 'Vorschau' : 'Preview'}
                </Badge>
              </div>
              <p className="body-md text-muted-foreground">
                {getReportTitle()}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Disclaimer */}
          <Alert className="border-warning/20 bg-warning/5">
            <Shield className="h-4 w-4 text-warning" />
            <AlertDescription className="text-sm">
              <div className="space-y-1">
                <p className="font-medium">{getText('limitations')}</p>
                <p className="text-muted-foreground">{getText('disclaimer')}</p>
              </div>
            </AlertDescription>
          </Alert>

          {/* Loading State */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-20 bg-muted rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Requirements */}
              {previewData?.requirement && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Lock className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="headline-md text-foreground mb-1">
                          {language === 'de' ? 'Anforderungen' : 'Requirements'}
                        </h4>
                        <p className="body-md text-muted-foreground">
                          {previewData.requirement}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Preview Metrics */}
              <div className="grid gap-4">
                <h3 className="headline-md text-foreground">
                  {language === 'de' ? 'Highlight-Metriken' : 'Highlight Metrics'}
                </h3>
                
                <div className="grid md:grid-cols-3 gap-4">
                  {previewData?.metrics?.map((metric, index) => (
                    <Card key={index} className="relative overflow-hidden">
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <p className="caption text-muted-foreground">
                            {metric.label}
                          </p>
                          <div className="flex items-baseline gap-2">
                            <span className="metric-md text-foreground">
                              {metric.value}
                            </span>
                            <span className={`caption ${
                              metric.trend.startsWith('+') 
                                ? 'text-success' 
                                : metric.trend.startsWith('-')
                                ? 'text-error'
                                : 'text-warning'
                            }`}>
                              {metric.trend}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                      
                      {/* Watermark overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/5 pointer-events-none">
                        <div className="absolute bottom-1 right-1 opacity-20">
                          <Eye className="w-4 h-4" />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Blurred Chart Placeholder */}
              <Card className="relative overflow-hidden">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    {language === 'de' ? 'Detaillierte Analysen' : 'Detailed Analytics'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-40 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg flex items-center justify-center relative overflow-hidden filter blur-sm">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-primary/10"></div>
                    <div className="space-y-2 text-center z-10">
                      <TrendingUp className="w-12 h-12 text-primary/50 mx-auto" />
                      <p className="body-md text-muted-foreground">
                        {language === 'de' ? 'Vollständige Diagramme verfügbar' : 'Full charts available'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="border-t border-border pt-4 flex flex-col sm:flex-row gap-3 justify-between">
          <Button variant="outline" onClick={onClose}>
            {getText('close')}
          </Button>
          
          <div className="flex gap-2">
            <Button onClick={handleUpgrade}>
              <Crown className="w-4 h-4 mr-2" />
              {getText('upgradeNow')}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>

        {/* Anti-screenshot overlay */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-0 hover:opacity-5 transition-opacity"
          style={{
            background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(79, 70, 229, 0.1) 10px, rgba(79, 70, 229, 0.1) 20px)'
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ReportPreviewModal;