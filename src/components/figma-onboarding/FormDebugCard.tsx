import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface RestaurantFormData {
  restaurantName: string;
  location: string;
  website: string;
  category: string;
}

interface WebsiteAnalysisFormData {
  url: string;
  competitor1: string;
  competitor2: string;
  targetAudience: string;
}

type ViewType = 'step1' | 'step2' | 'dashboard' | 'results';

interface FormDebugCardProps {
  restaurantData: RestaurantFormData | null;
  websiteAnalysisData: WebsiteAnalysisFormData | null;
  onNavigateToView: (view: ViewType) => void;
  onStartAnalysis: () => void;
}

export function FormDebugCard({ 
  restaurantData, 
  websiteAnalysisData, 
  onNavigateToView,
  onStartAnalysis 
}: FormDebugCardProps) {
  const hasRestaurantData = restaurantData && Object.values(restaurantData).every(val => val?.trim());
  const hasWebsiteData = websiteAnalysisData && Object.values(websiteAnalysisData).every(val => val?.trim());
  const canStartAnalysis = hasRestaurantData && hasWebsiteData;

  return (
    <Card className="border-dashed border-muted">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          🔍 Formular-Status
          {canStartAnalysis ? (
            <Badge variant="default" className="bg-success text-white">
              <CheckCircle className="w-3 h-3 mr-1" />
              Bereit
            </Badge>
          ) : (
            <Badge variant="secondary">
              <AlertCircle className="w-3 h-3 mr-1" />
              Unvollständig
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {hasRestaurantData ? (
                <CheckCircle className="w-4 h-4 text-success" />
              ) : (
                <XCircle className="w-4 h-4 text-error" />
              )}
              <span className="text-sm font-medium">Restaurant-Daten</span>
            </div>
            {restaurantData ? (
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Name: {restaurantData.restaurantName || '❌'}</div>
                <div>Ort: {restaurantData.location || '❌'}</div>
                <div>Website: {restaurantData.website || '❌'}</div>
                <div>Kategorie: {restaurantData.category || '❌'}</div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Keine Daten eingegeben</p>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onNavigateToView('step1')}
              className="w-full mt-2"
            >
              {hasRestaurantData ? 'Bearbeiten' : 'Eingeben'}
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {hasWebsiteData ? (
                <CheckCircle className="w-4 h-4 text-success" />
              ) : (
                <XCircle className="w-4 h-4 text-error" />
              )}
              <span className="text-sm font-medium">Website-Analyse</span>
            </div>
            {websiteAnalysisData ? (
              <div className="text-xs text-muted-foreground space-y-1">
                <div>URL: {websiteAnalysisData.url || '❌'}</div>
                <div>Konkurrent 1: {websiteAnalysisData.competitor1 || '❌'}</div>
                <div>Konkurrent 2: {websiteAnalysisData.competitor2 || '❌'}</div>
                <div>Zielgruppe: {websiteAnalysisData.targetAudience || '❌'}</div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Keine Daten eingegeben</p>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onNavigateToView('step2')}
              className="w-full mt-2"
            >
              {hasWebsiteData ? 'Bearbeiten' : 'Eingeben'}
            </Button>
          </div>
        </div>

        {canStartAnalysis && (
          <div className="border-t pt-4">
            <Button onClick={onStartAnalysis} className="w-full btn-hover-enhanced">
              <CheckCircle className="w-4 h-4 mr-2" />
              Analyse starten
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}