/**
 * Goal-Specific Recommendations Widget
 * Displays AI-generated recommendations based on selected business goals
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Target, 
  TrendingUp, 
  Clock, 
  Users, 
  Star,
  CheckCircle2,
  ArrowRight,
  Filter,
  BarChart3
} from 'lucide-react';

import { 
  GoalId, 
  GoalRecommendation, 
  GOAL_PROFILES,
  PERSONA_DEFINITIONS 
} from '../../types/goal-recommendations';
import { 
  getGoalProfile,
  getRecommendationsSorted,
  getQuickWins,
  getStrategicInitiatives,
  calculateGoalMetrics
} from '../../data/recommendations';

interface GoalRecommendationsWidgetProps {
  selectedGoal?: GoalId;
  onGoalChange?: (goalId: GoalId) => void;
  onRecommendationSelect?: (recommendation: GoalRecommendation) => void;
  className?: string;
}

export function GoalRecommendationsWidget({
  selectedGoal = 'increase_reviews',
  onGoalChange,
  onRecommendationSelect,
  className = ''
}: GoalRecommendationsWidgetProps) {
  const [sortBy, setSortBy] = useState<'impact' | 'effort' | 'combined'>('combined');
  const [filterPersona, setFilterPersona] = useState<'all' | 'Solo-Sarah' | 'Bewahrer-Ben' | 'Wachstums-Walter' | 'Ketten-Katrin'>('all');
  const [activeTab, setActiveTab] = useState<'all' | 'quick_wins' | 'strategic'>('all');

  // Get goal data
  const goalProfile = getGoalProfile(selectedGoal);
  const goalMetrics = calculateGoalMetrics(selectedGoal);
  
  // Filter and sort recommendations
  const filteredRecommendations = useMemo(() => {
    let recommendations = getRecommendationsSorted(selectedGoal, sortBy);
    
    // Filter by persona
    if (filterPersona !== 'all') {
      recommendations = recommendations.filter(rec => 
        rec.personaTargets.includes(filterPersona as PersonaTarget)
      );
    }
    
    // Filter by tab
    switch (activeTab) {
      case 'quick_wins':
        return getQuickWins(selectedGoal);
      case 'strategic':
        return getStrategicInitiatives(selectedGoal);
      default:
        return recommendations;
    }
  }, [selectedGoal, sortBy, filterPersona, activeTab]);

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'Google': return '🔍';
      case 'Instagram': return '📸';
      case 'Facebook': return '👥';
      case 'Website': return '🌐';
      case 'Offline': return '🏪';
      default: return '📱';
    }
  };

  const getImpactColor = (score: number) => {
    if (score >= 8) return 'bg-green-500';
    if (score >= 6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getEffortColor = (score: number) => {
    if (score <= 3) return 'bg-green-500';
    if (score <= 6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Goal Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Geschäftsziel auswählen
          </CardTitle>
          <CardDescription>
            Wähle dein primäres Geschäftsziel für personalisierte Empfehlungen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(GOAL_PROFILES).map(([goalId, profile]) => (
              <Button
                key={goalId}
                variant={selectedGoal === goalId ? 'default' : 'outline'}
                className="h-auto p-4 text-left justify-start"
                onClick={() => onGoalChange?.(goalId as GoalId)}
              >
                <div>
                  <div className="font-medium">{profile.titleDE}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {profile.description}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Goal Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {goalProfile.titleDE} - Übersicht
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {goalMetrics.totalRecommendations}
              </div>
              <div className="text-sm text-muted-foreground">
                Empfehlungen
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {goalMetrics.quickWins}
              </div>
              <div className="text-sm text-muted-foreground">
                Quick Wins
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {goalMetrics.avgImpact}/10
              </div>
              <div className="text-sm text-muted-foreground">
                Ø Impact
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {goalMetrics.avgEffort}/10
              </div>
              <div className="text-sm text-muted-foreground">
                Ø Aufwand
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters and Tabs */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Empfehlungen
            </CardTitle>
            
            <div className="flex flex-wrap gap-2">
              {/* Sort Filter */}
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1 border rounded-md text-sm"
              >
                <option value="combined">Impact/Aufwand</option>
                <option value="impact">Nach Impact</option>
                <option value="effort">Nach Aufwand</option>
              </select>
              
              {/* Persona Filter */}
              <select 
                value={filterPersona} 
                onChange={(e) => setFilterPersona(e.target.value as any)}
                className="px-3 py-1 border rounded-md text-sm"
              >
                <option value="all">Alle Personas</option>
                <option value="Solo-Sarah">Solo-Sarah</option>
                <option value="Bewahrer-Ben">Bewahrer-Ben</option>
                <option value="Wachstums-Walter">Wachstums-Walter</option>
                <option value="Ketten-Katrin">Ketten-Katrin</option>
              </select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">Alle ({goalMetrics.totalRecommendations})</TabsTrigger>
              <TabsTrigger value="quick_wins">Quick Wins ({goalMetrics.quickWins})</TabsTrigger>
              <TabsTrigger value="strategic">Strategisch ({goalMetrics.strategicInitiatives})</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="mt-6">
              <div className="space-y-4">
                {filteredRecommendations.map((recommendation, index) => (
                  <Card key={recommendation.recommendationId} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row gap-4">
                        {/* Main Content */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                                <span className="text-2xl">{getPlatformIcon(recommendation.platform)}</span>
                                {recommendation.title}
                              </h3>
                              <p className="text-muted-foreground text-sm leading-relaxed">
                                {recommendation.description}
                              </p>
                            </div>
                          </div>
                          
                          {/* Personas */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {recommendation.personaTargets.map(persona => (
                              <Badge key={persona} variant="secondary" className="text-xs">
                                <Users className="h-3 w-3 mr-1" />
                                {PERSONA_DEFINITIONS[persona].name}
                              </Badge>
                            ))}
                            <Badge variant="outline" className="text-xs">
                              {recommendation.platform}
                            </Badge>
                          </div>
                        </div>
                        
                        {/* Scores */}
                        <div className="lg:w-48 space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Impact</span>
                              <span className="font-medium">{recommendation.impactScore}/10</span>
                            </div>
                            <Progress 
                              value={recommendation.impactScore * 10} 
                              className="h-2"
                            />
                          </div>
                          
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Aufwand</span>
                              <span className="font-medium">{recommendation.effortScore}/10</span>
                            </div>
                            <Progress 
                              value={recommendation.effortScore * 10} 
                              className="h-2"
                            />
                          </div>
                          
                          <div className="pt-2">
                            <Button 
                              size="sm" 
                              className="w-full"
                              onClick={() => onRecommendationSelect?.(recommendation)}
                            >
                              Umsetzen
                              <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {filteredRecommendations.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Keine Empfehlungen für die gewählten Filter gefunden.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default GoalRecommendationsWidget;