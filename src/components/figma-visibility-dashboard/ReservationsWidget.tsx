import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar, 
  Clock, 
  Users, 
  Phone, 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Plus, 
  Filter,
  Lock,
  Crown,
  Eye,
  MapPin
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { formatDate, formatTime, formatNumber } from '@/utils/formatters';
import ReportPreviewModal from './ReportPreviewModal';
import RestrictedWidget from './RestrictedWidget';

interface ReservationsWidgetProps {
  isPublicMode?: boolean;
  onUpgrade?: () => void;
}

const ReservationsWidget: React.FC<ReservationsWidgetProps> = ({ 
  isPublicMode = false,
  onUpgrade 
}) => {
  const { language } = useLanguage();
  const [previewModal, setPreviewModal] = useState({ isOpen: false });

  // Widget translations
  const translations = {
    title: {
      de: 'Reservierungen',
      en: 'Reservations'
    },
    subtitle: {
      de: 'Tischreservierungen & Gästemanagement',
      en: 'Table Reservations & Guest Management'
    },
    businessOrPremiumRequired: {
      de: 'Business oder Premium Abo erforderlich',
      en: 'Business or Premium subscription required'
    },
    gmbProfileRequired: {
      de: 'Google My Business Profil erforderlich',
      en: 'Google My Business profile required'
    },
    requirements: {
      de: 'Anforderungen',
      en: 'Requirements'
    },
    requirementsList: {
      de: 'Business/Premium Abo + Google My Business Profil',
      en: 'Business/Premium subscription + Google My Business profile'
    },
    showPreview: {
      de: 'Vorschau anzeigen',
      en: 'Show Preview'
    },
    upgradeNow: {
      de: 'Jetzt upgraden',
      en: 'Upgrade Now'
    },
    paywalledFeature: {
      de: 'Premium Feature',
      en: 'Premium Feature'
    },
    todayReservations: {
      de: 'Reservierungen heute',
      en: 'Today\'s Reservations'
    },
    averagePartySize: {
      de: 'Ø Gruppengröße',
      en: 'Avg Party Size'
    },
    occupancyRate: {
      de: 'Auslastung',
      en: 'Occupancy Rate'
    },
    peakTime: {
      de: 'Stoßzeit',
      en: 'Peak Time'
    },
    confirmedReservations: {
      de: 'Bestätigte Reservierungen',
      en: 'Confirmed Reservations'
    },
    pendingReservations: {
      de: 'Wartende Reservierungen',
      en: 'Pending Reservations'
    },
    cancelledReservations: {
      de: 'Stornierte Reservierungen',
      en: 'Cancelled Reservations'
    },
    upcomingReservations: {
      de: 'Anstehende Reservierungen',
      en: 'Upcoming Reservations'
    },
    viewAll: {
      de: 'Alle anzeigen',
      en: 'View All'
    },
    addReservation: {
      de: 'Neue Reservierung',
      en: 'Add Reservation'
    },
    filterReservations: {
      de: 'Reservierungen filtern',
      en: 'Filter Reservations'
    },
    guests: {
      de: 'Gäste',
      en: 'Guests'
    },
    guest: {
      de: 'Gast',
      en: 'Guest'
    },
    table: {
      de: 'Tisch',
      en: 'Table'
    },
    confirmed: {
      de: 'Bestätigt',
      en: 'Confirmed'
    },
    pending: {
      de: 'Wartend',
      en: 'Pending'
    },
    excellent: {
      de: 'Ausgezeichnet',
      en: 'Excellent'
    },
    birthday: {
      de: 'Geburtstag',
      en: 'Birthday'
    },
    specialRequests: {
      de: 'Sonderwünsche',
      en: 'Special Requests'
    },
    contact: {
      de: 'Kontakt',
      en: 'Contact'
    },
    notes: {
      de: 'Notizen',
      en: 'Notes'
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

  // Sample reservation data (demo only)
  const today = new Date();
  const reservations = [
    {
      id: 1,
      guestName: 'Maria Schmidt',
      email: 'maria.schmidt@email.com',
      phone: '+49 30 12345678',
      date: today,
      time: '19:00',
      partySize: 4,
      table: 12,
      status: 'confirmed' as const,
      occasion: 'birthday',
      specialRequests: language === 'de' 
        ? 'Glutenfrei, Tisch am Fenster bevorzugt'
        : 'Gluten-free, window table preferred',
      avatar: '/avatars/maria.jpg'
    },
    {
      id: 2,
      guestName: 'John Wilson',
      email: 'john.wilson@email.com',
      phone: '+49 30 87654321',
      date: today,
      time: '20:30',
      partySize: 2,
      table: 7,
      status: 'pending' as const,
      occasion: 'anniversary',
      specialRequests: language === 'de'
        ? 'Vegetarisch, ruhiger Bereich'
        : 'Vegetarian, quiet area',
      avatar: '/avatars/john.jpg'
    }
  ];

  const metrics = [
    {
      icon: Calendar,
      label: getText('todayReservations'),
      value: formatNumber(42, language),
      change: '+12%',
      positive: true,
      color: 'text-blue-600'
    },
    {
      icon: Users,
      label: getText('averagePartySize'),
      value: '3.2',
      change: '+0.3',
      positive: true,
      color: 'text-green-600'
    },
    {
      icon: CheckCircle,
      label: getText('occupancyRate'),
      value: '87%',
      change: '+5%',
      positive: true,
      color: 'text-purple-600'
    },
    {
      icon: Clock,
      label: getText('peakTime'),
      value: '19:30',
      change: '20:00',
      positive: true,
      color: 'text-orange-600'
    }
  ];

  const statusConfig = {
    confirmed: {
      label: getText('confirmed'),
      color: 'text-success',
      bgColor: 'bg-success-light',
      icon: CheckCircle
    },
    pending: {
      label: getText('pending'),
      color: 'text-warning',
      bgColor: 'bg-warning-light',
      icon: AlertCircle
    }
  };

  const getStatusBadge = (status: keyof typeof statusConfig) => {
    const config = statusConfig[status];
    const Icon = config.icon;
    
    return (
      <Badge variant="secondary" className={`${config.bgColor} ${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getPartyLabel = (size: number) => {
    return size === 1 ? getText('guest') : getText('guests');
  };

  const handlePreview = () => {
    setPreviewModal({ isOpen: true });
  };

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      window.open('/pricing', '_blank');
    }
  };

  // Reservations widget is ALWAYS restricted in public mode - complete paywall
  const isRestricted = isPublicMode;

  if (isRestricted) {
    return (
      <>
        <RestrictedWidget
          isRestricted={true}
          restrictionType="premium"
          context="reports"
          title={getText('title')}
          description={getText('businessOrPremiumRequired')}
          showPreview={true}
          blurLevel="medium"
          onUpgrade={handleUpgrade}
        >
          <Card className="widget-card h-full flex flex-col" data-widget="reservations">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="headline-md text-foreground flex items-center gap-2">
                    <Calendar className="icon-md text-primary" />
                    {getText('title')}
                  </CardTitle>
                  <p className="caption text-muted-foreground">
                    {getText('subtitle')}
                  </p>
                </div>
                <Badge variant="secondary" className="bg-success-light text-success">
                  {getText('excellent')}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="flex-1 space-y-6">
              {/* Key Metrics Grid - blurred in demo */}
              <div className="grid grid-cols-2 gap-3">
                {metrics.map((metric, index) => (
                  <div key={index} className="bg-accent/30 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <metric.icon className={`w-4 h-4 ${metric.color}`} />
                      <span className="text-xs text-success">
                        {metric.change}
                      </span>
                    </div>
                    <div>
                      <div className="metric-md text-foreground">{metric.value}</div>
                      <div className="caption text-muted-foreground line-clamp-1">
                        {metric.label}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Status Overview */}
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 rounded-lg bg-success-light">
                  <div className="metric-md text-success">{formatNumber(28, language)}</div>
                  <div className="caption text-muted-foreground">{getText('confirmedReservations')}</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-warning-light">
                  <div className="metric-md text-warning">{formatNumber(8, language)}</div>
                  <div className="caption text-muted-foreground">{getText('pendingReservations')}</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-error-light">
                  <div className="metric-md text-error">{formatNumber(2, language)}</div>
                  <div className="caption text-muted-foreground">{getText('cancelledReservations')}</div>
                </div>
              </div>

              {/* Sample reservations - heavily blurred */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="body-md font-medium text-foreground">
                    {getText('upcomingReservations')}
                  </h4>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="text-xs">
                      <Filter className="w-3 h-3 mr-1" />
                      {getText('filterReservations')}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-xs">
                      {getText('viewAll')}
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {reservations.slice(0, 2).map((reservation) => (
                    <div key={reservation.id} className="border rounded-lg p-3 space-y-3 hover:bg-accent/10 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-xs">
                              {reservation.guestName.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-foreground">
                                {reservation.guestName}
                              </p>
                              {getStatusBadge(reservation.status)}
                            </div>
                            <div className="flex items-center gap-4 mt-1">
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {formatTime(new Date(`2024-01-01 ${reservation.time}`), language)}
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Users className="w-3 h-3" />
                                {reservation.partySize} {getPartyLabel(reservation.partySize)}
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                {getText('table')} {reservation.table}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Special requests */}
                      {reservation.specialRequests && (
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            <span className="font-medium">{getText('specialRequests')}:</span> {reservation.specialRequests}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </RestrictedWidget>

        <ReportPreviewModal
          isOpen={previewModal.isOpen}
          onClose={() => setPreviewModal({ isOpen: false })}
          reportType="reservations"
          onUpgrade={handleUpgrade}
        />
      </>
    );
  }

  // For authenticated users - show requirements alert but allow access
  return (
    <>
      <Card className="widget-card h-full flex flex-col" data-widget="reservations">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="headline-md text-foreground flex items-center gap-2">
                <Calendar className="icon-md text-primary" />
                {getText('title')}
              </CardTitle>
              <p className="caption text-muted-foreground">
                {getText('subtitle')}
              </p>
            </div>
            <Badge variant="secondary" className="bg-success-light text-success">
              {getText('excellent')}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="flex-1 space-y-6">
          {/* Requirements Notice */}
          <Alert className="border-primary/20 bg-primary/5">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-primary mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  {getText('requirements')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {getText('requirementsList')}
                </p>
              </div>
            </div>
          </Alert>

          {/* Full widget content for authenticated users */}
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            {metrics.map((metric, index) => (
              <div key={index} className="bg-accent/30 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <metric.icon className={`w-4 h-4 ${metric.color}`} />
                  <span className="text-xs text-success">
                    {metric.change}
                  </span>
                </div>
                <div>
                  <div className="metric-md text-foreground">{metric.value}</div>
                  <div className="caption text-muted-foreground line-clamp-1">
                    {metric.label}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Status Overview */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 rounded-lg bg-success-light">
              <div className="metric-md text-success">{formatNumber(28, language)}</div>
              <div className="caption text-muted-foreground">{getText('confirmedReservations')}</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-warning-light">
              <div className="metric-md text-warning">{formatNumber(8, language)}</div>
              <div className="caption text-muted-foreground">{getText('pendingReservations')}</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-error-light">
              <div className="metric-md text-error">{formatNumber(2, language)}</div>
              <div className="caption text-muted-foreground">{getText('cancelledReservations')}</div>
            </div>
          </div>

          {/* Upcoming Reservations */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="body-md font-medium text-foreground">
                {getText('upcomingReservations')}
              </h4>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="text-xs">
                  <Filter className="w-3 h-3 mr-1" />
                  {getText('filterReservations')}
                </Button>
                <Button variant="ghost" size="sm" className="text-xs">
                  {getText('viewAll')}
                </Button>
              </div>
            </div>
            
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {reservations.map((reservation) => (
                <div key={reservation.id} className="border rounded-lg p-3 space-y-3 hover:bg-accent/10 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs">
                          {reservation.guestName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground">
                            {reservation.guestName}
                          </p>
                          {getStatusBadge(reservation.status)}
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {formatTime(new Date(`2024-01-01 ${reservation.time}`), language)}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="w-3 h-3" />
                            {reservation.partySize} {getPartyLabel(reservation.partySize)}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            {getText('table')} {reservation.table}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Special requests and actions */}
                  {reservation.specialRequests && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        <span className="font-medium">{getText('specialRequests')}:</span> {reservation.specialRequests}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {reservation.status === 'pending' && (
                      <>
                        <Button variant="outline" size="sm" className="flex-1 text-xs h-7">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {getText('confirmed')}
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 text-xs h-7">
                          <XCircle className="w-3 h-3 mr-1" />
                          Cancel
                        </Button>
                      </>
                    )}
                    <Button variant="ghost" size="sm" className="flex-1 text-xs h-7">
                      <Phone className="w-3 h-3 mr-1" />
                      {getText('contact')}
                    </Button>
                    <Button variant="ghost" size="sm" className="flex-1 text-xs h-7">
                      <MessageSquare className="w-3 h-3 mr-1" />
                      {getText('notes')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 touch-target"
              onClick={handlePreview}
            >
              <Eye className="w-4 h-4 mr-2" />
              {getText('showPreview')}
            </Button>
            <Button size="sm" className="flex-1 touch-target">
              <Plus className="w-4 h-4 mr-2" />
              {getText('addReservation')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <ReportPreviewModal
        isOpen={previewModal.isOpen}
        onClose={() => setPreviewModal({ isOpen: false })}
        reportType="reservations"
        onUpgrade={handleUpgrade}
      />
    </>
  );
};

export default ReservationsWidget;