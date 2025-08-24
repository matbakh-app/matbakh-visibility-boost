import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  UtensilsCrossed,
  Target,
  Globe
} from 'lucide-react';
import { UserPlan } from '@/types/app';

type ViewType = 'step1' | 'dashboard' | 'results';

interface DashboardQuickActionsProps {
  userPlan: UserPlan;
  onNavigateToView: (view: ViewType) => void;
}

export function DashboardQuickActions({ userPlan, onNavigateToView }: DashboardQuickActionsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="p-6 cursor-pointer hover:shadow-md transition-all card-dark-enhanced btn-hover-enhanced">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <UtensilsCrossed className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-semibold">Restaurant hinzufügen</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Neues Restaurant zur Analyse hinzufügen
        </p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onNavigateToView('step1')} 
          className="btn-hover-enhanced"
        >
          Jetzt starten
        </Button>
      </Card>

      <Card className="p-6 cursor-pointer hover:shadow-md transition-all card-dark-enhanced btn-hover-enhanced">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
            <Target className="w-5 h-5 text-success" />
          </div>
          <h3 className="font-semibold">Competitor Tracking</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Wettbewerber analysieren und vergleichen
        </p>
        <Button 
          variant="outline" 
          size="sm" 
          disabled={userPlan === 'basic'} 
          className="btn-hover-enhanced"
        >
          {userPlan === 'basic' ? 'Premium Feature' : 'Aktivieren'}
        </Button>
      </Card>

      <Card className="p-6 cursor-pointer hover:shadow-md transition-all card-dark-enhanced btn-hover-enhanced">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
            <Globe className="w-5 h-5 text-warning" />
          </div>
          <h3 className="font-semibold">Multi-Location</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Mehrere Standorte gleichzeitig überwachen
        </p>
        <Button 
          variant="outline" 
          size="sm" 
          disabled={userPlan !== 'premium'} 
          className="btn-hover-enhanced"
        >
          {userPlan === 'premium' ? 'Konfigurieren' : 'Premium only'}
        </Button>
      </Card>
    </div>
  );
}