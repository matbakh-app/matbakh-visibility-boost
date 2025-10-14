#!/usr/bin/env node

/**
 * Mock Persona API Server for Local Development
 * 
 * This server provides mock endpoints for the Advanced Persona System
 * to enable local development without deploying the Lambda functions.
 * 
 * Usage: node scripts/mock-persona-server.js
 * Server runs on: http://localhost:3001
 */

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Mock persona detection algorithm
function mockPersonaDetection(behavior) {
  console.log('🧠 Mock persona detection for behavior:', {
    decisionSpeed: behavior.decisionSpeed,
    deviceType: behavior.deviceType,
    sessionDuration: behavior.sessionDuration,
    clickPatterns: behavior.clickPatterns?.length || 0,
  });

  // Simple heuristic-based detection
  let detectedPersona = 'Solo-Sarah';
  let confidence = 0.5;
  const reasoning = [];

  // Decision speed analysis
  if (behavior.decisionSpeed > 0.8) {
    detectedPersona = 'Solo-Sarah';
    confidence += 0.2;
    reasoning.push('Fast decision-making indicates time-pressed behavior');
  } else if (behavior.decisionSpeed < 0.4) {
    detectedPersona = 'Bewahrer-Ben';
    confidence += 0.2;
    reasoning.push('Slow decision-making indicates cautious behavior');
  }

  // Device type analysis
  if (behavior.deviceType === 'mobile') {
    if (detectedPersona === 'Solo-Sarah') {
      confidence += 0.1;
      reasoning.push('Mobile usage aligns with time-pressed persona');
    }
  }

  // Session duration analysis
  if (behavior.sessionDuration > 600000) { // 10+ minutes
    const hasAnalytics = behavior.clickPatterns?.some(p => 
      p.elementId?.includes('analytics') || p.elementId?.includes('growth')
    );
    const hasEnterprise = behavior.clickPatterns?.some(p => 
      p.elementId?.includes('multi-location') || p.elementId?.includes('enterprise')
    );

    if (hasAnalytics) {
      detectedPersona = 'Wachstums-Walter';
      confidence += 0.3;
      reasoning.push('Long sessions with analytics focus indicates growth orientation');
    } else if (hasEnterprise) {
      detectedPersona = 'Ketten-Katrin';
      confidence += 0.3;
      reasoning.push('Enterprise features usage indicates chain management');
    } else {
      detectedPersona = 'Bewahrer-Ben';
      confidence += 0.2;
      reasoning.push('Long sessions indicate thorough information consumption');
    }
  }

  // Content consumption analysis
  if (behavior.informationConsumption?.preferredContentLength === 'short') {
    if (detectedPersona === 'Solo-Sarah') {
      confidence += 0.1;
      reasoning.push('Preference for short content confirms time constraints');
    }
  } else if (behavior.informationConsumption?.preferredContentLength === 'long') {
    if (detectedPersona === 'Bewahrer-Ben' || detectedPersona === 'Ketten-Katrin') {
      confidence += 0.1;
      reasoning.push('Preference for detailed content confirms thorough approach');
    }
  }

  // Ensure confidence is within bounds
  confidence = Math.min(Math.max(confidence, 0.3), 0.95);

  // Generate alternative personas
  const allPersonas = ['Solo-Sarah', 'Bewahrer-Ben', 'Wachstums-Walter', 'Ketten-Katrin'];
  const alternativePersonas = allPersonas
    .filter(p => p !== detectedPersona)
    .map(persona => ({
      persona,
      confidence: Math.random() * 0.4 + 0.1,
    }))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 2);

  return {
    detectedPersona,
    confidence,
    reasoning,
    alternativePersonas,
    behaviorAnalysis: {
      decisionMakingStyle: behavior.decisionSpeed > 0.7 ? 'intuitive' : 
                          behavior.decisionSpeed < 0.4 ? 'analytical' : 'mixed',
      informationProcessing: behavior.informationConsumption?.preferredContentLength === 'short' ? 'summary' :
                            behavior.informationConsumption?.preferredContentLength === 'long' ? 'detailed' : 'visual',
      riskTolerance: detectedPersona === 'Bewahrer-Ben' ? 'low' :
                    detectedPersona === 'Wachstums-Walter' ? 'high' : 'medium',
      technologyComfort: behavior.deviceType === 'mobile' ? 'intermediate' :
                        detectedPersona === 'Ketten-Katrin' ? 'advanced' : 'beginner',
      timeAvailability: detectedPersona === 'Solo-Sarah' ? 'limited' :
                       detectedPersona === 'Ketten-Katrin' ? 'flexible' : 'moderate',
    },
    recommendations: [
      {
        type: 'ui',
        title: 'Optimize Interface Layout',
        description: `Adapt UI for ${detectedPersona} preferences`,
        priority: 'high',
        implementation: 'Apply persona-specific styling and layout',
      },
      {
        type: 'content',
        title: 'Customize Content Length',
        description: 'Adjust content verbosity based on persona preferences',
        priority: 'medium',
        implementation: 'Use AdaptiveContent components',
      },
    ],
  };
}

// Routes
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'mock-persona-api',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.post('/api/persona/detect', (req, res) => {
  console.log('📡 POST /api/persona/detect');
  
  try {
    const { behavior } = req.body;
    
    if (!behavior) {
      return res.status(400).json({
        error: 'Missing behavior data',
        code: 'MISSING_BEHAVIOR'
      });
    }

    // Simulate processing delay
    setTimeout(() => {
      // Simulate occasional failures (5% chance)
      if (Math.random() < 0.05) {
        console.log('❌ Simulated API failure');
        return res.status(500).json({
          error: 'Simulated server error for testing',
          code: 'MOCK_ERROR'
        });
      }

      const result = mockPersonaDetection(behavior);
      console.log('✅ Detected persona:', result.detectedPersona, `(${(result.confidence * 100).toFixed(1)}%)`);
      
      res.json(result);
    }, 500 + Math.random() * 1000); // 500-1500ms delay

  } catch (error) {
    console.error('❌ Error in persona detection:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

app.get('/api/persona/config/:persona', (req, res) => {
  console.log('📡 GET /api/persona/config/' + req.params.persona);
  
  const { persona } = req.params;
  
  const configs = {
    'Solo-Sarah': {
      name: 'Solo Sarah',
      description: 'Time-pressed single restaurant owner',
      onboardingSteps: 3,
      preferredFeatures: ['quick-actions', 'mobile-first', 'summary-views'],
      uiPreferences: {
        contentLength: 'short',
        visualStyle: 'minimal',
        interactionStyle: 'guided',
      },
    },
    'Bewahrer-Ben': {
      name: 'Bewahrer Ben',
      description: 'Security-focused traditional owner',
      onboardingSteps: 7,
      preferredFeatures: ['detailed-guides', 'security-badges', 'step-by-step'],
      uiPreferences: {
        contentLength: 'long',
        visualStyle: 'standard',
        interactionStyle: 'guided',
      },
    },
    'Wachstums-Walter': {
      name: 'Wachstums Walter',
      description: 'Growth-oriented expansion-minded owner',
      onboardingSteps: 5,
      preferredFeatures: ['analytics', 'forecasting', 'competitive-analysis'],
      uiPreferences: {
        contentLength: 'medium',
        visualStyle: 'rich',
        interactionStyle: 'exploratory',
      },
    },
    'Ketten-Katrin': {
      name: 'Ketten Katrin',
      description: 'Enterprise/chain management',
      onboardingSteps: 6,
      preferredFeatures: ['multi-location', 'team-management', 'advanced-reporting'],
      uiPreferences: {
        contentLength: 'long',
        visualStyle: 'rich',
        interactionStyle: 'expert',
      },
    },
  };

  const config = configs[persona];
  if (!config) {
    return res.status(404).json({
      error: 'Persona not found',
      code: 'PERSONA_NOT_FOUND'
    });
  }

  res.json(config);
});

app.post('/api/persona/events', (req, res) => {
  console.log('📡 POST /api/persona/events');
  console.log('📊 Event tracked:', req.body);
  
  res.json({ 
    success: true, 
    eventId: 'mock-event-' + Date.now() 
  });
});

// 404 handler
app.use((req, res) => {
  console.log('❌ 404:', req.method, req.path);
  res.status(404).json({
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
    path: req.path,
    method: req.method
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('❌ Server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 Mock Persona API Server running on http://localhost:' + PORT);
  console.log('📋 Available endpoints:');
  console.log('  GET  /health');
  console.log('  POST /api/persona/detect');
  console.log('  GET  /api/persona/config/:persona');
  console.log('  POST /api/persona/events');
  console.log('');
  console.log('💡 To test: curl http://localhost:' + PORT + '/health');
  console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down Mock Persona API Server...');
  process.exit(0);
});