import React from 'react';
import { TabsContent } from './ui/tabs';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { FileText } from 'lucide-react';
import { UserPlan } from '../types/app';
import { AI_FEATURES_BY_PLAN } from '../constants/mockData';

interface ResultsTabContentProps {
  userPlan: UserPlan;
  onResultsView: () => void;
  onPlanChange: (plan: UserPlan) => void;
}

export function ResultsTabContent({ userPlan, onResultsView, onPlanChange }: ResultsTabContentProps) {
  return (
    <TabsContent value="results" className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">🤖 AI-Powered Results</h2>
        <p className="text-muted-foreground">
          AWS Bedrock + OnPal Intelligence mit Enhanced AI Insights und Plan-basierten Features
        </p>
      </div>
      
      <div className="space-y-6">
        <Card className="p-6 border-success/20 bg-success/5">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-success/10 rounded-lg flex items-center justify-center mx-auto">
              <FileText className="w-8 h-8 text-success" />
            </div>
            <div>
              <h3 className="text-xl font-bold">AI-Results Demo</h3>
              <p className="text-muted-foreground">
                Sehen Sie den vollständigen AI-powered Results Screen mit allen Features
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="p-4 bg-background rounded-lg">
                <h4 className="font-medium mb-2">🧠 Bedrock AI</h4>
                <ul className="space-y-1 text-muted-foreground text-left">
                  <li>• Sentiment-Analyse</li>
                  <li>• Trend-Predictions</li>
                  <li>• Competitive-Gap-Analysis</li>
                  <li>• Language-Processing</li>
                </ul>
              </div>
              
              <div className="p-4 bg-background rounded-lg">
                <h4 className="font-medium mb-2">🎯 OnPal Intelligence</h4>
                <ul className="space-y-1 text-muted-foreground text-left">
                  <li>• Local-Market-Trends</li>
                  <li>• Seasonal-Insights</li>
                  <li>• Price-Optimization</li>
                  <li>• Customer-Journey-Mapping</li>
                </ul>
              </div>
              
              <div className="p-4 bg-background rounded-lg">
                <h4 className="font-medium mb-2">📊 AI-Confidence</h4>
                <ul className="space-y-1 text-muted-foreground text-left">
                  <li>• Data-Quality: 94%</li>
                  <li>• AI-Confidence: 87%</li>
                  <li>• Prediction-Accuracy: 82%</li>
                  <li>• Recommendation-Strength: 91%</li>
                </ul>
              </div>
            </div>
            
            <Button 
              size="lg"
              onClick={onResultsView}
              className="w-full md:w-auto"
            >
              <FileText className="w-5 h-5 mr-2" />
              Results-Screen anzeigen
            </Button>
          </div>
        </Card>

        {/* Plan Features Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(AI_FEATURES_BY_PLAN).map(([plan, config]) => (
            <Card key={plan} className={`p-4 ${plan === 'business' ? 'border-primary/20 bg-primary/5' : plan === 'premium' ? 'border-warning/20 bg-warning/5' : ''}`}>
              <h4 className="font-medium mb-3">{config.title}</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {config.features.map((feature, index) => (
                  <li key={index}>
                    {index < 2 || (plan === 'business' && index < 4) || plan === 'premium' ? '✅' : '❌'} {feature}
                  </li>
                ))}
              </ul>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onPlanChange(plan as UserPlan)}
                className="w-full mt-3"
                disabled={userPlan === plan}
              >
                {userPlan === plan ? 'Aktiv' : `${plan.charAt(0).toUpperCase() + plan.slice(1)} Demo`}
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </TabsContent>
  );
}