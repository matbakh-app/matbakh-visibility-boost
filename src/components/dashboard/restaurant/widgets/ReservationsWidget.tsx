import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Clock, Users, Phone, CheckCircle, XCircle, AlertCircle, Plus } from 'lucide-react';

const ReservationsWidget: React.FC = () => {
  const { t } = useTranslation(['dashboard', 'common']);

  // Sample reservation data
  const reservations = [
    {
      id: 1,
      guestName: 'Maria Schmidt',
      time: '19:00',
      partySize: 4,
      table: 12,
      status: 'confirmed' as const,
      occasion: 'Geburtstag'
    },
    {
      id: 2,
      guestName: 'John Wilson',
      time: '20:30',
      partySize: 2,
      table: 7,
      status: 'pending' as const,
      occasion: 'Jubiläum'
    },
    {
      id: 3,
      guestName: 'Anna Müller',
      time: '18:15',
      partySize: 6,
      table: 15,
      status: 'confirmed' as const,
      occasion: 'Geschäftsessen'
    }
  ];

  const metrics = [
    {
      icon: Calendar,
      label: t('todayReservations', { ns: 'dashboard' }),
      value: '42',
      change: '+12%',
      positive: true,
      color: 'text-blue-600'
    },
    {
      icon: Users,
      label: t('averagePartySize', { ns: 'dashboard' }),
      value: '3.2',
      change: '+0.3',
      positive: true,
      color: 'text-green-600'
    },
    {
      icon: CheckCircle,
      label: t('occupancyRate', { ns: 'dashboard' }),
      value: '87%',
      change: '+5%',
      positive: true,
      color: 'text-purple-600'
    },
    {
      icon: Clock,
      label: t('peakTime', { ns: 'dashboard' }),
      value: '19:30',
      change: '20:00',
      positive: true,
      color: 'text-orange-600'
    }
  ];

  const statusConfig = {
    confirmed: {
      label: 'Bestätigt',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      icon: CheckCircle
    },
    pending: {
      label: 'Wartend',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      icon: AlertCircle
    },
    cancelled: {
      label: 'Storniert',
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      icon: XCircle
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

  return (
    <Card className="h-full flex flex-col" data-widget="reservations">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              {t('reservations', { ns: 'dashboard' })}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {t('tableReservations', { ns: 'dashboard' })}
            </p>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            {t('excellent', { ns: 'common' })}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-6">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          {metrics.map((metric, index) => (
            <div key={index} className="bg-accent/30 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <metric.icon className={`w-4 h-4 ${metric.color}`} />
                <span className="text-xs text-green-600">
                  {metric.change}
                </span>
              </div>
              <div>
                <div className="text-lg font-semibold text-foreground">{metric.value}</div>
                <div className="text-xs text-muted-foreground line-clamp-1">
                  {metric.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 rounded-lg bg-green-100">
            <div className="text-lg font-semibold text-green-800">28</div>
            <div className="text-xs text-muted-foreground">Bestätigt</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-yellow-100">
            <div className="text-lg font-semibold text-yellow-800">8</div>
            <div className="text-xs text-muted-foreground">Wartend</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-red-100">
            <div className="text-lg font-semibold text-red-800">2</div>
            <div className="text-xs text-muted-foreground">Storniert</div>
          </div>
        </div>

        {/* Upcoming Reservations */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground">
            {t('upcomingReservations', { ns: 'dashboard' })}
          </h4>
          
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
                          {reservation.time}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="w-3 h-3" />
                          {reservation.partySize} Gäste
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Tisch {reservation.table}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Occasion */}
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {reservation.occasion}
                  </Badge>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {reservation.status === 'pending' && (
                    <>
                      <Button variant="outline" size="sm" className="flex-1 text-xs h-7">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Bestätigen
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 text-xs h-7">
                        <XCircle className="w-3 h-3 mr-1" />
                        Stornieren
                      </Button>
                    </>
                  )}
                  <Button variant="ghost" size="sm" className="flex-1 text-xs h-7">
                    <Phone className="w-3 h-3 mr-1" />
                    Kontakt
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1">
            <Calendar className="w-4 h-4 mr-2" />
            {t('viewAll', { ns: 'common' })}
          </Button>
          <Button size="sm" className="flex-1">
            <Plus className="w-4 h-4 mr-2" />
            Neue Reservierung
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReservationsWidget;