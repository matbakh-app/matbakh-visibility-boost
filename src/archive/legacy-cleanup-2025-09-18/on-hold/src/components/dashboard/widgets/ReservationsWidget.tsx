import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, AlertTriangle } from 'lucide-react';

interface ReservationsWidgetData {
  total_reservations: number;
  no_show_rate: number;
  upcoming_reservations?: number;
  capacity_utilization?: number;
  avg_party_size?: number;
}

interface ReservationsWidgetProps {
  data?: ReservationsWidgetData;
  isLoading?: boolean;
}

const ReservationsWidget: React.FC<ReservationsWidgetProps> = ({ 
  data = { 
    total_reservations: 35, 
    no_show_rate: 0.08,
    upcoming_reservations: 12,
    capacity_utilization: 0.75,
    avg_party_size: 3.2
  }, 
  isLoading = false 
}) => {
  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getNoShowColor = (rate: number) => {
    if (rate <= 0.05) return 'text-green-600';
    if (rate <= 0.10) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCapacityColor = (utilization: number) => {
    if (utilization >= 0.8) return 'text-green-600';
    if (utilization >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Reservierungen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-2 gap-2">
              <div className="h-16 bg-gray-200 rounded"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Reservierungen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-primary/5 rounded-lg">
            <div className="text-2xl font-bold text-primary">{data.total_reservations}</div>
            <div className="text-xs text-gray-600">Diesen Monat</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{data.upcoming_reservations || 0}</div>
            <div className="text-xs text-gray-600">Anstehend</div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`w-4 h-4 ${getNoShowColor(data.no_show_rate)}`} />
              <span className="text-sm font-medium">No-Show Rate</span>
            </div>
            <span className={`font-bold ${getNoShowColor(data.no_show_rate)}`}>
              {formatPercentage(data.no_show_rate)}
            </span>
          </div>

          {data.capacity_utilization && (
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Users className={`w-4 h-4 ${getCapacityColor(data.capacity_utilization)}`} />
                <span className="text-sm font-medium">Kapazitätsauslastung</span>
              </div>
              <span className={`font-bold ${getCapacityColor(data.capacity_utilization)}`}>
                {formatPercentage(data.capacity_utilization)}
              </span>
            </div>
          )}

          {data.avg_party_size && (
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm font-medium">Ø Gruppengröße</span>
              <span className="font-bold text-gray-700">
                {data.avg_party_size.toFixed(1)} Personen
              </span>
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div className="space-y-2">
          <div className="text-xs text-gray-600">Kapazitätsverteilung heute</div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(data.capacity_utilization || 0) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Aktuelle Buchungsübersicht
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReservationsWidget;