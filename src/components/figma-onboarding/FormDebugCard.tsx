import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RestaurantFormData, WebsiteAnalysisFormData } from '@/types/app';

type ViewType = 'dashboard' | 'step1' | 'step2' | 'loading' | 'results';

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
  if (!restaurantData && !websiteAnalysisData) {
    return null;
  }

  return (
    <Card className="p-6 bg-muted/50 card-dark-enhanced">
      <h3 className="font-semibold mb-4">📋 Erfasste Daten</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
        {restaurantData && (
          <div>
            <h4 className="font-medium mb-2">Restaurant Info</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>Name: {restaurantData.restaurantName}</li>
              <li>Adresse: {restaurantData.address}</li>
              <li>Kategorie: {restaurantData.mainCategory}</li>
              <li>Preisklasse: {restaurantData.priceRange}</li>
            </ul>
          </div>
        )}
        
        {websiteAnalysisData && (
          <div>
            <h4 className="font-medium mb-2">Website & E-Mail</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>Website: {websiteAnalysisData.website || 'Nicht angegeben'}</li>
              <li>E-Mail: {websiteAnalysisData.email}</li>
              <li>E-Mail bestätigt: {websiteAnalysisData.emailConfirmed ? '✅' : '❌'}</li>
              <li>Benchmarks: {Object.values(websiteAnalysisData.benchmarks).filter(b => b).length}/3</li>
            </ul>
          </div>
        )}
      </div>
      
      <div className="flex gap-2 mt-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onNavigateToView('step1')} 
          className="btn-hover-enhanced"
        >
          Step 1 bearbeiten
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onNavigateToView('step2')} 
          className="btn-hover-enhanced"
        >
          Step 2 bearbeiten
        </Button>
        {websiteAnalysisData?.emailConfirmed && (
          <Button size="sm" onClick={onStartAnalysis} className="btn-hover-enhanced">
            Analyse jetzt starten
          </Button>
        )}
      </div>
    </Card>
  );
}