import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, MousePointer, DollarSign } from 'lucide-react';

interface AdAnalyticsWidgetData {
  ad_spend: number;
  clicks: number;
  ctr: number;
  cpa: number;
  impressions?: number;
  conversions?: number;
  roas?: number;
}

interface AdAnalyticsWidgetProps {
  data?: AdAnalyticsWidgetData;
  isLoading?: boolean;
}

const AdAnalyticsWidget: React.FC<AdAnalyticsWidgetProps> = ({ 
  data = { 
    ad_spend: 500, 
    clicks: 1200, 
    ctr: 0.05, 
    cpa: 0.42,
    impressions: 24000,
    conversions: 15,
    roas: 3.2
  }, 
  isLoading = false 
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('de-DE').format(value);
  };

  const getCTRColor = (ctr: number) => {
    if (ctr >= 0.05) return 'text-green-600';
    if (ctr >= 0.02) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getROASColor = (roas: number) => {
    if (roas >= 3.0) return 'text-green-600';
    if (roas >= 2.0) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Werbeanzeigen Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="h-16 bg-gray-200 rounded"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Werbeanzeigen Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-xl font-bold text-blue-600">{formatCurrency(data.ad_spend)}</div>
            <div className="text-xs text-gray-600">Werbeausgaben</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-xl font-bold text-green-600">{formatNumber(data.clicks)}</div>
            <div className="text-xs text-gray-600">Klicks</div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              <MousePointer className={`w-4 h-4 ${getCTRColor(data.ctr)}`} />
              <span className="text-sm font-medium">Klickrate (CTR)</span>
            </div>
            <span className={`font-bold ${getCTRColor(data.ctr)}`}>
              {formatPercentage(data.ctr)}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium">Kosten pro Akquisition</span>
            </div>
            <span className="font-bold text-orange-600">
              {formatCurrency(data.cpa)}
            </span>
          </div>

          {data.roas && (
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingUp className={`w-4 h-4 ${getROASColor(data.roas)}`} />
                <span className="text-sm font-medium">ROAS</span>
              </div>
              <span className={`font-bold ${getROASColor(data.roas)}`}>
                {data.roas.toFixed(1)}x
              </span>
            </div>
          )}
        </div>

        {/* Additional Stats */}
        {(data.impressions || data.conversions) && (
          <div className="grid grid-cols-2 gap-3 pt-3 border-t">
            {data.impressions && (
              <div className="text-center">
                <div className="text-lg font-bold text-gray-700">{formatNumber(data.impressions)}</div>
                <div className="text-xs text-gray-600">Impressionen</div>
              </div>
            )}
            {data.conversions && (
              <div className="text-center">
                <div className="text-lg font-bold text-primary">{data.conversions}</div>
                <div className="text-xs text-gray-600">Conversions</div>
              </div>
            )}
          </div>
        )}

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Daten der letzten 30 Tage
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdAnalyticsWidget;