export const mockAnalysisData = [
  {
    title: 'Google My Business Optimierung',
    score: 92,
    status: 'success' as const,
    platform: 'Google',
    description: 'Ihre Google My Business Präsenz zeigt exzellente Performance mit hoher lokaler Sichtbarkeit.',
    recommendations: [
      'Regelmäßige Posts für bessere Engagement-Rate',
      'Kundenbewertungen aktiv managen',
      'Öffnungszeiten immer aktuell halten'
    ],
    actionUrl: 'https://business.google.com'
  },
  {
    title: 'Social Media Präsenz',
    score: 67,
    status: 'warning' as const,
    platform: 'Instagram, Facebook',
    description: 'Moderate Aktivität auf sozialen Plattformen mit Verbesserungspotential bei Reichweite.',
    recommendations: [
      'Content-Strategie für Instagram Stories',
      'Facebook Events für Sonderaktionen',
      'User-Generated Content fördern'
    ]
  },
  {
    title: 'Online-Bewertungen Monitor',
    score: 45,
    status: 'error' as const,
    platform: 'TripAdvisor, Yelp',
    description: 'Bewertungsmanagement benötigt dringend Aufmerksamkeit für bessere Reputation.',
    recommendations: [
      'Proaktive Bewertungsanfragen',
      'Professionelle Antworten auf negative Reviews',
      'Bewertungs-Monitoring-System einrichten'
    ]
  }
];

export const DEMO_PIPELINE_FEATURES = [
  {
    title: '4-Schritt Pipeline',
    items: [
      '• Daten sammeln (0-20%)',
      '• Bedrock AI (20-60%)',
      '• OnPal Intelligenz (60-85%)',
      '• Ergebnisse (85-100%)'
    ],
    bgColor: 'bg-primary/5'
  },
  {
    title: 'Real-time Updates',
    items: [
      '• Live Datenpunkt-Counter',
      '• AI-Service Status',
      '• ROI-Berechnung',
      '• Geschätzte Restzeit'
    ],
    bgColor: 'bg-success/5'
  },
  {
    title: 'Premium Features',
    items: [
      '• 50% schnellere Analyse',
      '• Priority Queue',
      '• Advanced Intelligence',
      '• Predictive Trends'
    ],
    bgColor: 'bg-warning/5'
  }
];

export const AI_FEATURES_BY_PLAN = {
  basic: {
    title: '🆓 Basic Plan AI',
    features: [
      'Basic Sentiment-Analyse',
      'Einfache Trends',
      'Trend-Predictions (locked)',
      'Competitive Intelligence (locked)',
      'OnPal Features (locked)'
    ],
    bgColor: 'bg-background'
  },
  business: {
    title: '💼 Business Plan AI',
    features: [
      'Detailed Sentiment-Analyse',
      'Trend-Predictions (30 Tage)',
      'Competitor-Intelligence',
      'Local-Market-Trends',
      'Premium Features (locked)'
    ],
    bgColor: 'bg-primary/5'
  },
  premium: {
    title: '👑 Premium Plan AI',
    features: [
      'Advanced Predictive Modeling',
      'Market-Trend-Forecasting',
      'AI-generated Action-Plans',
      'Custom AI-Prompts',
      'Alle Features freigeschaltet'
    ],
    bgColor: 'bg-warning/5'
  }
};

export const PLATFORM_SCORES = [
  { label: 'Google', value: 92, color: 'success' },
  { label: 'Social', value: 67, color: 'warning' },
  { label: 'Reviews', value: 45, color: 'error' },
  { label: 'SEO', value: 84, color: 'primary' }
];

export const METRIC_CARDS_DATA = [
  {
    label: 'Lokale Sichtbarkeit',
    value: 92,
    format: 'percentage' as const,
    change: 8,
    status: 'positive' as const
  },
  {
    label: 'Online-Bewertungen',
    value: 4.2,
    change: 0.3,
    status: 'positive' as const
  },
  {
    label: 'Social Media Reach',
    value: 15420,
    change: -5,
    status: 'negative' as const
  },
  {
    label: 'Website Traffic',
    value: 2840,
    change: 15,
    status: 'positive' as const
  }
];