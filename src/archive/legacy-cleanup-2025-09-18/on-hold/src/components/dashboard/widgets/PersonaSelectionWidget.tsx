/**
 * Persona Selection Widget - Allows users to select their business persona
 * Adapts AI responses and dashboard layout based on selected persona
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Users, 
  TrendingUp, 
  Building, 
  CheckCircle,
  Info,
  Sparkles
} from 'lucide-react';
import { useAIServices } from '@/hooks/useAIServices';

interface PersonaOption {
  id: 'Solo-Sarah' | 'Bewahrer-Ben' | 'Wachstums-Walter' | 'Ketten-Katrin';
  name: string;
  description: string;
  icon: React.ReactNode;
  characteristics: string[];
  aiFeatures: string[];
  complexity: 'simple' | 'moderate' | 'advanced';
  color: string;
}

interface PersonaSelectionWidgetProps {
  compactMode?: boolean;
  persona?: string | null;
  beta?: boolean;
}

const PersonaSelectionWidget: React.FC<PersonaSelectionWidgetProps> = ({
  compactMode = false,
  persona = null,
  beta = false
}) => {
  const { t } = useTranslation('dashboard');
  const { currentPersona, setPersona, getPersonaCapabilities } = useAIServices();
  const [showDetails, setShowDetails] = useState(false);

  const personaOptions: PersonaOption[] = [
    {
      id: 'Solo-Sarah',
      name: 'Solo-Sarah',
      description: 'Einzelunternehmerin, die einfache und schnelle Lösungen braucht',
      icon: <User className="w-5 h-5" />,
      characteristics: [
        'Zeitknappheit',
        'Einfache Bedienung bevorzugt',
        'Fokus auf Quick Wins',
        'Begrenzte Ressourcen'
      ],
      aiFeatures: [
        'Vereinfachte Empfehlungen',
        'Schritt-für-Schritt Anleitungen',
        'Prioritäts-basierte Aktionen',
        'Keine Beta-Features'
      ],
      complexity: 'simple',
      color: 'bg-pink-100 text-pink-800 border-pink-200'
    },
    {
      id: 'Bewahrer-Ben',
      name: 'Bewahrer-Ben',
      description: 'Traditioneller Gastronom, der bewährte Methoden schätzt',
      icon: <Building className="w-5 h-5" />,
      characteristics: [
        'Vorsichtig bei Neuerungen',
        'Wert auf Bewährtes',
        'Qualität vor Quantität',
        'Lokale Verwurzelung'
      ],
      aiFeatures: [
        'Konservative Empfehlungen',
        'Bewährte Strategien',
        'Risiko-bewusste Analysen',
        'Lokaler Fokus'
      ],
      complexity: 'moderate',
      color: 'bg-green-100 text-green-800 border-green-200'
    },
    {
      id: 'Wachstums-Walter',
      name: 'Wachstums-Walter',
      description: 'Ambitionierter Unternehmer mit Expansionsplänen',
      icon: <TrendingUp className="w-5 h-5" />,
      characteristics: [
        'Wachstumsorientiert',
        'Technologie-affin',
        'Risikobereit',
        'Skalierung im Fokus'
      ],
      aiFeatures: [
        'Erweiterte Analysen',
        'Wachstumsstrategien',
        'ROI-Optimierung',
        'Alle Beta-Features'
      ],
      complexity: 'advanced',
      color: 'bg-blue-100 text-blue-800 border-blue-200'
    },
    {
      id: 'Ketten-Katrin',
      name: 'Ketten-Katrin',
      description: 'Managerin einer Restaurantkette oder Franchise',
      icon: <Users className="w-5 h-5" />,
      characteristics: [
        'Multi-Location Management',
        'Standardisierung wichtig',
        'Datengetriebene Entscheidungen',
        'Effizienz-fokussiert'
      ],
      aiFeatures: [
        'Multi-Location Analysen',
        'Benchmark-Vergleiche',
        'Standardisierte Prozesse',
        'Enterprise Features'
      ],
      complexity: 'advanced',
      color: 'bg-purple-100 text-purple-800 border-purple-200'
    }
  ];

  const handlePersonaSelect = (personaId: PersonaOption['id']) => {
    setPersona(personaId);
    
    // Show brief confirmation
    const selectedPersona = personaOptions.find(p => p.id === personaId);
    if (selectedPersona) {
      // Could trigger a toast notification here
      console.log(`Persona gewechselt zu: ${selectedPersona.name}`);
    }
  };

  const currentPersonaData = personaOptions.find(p => p.id === currentPersona);
  const availableCapabilities = getPersonaCapabilities();

  if (compactMode && currentPersona) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-sm">
            <Sparkles className="w-4 h-4" />
            <span>Aktive Persona</span>
            {beta && <Badge variant="secondary" className="text-xs">Beta</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentPersonaData && (
            <div className={`p-3 rounded-lg border ${currentPersonaData.color}`}>
              <div className="flex items-center space-x-2 mb-2">
                {currentPersonaData.icon}
                <span className="font-medium">{currentPersonaData.name}</span>
              </div>
              <p className="text-xs mb-2">{currentPersonaData.description}</p>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">
                  {availableCapabilities.length} Features
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-xs h-6"
                >
                  Ändern
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5" />
          <span>Persona-Auswahl</span>
          {beta && <Badge variant="secondary">Beta</Badge>}
        </CardTitle>
        <p className="text-sm text-gray-600">
          Wählen Sie Ihren Geschäftstyp für personalisierte KI-Empfehlungen
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Selection */}
        {currentPersonaData && (
          <div className={`p-4 rounded-lg border-2 ${currentPersonaData.color}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                {currentPersonaData.icon}
                <span className="font-medium">{currentPersonaData.name}</span>
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <Badge variant="outline">Aktiv</Badge>
            </div>
            <p className="text-sm mb-3">{currentPersonaData.description}</p>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="font-medium mb-1">Eigenschaften:</p>
                <ul className="space-y-1">
                  {currentPersonaData.characteristics.slice(0, 2).map((char, index) => (
                    <li key={index} className="flex items-center space-x-1">
                      <span className="w-1 h-1 bg-current rounded-full"></span>
                      <span>{char}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-medium mb-1">KI-Features:</p>
                <ul className="space-y-1">
                  {currentPersonaData.aiFeatures.slice(0, 2).map((feature, index) => (
                    <li key={index} className="flex items-center space-x-1">
                      <span className="w-1 h-1 bg-current rounded-full"></span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t">
              <div className="flex items-center space-x-2 text-xs">
                <Info className="w-3 h-3" />
                <span>{availableCapabilities.length} verfügbare Features</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? 'Weniger' : 'Ändern'}
              </Button>
            </div>
          </div>
        )}

        {/* Persona Options */}
        {(!currentPersona || showDetails) && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Verfügbare Personas:</h4>
            <div className="grid grid-cols-1 gap-3">
              {personaOptions.map((option) => (
                <div
                  key={option.id}
                  className={`
                    p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md
                    ${currentPersona === option.id 
                      ? `${option.color} border-2` 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                  onClick={() => handlePersonaSelect(option.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {option.icon}
                      <span className="font-medium text-sm">{option.name}</span>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        option.complexity === 'simple' ? 'border-green-300' :
                        option.complexity === 'moderate' ? 'border-yellow-300' :
                        'border-red-300'
                      }`}
                    >
                      {option.complexity}
                    </Badge>
                  </div>
                  
                  <p className="text-xs text-gray-600 mb-2">{option.description}</p>
                  
                  <div className="flex flex-wrap gap-1">
                    {option.characteristics.slice(0, 3).map((char, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {char}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-start space-x-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="text-xs text-blue-800">
              <p className="font-medium mb-1">Warum Persona wählen?</p>
              <p>
                Die KI passt Empfehlungen, Analysen und Interface-Komplexität 
                an Ihren Geschäftstyp an. Sie können jederzeit wechseln.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonaSelectionWidget;