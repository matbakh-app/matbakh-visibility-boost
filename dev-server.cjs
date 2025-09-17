// dev-server.cjs - Mock Persona API für lokale Entwicklung (CommonJS)
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// --- Mock Endpoint für Persona Detection ---
app.post('/api/persona/detect', (req, res) => {
  console.log('🎯 Persona Detection Request:', req.body);
  
  // Simuliere verschiedene Personas basierend auf Request-Daten
  const mockPersonas = [
    {
      type: 'Solo-Sarah',
      confidence: 0.86,
      reasoning: {
        keyIndicators: ['Fast decision-making pattern', 'Mobile-first behavior'],
        behaviorPatterns: ['Quick clicks', 'Short session duration'],
        contextualFactors: ['Time-pressed context', 'Efficiency-focused'],
      },
      adaptationRecommendations: [
        {
          type: 'ui',
          description: 'Simplify navigation and prioritize quick actions',
          implementation: 'Reduce menu depth, add quick action buttons',
          priority: 'high',
        },
        {
          type: 'content',
          description: 'Provide concise, action-oriented content',
          implementation: 'Use bullet points, highlight key actions',
          priority: 'high',
        },
      ],
    },
    {
      type: 'Bewahrer-Ben',
      confidence: 0.78,
      reasoning: {
        keyIndicators: ['Cautious navigation', 'Multiple page visits'],
        behaviorPatterns: ['Thorough reading', 'Security-focused'],
        contextualFactors: ['Risk-averse behavior', 'Trust-building needs'],
      },
      adaptationRecommendations: [
        {
          type: 'ui',
          description: 'Add trust signals and detailed explanations',
          implementation: 'Show testimonials, security badges, detailed FAQs',
          priority: 'high',
        },
        {
          type: 'content',
          description: 'Provide comprehensive information and guarantees',
          implementation: 'Add detailed descriptions, money-back guarantees',
          priority: 'medium',
        },
      ],
    },
    {
      type: 'Wachstums-Walter',
      confidence: 0.82,
      reasoning: {
        keyIndicators: ['Analytics-focused behavior', 'Growth metrics interest'],
        behaviorPatterns: ['Dashboard usage', 'Report downloads'],
        contextualFactors: ['Business expansion goals', 'ROI-focused'],
      },
      adaptationRecommendations: [
        {
          type: 'ui',
          description: 'Highlight analytics and growth features',
          implementation: 'Prominent dashboard access, metrics visualization',
          priority: 'high',
        },
        {
          type: 'content',
          description: 'Focus on business growth and ROI content',
          implementation: 'Case studies, growth statistics, ROI calculators',
          priority: 'high',
        },
      ],
    },
    {
      type: 'Ketten-Katrin',
      confidence: 0.75,
      reasoning: {
        keyIndicators: ['Multi-location interest', 'Enterprise features'],
        behaviorPatterns: ['Bulk operations', 'Team management'],
        contextualFactors: ['Chain management needs', 'Scalability focus'],
      },
      adaptationRecommendations: [
        {
          type: 'ui',
          description: 'Emphasize multi-location and team features',
          implementation: 'Bulk management tools, team dashboards',
          priority: 'high',
        },
        {
          type: 'content',
          description: 'Showcase enterprise capabilities and scalability',
          implementation: 'Enterprise case studies, scalability features',
          priority: 'medium',
        },
      ],
    },
  ];

  // Wähle zufällige Persona oder basierend auf Request-Parameter
  const randomPersona = mockPersonas[Math.floor(Math.random() * mockPersonas.length)];
  
  // Simuliere AIDA-Optimierung (falls Psychology Triggers aktiv)
  const aidaOptimization = {
    attention: {
      headline: `Perfekt für ${randomPersona.type}!`,
      hook: 'Entdecken Sie, was Ihr Restaurant wirklich braucht',
    },
    interest: {
      benefits: [
        'Sofortige Sichtbarkeits-Analyse',
        'Personalisierte Empfehlungen',
        'Messbare Ergebnisse',
      ],
    },
    desire: {
      socialProof: 'Über 500 Restaurants vertrauen bereits auf unsere Lösung',
      urgency: 'Limitiertes Angebot: Jetzt 30% sparen',
    },
    action: {
      primaryCta: randomPersona.type === 'Solo-Sarah' ? 'Jetzt 2-Min-Analyse starten' : 
                  randomPersona.type === 'Bewahrer-Ben' ? 'Kostenlose Demo anfordern' :
                  randomPersona.type === 'Wachstums-Walter' ? 'ROI-Rechner starten' :
                  'Enterprise-Demo buchen',
      secondaryCta: 'Mehr erfahren',
    },
  };

  // Response im erwarteten Format
  const response = {
    success: true,
    primaryPersona: randomPersona.type,
    confidence: randomPersona.confidence,
    reasoning: randomPersona.reasoning,
    adaptationRecommendations: randomPersona.adaptationRecommendations,
    secondaryPersonas: mockPersonas
      .filter(p => p.type !== randomPersona.type)
      .map(p => p.type)
      .slice(0, 2),
    aidaOptimization,
    psychologyTriggers: [
      {
        type: 'social_proof',
        content: 'Über 500 zufriedene Restaurant-Besitzer',
        placement: 'header',
        priority: 'high',
      },
      {
        type: 'scarcity',
        content: 'Nur noch wenige Plätze verfügbar',
        placement: 'cta',
        priority: 'medium',
      },
    ],
    metadata: {
      timestamp: new Date().toISOString(),
      requestId: `mock-${Date.now()}`,
      processingTime: Math.floor(Math.random() * 500) + 200, // 200-700ms
    },
  };

  console.log('✅ Returning persona:', response.primaryPersona);
  res.json(response);
});

// --- Health Check Endpoint ---
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'mock-persona-api',
    timestamp: new Date().toISOString(),
  });
});

// --- Start Server ---
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`✅ Mock Persona API running on http://localhost:${PORT}`);
  console.log(`🎯 Endpoints:`);
  console.log(`   POST http://localhost:${PORT}/api/persona/detect`);
  console.log(`   GET  http://localhost:${PORT}/api/health`);
});