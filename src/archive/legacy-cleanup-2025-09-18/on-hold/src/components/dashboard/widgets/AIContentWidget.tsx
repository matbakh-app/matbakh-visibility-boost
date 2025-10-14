/**
 * AI Content Widget - AI-powered content generation for social media and marketing
 * Generates persona-specific content suggestions and templates
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  PenTool, 
  Copy, 
  RefreshCw, 
  Send, 
  Image, 
  Hash,
  Calendar,
  Sparkles,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useAIServices } from '@/hooks/useAIServices';

interface ContentSuggestion {
  id: string;
  type: 'instagram' | 'facebook' | 'google_posts' | 'website';
  title: string;
  content: string;
  hashtags: string[];
  imagePrompt?: string;
  tone: 'professional' | 'casual' | 'friendly' | 'promotional';
  length: 'short' | 'medium' | 'long';
  engagement_score: number; // 0-100
  persona_fit: number; // 0-100
}

interface AIContentWidgetProps {
  compactMode?: boolean;
  persona?: string | null;
  beta?: boolean;
}

const AIContentWidget: React.FC<AIContentWidgetProps> = ({
  compactMode = false,
  persona = null,
  beta = false
}) => {
  const { t } = useTranslation('dashboard');
  const { 
    hasCapability, 
    startOperation, 
    updateOperation, 
    completeOperation,
    activeOperations 
  } = useAIServices();

  const [suggestions, setSuggestions] = useState<ContentSuggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedType, setSelectedType] = useState<ContentSuggestion['type']>('instagram');
  const [customPrompt, setCustomPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);

  const hasContentCapability = hasCapability('content_generation');
  const isOperationRunning = activeOperations.some(op => op.type === 'content');

  useEffect(() => {
    if (hasContentCapability) {
      generateInitialContent();
    }
  }, [hasContentCapability, persona, selectedType]);

  const generateInitialContent = async () => {
    if (!hasContentCapability) return;

    try {
      setIsGenerating(true);
      setError(null);

      const operationId = startOperation('content', 'Generiere Content-Vorschläge...');
      
      updateOperation(operationId, { 
        status: 'running', 
        progress: 30,
        message: 'Analysiere Persona und Zielgruppe...'
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      updateOperation(operationId, { 
        progress: 60,
        message: 'Erstelle personalisierte Inhalte...'
      });

      const generatedContent = await generatePersonaContent(persona, selectedType);
      
      updateOperation(operationId, { 
        progress: 100,
        message: 'Content erfolgreich generiert'
      });

      setSuggestions(generatedContent);
      completeOperation(operationId, `${generatedContent.length} Content-Vorschläge erstellt`);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler bei Content-Generierung');
    } finally {
      setIsGenerating(false);
    }
  };

  const generatePersonaContent = async (
    currentPersona: string | null, 
    contentType: ContentSuggestion['type']
  ): Promise<ContentSuggestion[]> => {
    
    const baseContent: Omit<ContentSuggestion, 'persona_fit'>[] = [
      {
        id: 'daily_special',
        type: contentType,
        title: 'Tagesgericht Highlight',
        content: '🍝 Heute verwöhnen wir Sie mit unserem hausgemachten Risotto ai Porcini - cremig, aromatisch und mit frischen Steinpilzen aus der Region. Perfekt für einen gemütlichen Abend bei uns! #RisottoLiebe #FrischAusderKüche',
        hashtags: ['#RisottoLiebe', '#FrischAusderKüche', '#ItalienischGenießen', '#Steinpilze'],
        imagePrompt: 'Cremiges Risotto mit Steinpilzen, elegant angerichtet auf weißem Teller',
        tone: 'friendly',
        length: 'medium',
        engagement_score: 85
      },
      {
        id: 'behind_scenes',
        type: contentType,
        title: 'Behind the Scenes',
        content: '👨‍🍳 Ein Blick in unsere Küche: Unser Küchenchef Marco bereitet gerade die frische Pasta für heute Abend vor. Jede Nudel wird mit Liebe und jahrelanger Erfahrung geformt. Das schmeckt man! #HandmadePasta #KüchenTeam',
        hashtags: ['#HandmadePasta', '#KüchenTeam', '#Handwerk', '#Authentisch'],
        imagePrompt: 'Koch beim Pasta machen, Mehl auf den Händen, konzentrierter Blick',
        tone: 'professional',
        length: 'short',
        engagement_score: 78
      },
      {
        id: 'customer_story',
        type: contentType,
        title: 'Kundenerlebnis',
        content: '❤️ "Das war der beste Abend seit langem! Das Essen war fantastisch und der Service einfach herzlich." - So schön, wenn unsere Gäste glücklich nach Hause gehen. Grazie mille für das tolle Feedback! #HappyGuests #Testimonial',
        hashtags: ['#HappyGuests', '#Testimonial', '#Kundenzufriedenheit', '#GrazieMille'],
        imagePrompt: 'Glückliches Paar beim Essen im Restaurant, warme Atmosphäre',
        tone: 'friendly',
        length: 'medium',
        engagement_score: 92
      },
      {
        id: 'seasonal_promo',
        type: contentType,
        title: 'Saisonales Angebot',
        content: '🍂 Herbstzeit ist Trüffelzeit! Entdecken Sie unsere exklusiven Trüffel-Spezialitäten: Tagliatelle al Tartufo, Risotto ai Tartufi und unser berühmtes Trüffel-Carpaccio. Nur für kurze Zeit verfügbar! Reservierung empfohlen. #TrüffelSaison #Exklusiv',
        hashtags: ['#TrüffelSaison', '#Exklusiv', '#HerbstSpezialitäten', '#Reservierung'],
        imagePrompt: 'Elegante Trüffel-Pasta, schwarze Trüffel werden darüber gehobelt',
        tone: 'promotional',
        length: 'long',
        engagement_score: 88
      }
    ];

    // Adjust persona fit based on current persona
    return baseContent.map(content => {
      let personaFit = 70; // Base fit

      switch (currentPersona) {
        case 'Solo-Sarah':
          if (content.tone === 'friendly' && content.length === 'short') personaFit = 95;
          else if (content.tone === 'promotional') personaFit = 60;
          break;

        case 'Bewahrer-Ben':
          if (content.id === 'behind_scenes' || content.id === 'customer_story') personaFit = 90;
          if (content.tone === 'professional') personaFit += 10;
          break;

        case 'Wachstums-Walter':
          if (content.engagement_score > 85) personaFit = 95;
          if (content.tone === 'promotional') personaFit += 15;
          break;

        case 'Ketten-Katrin':
          if (content.type === 'facebook' || content.type === 'google_posts') personaFit = 90;
          if (content.length === 'medium') personaFit += 10;
          break;
      }

      return { ...content, persona_fit: personaFit };
    }).sort((a, b) => b.persona_fit - a.persona_fit);
  };

  const generateCustomContent = async () => {
    if (!customPrompt.trim()) return;

    try {
      setIsGenerating(true);
      const operationId = startOperation('content', 'Generiere benutzerdefinierten Content...');
      
      // Simulate custom content generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const customSuggestion: ContentSuggestion = {
        id: `custom_${Date.now()}`,
        type: selectedType,
        title: 'Benutzerdefinierter Content',
        content: `Basierend auf Ihrer Anfrage "${customPrompt}" haben wir diesen personalisierten Content erstellt. Dieser Text würde normalerweise von der KI basierend auf Ihrem Input generiert werden.`,
        hashtags: ['#Custom', '#Personalisiert', '#KIGeneriert'],
        tone: 'friendly',
        length: 'medium',
        engagement_score: 75,
        persona_fit: 85
      };

      setSuggestions(prev => [customSuggestion, ...prev]);
      setCustomPrompt('');
      completeOperation(operationId, 'Benutzerdefinierter Content erstellt');
      
    } catch (err) {
      setError('Fehler bei der benutzerdefinierten Content-Generierung');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    // Could show toast notification here
  };

  const getToneColor = (tone: string) => {
    switch (tone) {
      case 'professional': return 'bg-blue-100 text-blue-800';
      case 'casual': return 'bg-green-100 text-green-800';
      case 'friendly': return 'bg-yellow-100 text-yellow-800';
      case 'promotional': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'instagram': return '📸';
      case 'facebook': return '👥';
      case 'google_posts': return '🔍';
      case 'website': return '🌐';
      default: return '📝';
    }
  };

  if (!hasContentCapability) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <PenTool className="w-5 h-5" />
            <span>KI-Content</span>
            {beta && <Badge variant="secondary">Beta</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">
              KI-Content-Generierung ist nicht verfügbar
            </p>
            <p className="text-sm text-gray-400">
              Aktivieren Sie AI-Content Features für automatische Content-Erstellung
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <PenTool className="w-5 h-5" />
            <span>KI-Content</span>
            {beta && <Badge variant="secondary">Beta</Badge>}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={generateInitialContent}
            disabled={isGenerating || isOperationRunning}
          >
            <RefreshCw className={`w-4 h-4 ${isGenerating || isOperationRunning ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Content Type Selector */}
        <div className="flex space-x-2 overflow-x-auto">
          {(['instagram', 'facebook', 'google_posts', 'website'] as const).map((type) => (
            <Button
              key={type}
              variant={selectedType === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType(type)}
              className="flex items-center space-x-1 whitespace-nowrap"
            >
              <span>{getTypeIcon(type)}</span>
              <span className="capitalize">{type.replace('_', ' ')}</span>
            </Button>
          ))}
        </div>

        {/* Custom Prompt */}
        {!compactMode && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Eigene Idee eingeben:</label>
            <div className="flex space-x-2">
              <Textarea
                placeholder="z.B. 'Post über unser neues Dessert' oder 'Einladung zur Weinverkostung'"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="flex-1 min-h-[60px]"
              />
              <Button
                onClick={generateCustomContent}
                disabled={!customPrompt.trim() || isGenerating}
                size="sm"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Content Suggestions */}
        {isGenerating || isOperationRunning ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="animate-pulse border rounded-lg p-3">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions
              .filter(s => s.type === selectedType)
              .slice(0, compactMode ? 2 : 4)
              .map((suggestion) => (
                <div key={suggestion.id} className="border rounded-lg p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">{suggestion.title}</h4>
                    <div className="flex items-center space-x-2">
                      <Badge className={getToneColor(suggestion.tone)} variant="secondary">
                        {suggestion.tone}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {suggestion.persona_fit}% fit
                      </Badge>
                    </div>
                  </div>

                  <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                    {suggestion.content}
                  </div>

                  {suggestion.hashtags.length > 0 && (
                    <div className="flex items-center space-x-1 text-xs">
                      <Hash className="w-3 h-3 text-blue-500" />
                      <div className="flex flex-wrap gap-1">
                        {suggestion.hashtags.map((tag, index) => (
                          <span key={index} className="text-blue-600">{tag}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {suggestion.imagePrompt && (
                    <div className="flex items-start space-x-2 text-xs text-gray-600">
                      <Image className="w-3 h-3 mt-0.5" />
                      <span>Bild-Idee: {suggestion.imagePrompt}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center space-x-3 text-xs text-gray-500">
                      <span>Engagement: {suggestion.engagement_score}%</span>
                      <span>Länge: {suggestion.length}</span>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(suggestion.content)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Stats */}
        {suggestions.length > 0 && !compactMode && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span className="text-blue-800">
                  {suggestions.filter(s => s.type === selectedType).length} Vorschläge für {selectedType}
                </span>
              </div>
              <div className="text-blue-600">
                Ø {Math.round(suggestions.reduce((sum, s) => sum + s.engagement_score, 0) / suggestions.length)}% Engagement
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIContentWidget;