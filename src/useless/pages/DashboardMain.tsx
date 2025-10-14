import React from 'react';
import { useTranslation } from 'react-i18next';
import DashboardGrid from '@/components/dashboard/DashboardGrid';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download, Settings } from 'lucide-react';

const DashboardMain: React.FC = () => {
  const { t } = useTranslation('dashboard');

  const handleRefresh = () => {
    // TODO: Implement refresh functionality
    console.log('Refreshing dashboard data...');
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Exporting dashboard data...');
  };

  const handleSettings = () => {
    // TODO: Implement settings functionality
    console.log('Opening dashboard settings...');
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('overview.title', 'Dashboard')}
          </h1>
          <p className="text-gray-600 mt-1">
            {t('overview.subtitle', 'Übersicht über Ihre Restaurant-Performance')}
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Aktualisieren</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleSettings}
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Einstellungen</span>
          </Button>
        </div>
      </div>

      {/* Dashboard Grid */}
      <DashboardGrid 
        userRole="manager" // TODO: Get from auth context
        enabledWidgets={[
          'visibilityWidget',
          'reviewsWidget', 
          'ordersWidget',
          'reservationWidget',
          'adAnalyticsWidget',
          'bookingWidget'
        ]}
      />

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">87</div>
          <div className="text-xs text-gray-600">Sichtbarkeits-Score</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">4.3</div>
          <div className="text-xs text-gray-600">Ø Bewertung</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">254</div>
          <div className="text-xs text-gray-600">Bestellungen</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">47</div>
          <div className="text-xs text-gray-600">Reservierungen</div>
        </div>
      </div>

      {/* Last Updated Info */}
      <div className="text-center text-sm text-gray-500 pt-4 border-t">
        Letzte Aktualisierung: {new Date().toLocaleString('de-DE')}
      </div>
    </div>
  );
};

export default DashboardMain;