import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingBag, TrendingUp } from 'lucide-react';

interface OrdersWidgetData {
  platform: string;
  total_orders: number;
  revenue: number;
  growth?: number;
  period?: string;
}

interface OrdersWidgetProps {
  data?: OrdersWidgetData[];
  isLoading?: boolean;
}

const OrdersWidget: React.FC<OrdersWidgetProps> = ({ 
  data = [
    { platform: "UberEats", total_orders: 120, revenue: 2400.50, growth: 15 },
    { platform: "Lieferando", total_orders: 89, revenue: 1780.30, growth: 8 },
    { platform: "Delivery Hero", total_orders: 45, revenue: 920.00, growth: -3 }
  ], 
  isLoading = false 
}) => {
  const totalOrders = data.reduce((sum, item) => sum + item.total_orders, 0);
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Lieferservice Bestellungen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-6 bg-gray-200 rounded"></div>
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
          <ShoppingBag className="w-5 h-5" />
          Lieferservice Bestellungen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Stats */}
        <div className="grid grid-cols-2 gap-4 p-3 bg-primary/5 rounded-lg">
          <div className="text-center">
            <div className="text-xl font-bold text-primary">{totalOrders}</div>
            <div className="text-xs text-gray-600">Gesamt Bestellungen</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-primary">{formatCurrency(totalRevenue)}</div>
            <div className="text-xs text-gray-600">Gesamt Umsatz</div>
          </div>
        </div>

        {/* Platform Breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Nach Plattform</h4>
          {data.map((platform, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <div className="font-medium text-sm">{platform.platform}</div>
                <div className="text-xs text-gray-600">
                  {platform.total_orders} Bestellungen • {formatCurrency(platform.revenue)}
                </div>
              </div>
              
              {platform.growth !== undefined && (
                <div className={`flex items-center gap-1 text-xs ${
                  platform.growth > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  <TrendingUp className={`w-3 h-3 ${platform.growth < 0 ? 'rotate-180' : ''}`} />
                  {platform.growth > 0 ? '+' : ''}{platform.growth}%
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Daten der letzten 30 Tage
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrdersWidget;