import React from 'react';
import { Lock, Crown, Zap, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface PaywallOverlayProps {
  isVisible: boolean;
  onUpgrade?: () => void;
  onClose?: () => void;
  title?: string;
  features?: string[];
}

export function PaywallOverlay({ 
  isVisible, 
  onUpgrade, 
  onClose, 
  title = "Premium Feature freischalten",
  features = [
    "Detaillierte Visibility-Analyse",
    "Competitive Benchmarking",
    "Wöchentliche Reports",
    "API-Zugang"
  ]
}: PaywallOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="p-6 text-center">
          {/* Icon */}
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8 text-white" />
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>
          <p className="text-gray-600 mb-6">
            Erhalte Zugang zu erweiterten Funktionen und detaillierten Insights
          </p>

          {/* Features */}
          <div className="text-left mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Inklusive:</h3>
            <ul className="space-y-2">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-success flex-shrink-0" />
                  <span className="text-sm text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pricing */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-4 mb-6">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-3xl font-bold text-gray-900">€29</span>
              <span className="text-gray-600">/Monat</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">Jederzeit kündbar</p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button 
              onClick={onUpgrade} 
              className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
              size="lg"
            >
              <Zap className="w-4 h-4 mr-2" />
              Jetzt upgraden
            </Button>
            <Button 
              variant="ghost" 
              onClick={onClose}
              className="w-full"
            >
              Später
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              ✓ 14 Tage Geld-zurück-Garantie • ✓ SSL-verschlüsselt
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

interface FeatureLockedCardProps {
  title: string;
  description: string;
  onUpgrade?: () => void;
}

export function FeatureLockedCard({ title, description, onUpgrade }: FeatureLockedCardProps) {
  return (
    <div className="relative rounded-lg border-2 border-dashed border-gray-300 bg-gray-50/50 p-8">
      <div className="text-center">
        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="w-6 h-6 text-gray-500" />
        </div>
        <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-4">{description}</p>
        <Button 
          variant="outline" 
          onClick={onUpgrade}
          className="border-primary text-primary hover:bg-primary hover:text-white"
        >
          <Crown className="w-4 h-4 mr-2" />
          Freischalten
        </Button>
      </div>
    </div>
  );
}

interface BlurredContentProps {
  children: React.ReactNode;
  isBlurred: boolean;
  onUpgrade?: () => void;
}

export function BlurredContent({ children, isBlurred, onUpgrade }: BlurredContentProps) {
  return (
    <div className="relative">
      <div className={`transition-all duration-300 ${isBlurred ? 'filter blur-sm select-none' : ''}`}>
        {children}
      </div>
      
      {isBlurred && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center p-6 max-w-sm">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Premium Inhalt</h3>
            <p className="text-sm text-gray-600 mb-4">
              Upgrade für vollständigen Zugang zu allen Analysedaten
            </p>
            <Button onClick={onUpgrade} size="sm">
              <Crown className="w-4 h-4 mr-2" />
              Jetzt upgraden
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}