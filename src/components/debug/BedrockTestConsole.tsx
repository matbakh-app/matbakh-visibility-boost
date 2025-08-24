import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useBedrockCategorySuggestions } from '@/hooks/useBedrockCategorySuggestions';
import { AlertCircle, Sparkles } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const BedrockTestConsole: React.FC = () => {
  const [testData, setTestData] = useState({
    businessName: 'Pizzeria da Marco',
    businessDescription: 'Authentische neapolitanische Pizzeria mit Steinofen und traditionellen italienischen Gerichten. Wir bieten auch Lieferservice und Catering.',
    address: {
      street: 'Marienplatz',
      houseNumber: '1',
      postalCode: '80331',
      city: 'München',
      country: 'Deutschland'
    },
    website: 'https://pizzeria-marco.de'
  });

  const bedrockMutation = useBedrockCategorySuggestions();

  const runTest = () => {
    console.log('🧪 Running Bedrock Test with data:', testData);
    
    bedrockMutation.mutate({
      businessDescription: `${testData.businessName}: ${testData.businessDescription}`,
      address: testData.address,
      website: testData.website,
      mainCategories: ['Essen & Trinken'],
      language: 'de',
      userId: null
    });
  };

  return (
    <div className="space-y-6 p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            Bedrock VC Integration Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Business Name</label>
              <input
                type="text"
                value={testData.businessName}
                onChange={(e) => setTestData({...testData, businessName: e.target.value})}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Website</label>
              <input
                type="text"
                value={testData.website}
                onChange={(e) => setTestData({...testData, website: e.target.value})}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Business Description</label>
            <textarea
              value={testData.businessDescription}
              onChange={(e) => setTestData({...testData, businessDescription: e.target.value})}
              className="w-full p-2 border rounded h-24"
            />
          </div>

          <Button 
            onClick={runTest}
            disabled={bedrockMutation.isPending}
            className="w-full"
          >
            {bedrockMutation.isPending ? (
              'Testing Bedrock Integration...'
            ) : (
              'Test Bedrock VC Analysis'
            )}
          </Button>

          {bedrockMutation.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{bedrockMutation.error.message}</AlertDescription>
            </Alert>
          )}

          {bedrockMutation.data && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Request Info</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-1 text-xs">
                      <p><strong>Request ID:</strong> {bedrockMutation.data.requestId}</p>
                      <p><strong>Fallback Used:</strong> {bedrockMutation.data.fallbackUsed ? 'Yes' : 'No'}</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Usage Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-1 text-xs">
                      <p><strong>Input Tokens:</strong> {bedrockMutation.data.usage.inputTokens}</p>
                      <p><strong>Output Tokens:</strong> {bedrockMutation.data.usage.outputTokens}</p>
                      <p><strong>Cost:</strong> ${bedrockMutation.data.usage.usd.toFixed(4)}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Results</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-1 text-xs">
                      <p><strong>Suggestions:</strong> {bedrockMutation.data.suggestions.length}</p>
                      <p><strong>Tags:</strong> {bedrockMutation.data.tags.length}</p>
                      <p><strong>Has Reasoning:</strong> {bedrockMutation.data.reasoning ? 'Yes' : 'No'}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {bedrockMutation.data.reasoning && (
                <Alert className="bg-blue-50 border-blue-200">
                  <Sparkles className="h-4 w-4 text-blue-500" />
                  <AlertDescription className="text-blue-800">
                    <strong>AI Reasoning:</strong> {bedrockMutation.data.reasoning}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-3">
                <h4 className="font-medium">Category Suggestions ({bedrockMutation.data.suggestions.length})</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {bedrockMutation.data.suggestions.map((suggestion, index) => (
                    <Card key={index} className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{suggestion.name}</p>
                          <p className="text-xs text-gray-600">ID: {suggestion.id}</p>
                        </div>
                        <Badge variant={suggestion.score > 0.8 ? 'default' : 'secondary'}>
                          {Math.round(suggestion.score * 100)}%
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {bedrockMutation.data.tags.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Detected Tags</h4>
                  <div className="flex flex-wrap gap-1">
                    {bedrockMutation.data.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};