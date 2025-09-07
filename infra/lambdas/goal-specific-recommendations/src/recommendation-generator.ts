import { 
  Recommendation, 
  GoalProfile, 
  BusinessObjective, 
  RecommendationRequest,
  RecommendationCategory,
  PriorityLevel,
  EffortLevel,
  ImpactLevel,
  Timeframe,
  RecommendationSchema
} from './types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Recommendation Generator
 * Creates specific recommendations based on business objectives and profiles
 */
export class RecommendationGenerator {
  private static readonly RECOMMENDATION_TEMPLATES: Record<BusinessObjective, Recommendation[]> = {
    increase_visibility: [
      {
        id: 'vis-001',
        title: 'Optimize Google My Business Profile',
        description: 'Complete and optimize your Google My Business listing with accurate information, photos, and regular updates',
        category: 'seo_optimization',
        objective: 'increase_visibility',
        priority: 'high',
        effort: 'low',
        impact: 'high',
        timeframe: 'immediate',
        estimatedCost: { min: 0, max: 200, currency: 'EUR' },
        estimatedROI: { 
          percentage: 150, 
          timeframe: '3 months', 
          disclaimer: 'Unverbindliche Schätzung basierend auf Branchendurchschnitt' 
        },
        prerequisites: ['Google account', 'Business verification'],
        steps: [
          { order: 1, action: 'Claim or verify Google My Business listing', duration: '30 minutes', resources: ['Google account'] },
          { order: 2, action: 'Add complete business information', duration: '45 minutes', resources: ['Business details', 'Photos'] },
          { order: 3, action: 'Upload high-quality photos', duration: '1 hour', resources: ['Professional photos'] },
          { order: 4, action: 'Set up regular posting schedule', duration: '30 minutes', resources: ['Content calendar'] }
        ],
        successMetrics: [
          { metric: 'Profile views', target: '+50% in 30 days', measurement: 'Google My Business Insights' },
          { metric: 'Search queries', target: '+30% in 60 days', measurement: 'Google My Business Insights' },
          { metric: 'Direction requests', target: '+25% in 30 days', measurement: 'Google My Business Insights' }
        ],
        risks: [
          { risk: 'Incorrect information', probability: 'low', mitigation: 'Double-check all details before publishing' },
          { risk: 'Negative reviews visibility', probability: 'medium', mitigation: 'Implement review response strategy' }
        ],
        tags: ['google', 'local_seo', 'quick_win'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: 'template',
        confidence: 0.95
      },
      {
        id: 'vis-002',
        title: 'Create Consistent Social Media Presence',
        description: 'Establish and maintain active profiles on key social media platforms with regular, engaging content',
        category: 'social_media',
        objective: 'increase_visibility',
        priority: 'medium',
        effort: 'medium',
        impact: 'high',
        timeframe: 'short_term',
        estimatedCost: { min: 100, max: 500, currency: 'EUR' },
        estimatedROI: { 
          percentage: 200, 
          timeframe: '6 months', 
          disclaimer: 'Unverbindliche Schätzung basierend auf Branchendurchschnitt' 
        },
        prerequisites: ['Social media accounts', 'Content strategy'],
        steps: [
          { order: 1, action: 'Set up business profiles on Instagram, Facebook', duration: '2 hours', resources: ['Business information', 'Logo'] },
          { order: 2, action: 'Develop content calendar', duration: '3 hours', resources: ['Content planning tools'] },
          { order: 3, action: 'Create initial content batch', duration: '4 hours', resources: ['Photos', 'Captions'] },
          { order: 4, action: 'Implement posting schedule', duration: '1 hour', resources: ['Scheduling tools'] }
        ],
        successMetrics: [
          { metric: 'Follower growth', target: '+100 followers/month', measurement: 'Platform analytics' },
          { metric: 'Engagement rate', target: '3%+ engagement', measurement: 'Platform analytics' },
          { metric: 'Reach', target: '+200% monthly reach', measurement: 'Platform analytics' }
        ],
        risks: [
          { risk: 'Inconsistent posting', probability: 'medium', mitigation: 'Use scheduling tools and content calendar' },
          { risk: 'Low engagement', probability: 'medium', mitigation: 'Focus on quality content and community interaction' }
        ],
        tags: ['social_media', 'content', 'brand_building'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: 'template',
        confidence: 0.85
      }
    ],
    improve_reviews: [
      {
        id: 'rev-001',
        title: 'Implement Review Request System',
        description: 'Create a systematic approach to request reviews from satisfied customers',
        category: 'review_management',
        objective: 'improve_reviews',
        priority: 'high',
        effort: 'low',
        impact: 'high',
        timeframe: 'immediate',
        estimatedCost: { min: 50, max: 300, currency: 'EUR' },
        estimatedROI: { 
          percentage: 300, 
          timeframe: '2 months', 
          disclaimer: 'Unverbindliche Schätzung basierend auf Branchendurchschnitt' 
        },
        prerequisites: ['Customer contact information', 'Review platform accounts'],
        steps: [
          { order: 1, action: 'Create review request templates', duration: '1 hour', resources: ['Email templates'] },
          { order: 2, action: 'Train staff on review requests', duration: '30 minutes', resources: ['Staff training materials'] },
          { order: 3, action: 'Set up automated follow-up emails', duration: '2 hours', resources: ['Email automation tool'] },
          { order: 4, action: 'Create QR codes for easy review access', duration: '30 minutes', resources: ['QR code generator'] }
        ],
        successMetrics: [
          { metric: 'Review volume', target: '+200% monthly reviews', measurement: 'Review platform data' },
          { metric: 'Average rating', target: '4.5+ stars', measurement: 'Review platform data' },
          { metric: 'Response rate', target: '25% customer response', measurement: 'Email analytics' }
        ],
        risks: [
          { risk: 'Appearing pushy', probability: 'low', mitigation: 'Use gentle, personalized requests' },
          { risk: 'Negative reviews increase', probability: 'medium', mitigation: 'Focus on service quality first' }
        ],
        tags: ['reviews', 'customer_service', 'automation'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: 'template',
        confidence: 0.9
      }
    ],
    boost_social_engagement: [
      {
        id: 'soc-001',
        title: 'Launch User-Generated Content Campaign',
        description: 'Encourage customers to share photos and experiences on social media with branded hashtags',
        category: 'social_media',
        objective: 'boost_social_engagement',
        priority: 'medium',
        effort: 'medium',
        impact: 'high',
        timeframe: 'short_term',
        estimatedCost: { min: 200, max: 1000, currency: 'EUR' },
        estimatedROI: { 
          percentage: 250, 
          timeframe: '4 months', 
          disclaimer: 'Unverbindliche Schätzung basierend auf Branchendurchschnitt' 
        },
        prerequisites: ['Social media presence', 'Branded hashtag', 'Incentive budget'],
        steps: [
          { order: 1, action: 'Create branded hashtag and campaign theme', duration: '2 hours', resources: ['Creative team'] },
          { order: 2, action: 'Design promotional materials', duration: '4 hours', resources: ['Design tools', 'Printer'] },
          { order: 3, action: 'Launch campaign with incentives', duration: '1 hour', resources: ['Social media accounts'] },
          { order: 4, action: 'Engage with user content daily', duration: '30 min/day', resources: ['Social media manager'] }
        ],
        successMetrics: [
          { metric: 'UGC posts', target: '50+ posts/month', measurement: 'Hashtag tracking' },
          { metric: 'Engagement rate', target: '5%+ engagement', measurement: 'Platform analytics' },
          { metric: 'Reach amplification', target: '+300% organic reach', measurement: 'Platform analytics' }
        ],
        risks: [
          { risk: 'Low participation', probability: 'medium', mitigation: 'Offer attractive incentives and make it easy' },
          { risk: 'Negative content', probability: 'low', mitigation: 'Monitor hashtag and respond appropriately' }
        ],
        tags: ['ugc', 'social_media', 'engagement', 'community'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: 'template',
        confidence: 0.8
      }
    ],
    enhance_local_seo: [
      {
        id: 'seo-001',
        title: 'Build Local Citation Network',
        description: 'Create consistent business listings across major local directories and review sites',
        category: 'seo_optimization',
        objective: 'enhance_local_seo',
        priority: 'high',
        effort: 'medium',
        impact: 'high',
        timeframe: 'short_term',
        estimatedCost: { min: 100, max: 800, currency: 'EUR' },
        estimatedROI: { 
          percentage: 180, 
          timeframe: '6 months', 
          disclaimer: 'Unverbindliche Schätzung basierend auf Branchendurchschnitt' 
        },
        prerequisites: ['Business information', 'NAP consistency'],
        steps: [
          { order: 1, action: 'Audit existing citations', duration: '2 hours', resources: ['Citation tracking tool'] },
          { order: 2, action: 'Create listings on top 20 directories', duration: '6 hours', resources: ['Business details', 'Photos'] },
          { order: 3, action: 'Optimize existing listings', duration: '4 hours', resources: ['Updated information'] },
          { order: 4, action: 'Set up monitoring for consistency', duration: '1 hour', resources: ['Monitoring tools'] }
        ],
        successMetrics: [
          { metric: 'Citation count', target: '50+ quality citations', measurement: 'Citation audit tools' },
          { metric: 'NAP consistency', target: '95%+ consistency', measurement: 'Citation audit' },
          { metric: 'Local rankings', target: 'Top 5 for main keywords', measurement: 'Local SEO tools' }
        ],
        risks: [
          { risk: 'Inconsistent information', probability: 'medium', mitigation: 'Use standardized business information template' },
          { risk: 'Duplicate listings', probability: 'low', mitigation: 'Regular monitoring and cleanup' }
        ],
        tags: ['local_seo', 'citations', 'directories'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: 'template',
        confidence: 0.9
      }
    ],
    drive_foot_traffic: [
      {
        id: 'foot-001',
        title: 'Create Local Event Partnerships',
        description: 'Partner with local events, businesses, and organizations to increase community presence',
        category: 'local_marketing',
        objective: 'drive_foot_traffic',
        priority: 'medium',
        effort: 'medium',
        impact: 'high',
        timeframe: 'medium_term',
        estimatedCost: { min: 300, max: 1500, currency: 'EUR' },
        estimatedROI: { 
          percentage: 220, 
          timeframe: '3 months', 
          disclaimer: 'Unverbindliche Schätzung basierend auf Branchendurchschnitt' 
        },
        prerequisites: ['Local event calendar', 'Partnership budget', 'Marketing materials'],
        steps: [
          { order: 1, action: 'Research local events and organizations', duration: '3 hours', resources: ['Event calendars', 'Local directories'] },
          { order: 2, action: 'Reach out to potential partners', duration: '2 hours', resources: ['Contact information', 'Partnership proposals'] },
          { order: 3, action: 'Negotiate partnership terms', duration: '2 hours', resources: ['Partnership agreements'] },
          { order: 4, action: 'Execute partnership activities', duration: 'Ongoing', resources: ['Staff time', 'Marketing materials'] }
        ],
        successMetrics: [
          { metric: 'Event participation', target: '2+ events/month', measurement: 'Event tracking' },
          { metric: 'New customers from events', target: '50+ new customers/month', measurement: 'Customer surveys' },
          { metric: 'Foot traffic increase', target: '+25% on event days', measurement: 'Foot traffic counters' }
        ],
        risks: [
          { risk: 'Low event ROI', probability: 'medium', mitigation: 'Track metrics and focus on high-performing events' },
          { risk: 'Resource drain', probability: 'medium', mitigation: 'Set clear budget and time limits' }
        ],
        tags: ['local_marketing', 'partnerships', 'events', 'community'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: 'template',
        confidence: 0.75
      }
    ],
    increase_online_orders: [
      {
        id: 'order-001',
        title: 'Optimize Online Ordering Experience',
        description: 'Improve website and app ordering process to increase conversion rates',
        category: 'technology_upgrade',
        objective: 'increase_online_orders',
        priority: 'high',
        effort: 'high',
        impact: 'high',
        timeframe: 'medium_term',
        estimatedCost: { min: 1000, max: 5000, currency: 'EUR' },
        estimatedROI: { 
          percentage: 400, 
          timeframe: '6 months', 
          disclaimer: 'Unverbindliche Schätzung basierend auf Branchendurchschnitt' 
        },
        prerequisites: ['Existing online ordering system', 'Website access', 'Development resources'],
        steps: [
          { order: 1, action: 'Audit current ordering process', duration: '4 hours', resources: ['UX analysis tools'] },
          { order: 2, action: 'Identify friction points', duration: '2 hours', resources: ['User testing'] },
          { order: 3, action: 'Implement improvements', duration: '20 hours', resources: ['Developer', 'Designer'] },
          { order: 4, action: 'Test and optimize', duration: '8 hours', resources: ['A/B testing tools'] }
        ],
        successMetrics: [
          { metric: 'Conversion rate', target: '8%+ order conversion', measurement: 'E-commerce analytics' },
          { metric: 'Cart abandonment', target: '<30% abandonment', measurement: 'E-commerce analytics' },
          { metric: 'Order completion time', target: '<3 minutes average', measurement: 'User analytics' }
        ],
        risks: [
          { risk: 'Technical issues', probability: 'medium', mitigation: 'Thorough testing before launch' },
          { risk: 'User confusion', probability: 'low', mitigation: 'User testing and gradual rollout' }
        ],
        tags: ['online_ordering', 'ux_optimization', 'conversion'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: 'template',
        confidence: 0.85
      }
    ],
    build_brand_awareness: [
      {
        id: 'brand-001',
        title: 'Develop Content Marketing Strategy',
        description: 'Create valuable, shareable content that showcases expertise and builds brand recognition',
        category: 'content_creation',
        objective: 'build_brand_awareness',
        priority: 'medium',
        effort: 'high',
        impact: 'medium',
        timeframe: 'long_term',
        estimatedCost: { min: 500, max: 2000, currency: 'EUR' },
        estimatedROI: { 
          percentage: 150, 
          timeframe: '12 months', 
          disclaimer: 'Unverbindliche Schätzung basierend auf Branchendurchschnitt' 
        },
        prerequisites: ['Content strategy', 'Content creation resources', 'Distribution channels'],
        steps: [
          { order: 1, action: 'Define brand voice and messaging', duration: '4 hours', resources: ['Brand guidelines'] },
          { order: 2, action: 'Create content calendar', duration: '3 hours', resources: ['Content planning tools'] },
          { order: 3, action: 'Produce initial content batch', duration: '16 hours', resources: ['Content creator', 'Designer'] },
          { order: 4, action: 'Distribute across channels', duration: '2 hours/week', resources: ['Social media manager'] }
        ],
        successMetrics: [
          { metric: 'Content engagement', target: '5%+ engagement rate', measurement: 'Social media analytics' },
          { metric: 'Brand mentions', target: '+100% monthly mentions', measurement: 'Social listening tools' },
          { metric: 'Website traffic', target: '+50% organic traffic', measurement: 'Google Analytics' }
        ],
        risks: [
          { risk: 'Content not resonating', probability: 'medium', mitigation: 'Regular audience feedback and adjustment' },
          { risk: 'Resource intensive', probability: 'high', mitigation: 'Start small and scale based on results' }
        ],
        tags: ['content_marketing', 'brand_building', 'thought_leadership'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: 'template',
        confidence: 0.7
      }
    ],
    competitive_positioning: [
      {
        id: 'comp-001',
        title: 'Develop Unique Value Proposition',
        description: 'Identify and communicate what makes your business unique compared to competitors',
        category: 'competitive_analysis',
        objective: 'competitive_positioning',
        priority: 'high',
        effort: 'medium',
        impact: 'high',
        timeframe: 'short_term',
        estimatedCost: { min: 200, max: 1000, currency: 'EUR' },
        estimatedROI: { 
          percentage: 200, 
          timeframe: '6 months', 
          disclaimer: 'Unverbindliche Schätzung basierend auf Branchendurchschnitt' 
        },
        prerequisites: ['Competitive analysis', 'Customer feedback', 'Brand positioning'],
        steps: [
          { order: 1, action: 'Analyze competitor offerings', duration: '6 hours', resources: ['Competitive research tools'] },
          { order: 2, action: 'Identify unique strengths', duration: '3 hours', resources: ['Customer surveys', 'Staff input'] },
          { order: 3, action: 'Craft UVP messaging', duration: '4 hours', resources: ['Marketing copywriter'] },
          { order: 4, action: 'Implement across touchpoints', duration: '8 hours', resources: ['Marketing materials update'] }
        ],
        successMetrics: [
          { metric: 'Brand differentiation', target: 'Clear UVP communication', measurement: 'Brand audit' },
          { metric: 'Customer preference', target: '60%+ preference over competitors', measurement: 'Customer surveys' },
          { metric: 'Market positioning', target: 'Top 3 in local market', measurement: 'Competitive analysis' }
        ],
        risks: [
          { risk: 'UVP not compelling', probability: 'medium', mitigation: 'Test messaging with target audience' },
          { risk: 'Competitors copying', probability: 'low', mitigation: 'Focus on authentic, hard-to-replicate advantages' }
        ],
        tags: ['positioning', 'differentiation', 'competitive_advantage'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: 'template',
        confidence: 0.8
      }
    ],
    cost_optimization: [
      {
        id: 'cost-001',
        title: 'Implement Marketing Automation',
        description: 'Automate repetitive marketing tasks to reduce costs and improve efficiency',
        category: 'technology_upgrade',
        objective: 'cost_optimization',
        priority: 'high',
        effort: 'medium',
        impact: 'high',
        timeframe: 'medium_term',
        estimatedCost: { min: 300, max: 1200, currency: 'EUR' },
        estimatedROI: { 
          percentage: 350, 
          timeframe: '6 months', 
          disclaimer: 'Unverbindliche Schätzung basierend auf Branchendurchschnitt' 
        },
        prerequisites: ['Marketing automation platform', 'Customer database', 'Email templates'],
        steps: [
          { order: 1, action: 'Select automation platform', duration: '4 hours', resources: ['Platform comparison'] },
          { order: 2, action: 'Set up automated workflows', duration: '8 hours', resources: ['Marketing automation specialist'] },
          { order: 3, action: 'Create email sequences', duration: '6 hours', resources: ['Email templates', 'Copywriter'] },
          { order: 4, action: 'Test and optimize', duration: '4 hours', resources: ['A/B testing'] }
        ],
        successMetrics: [
          { metric: 'Time savings', target: '10+ hours/week saved', measurement: 'Time tracking' },
          { metric: 'Cost per lead', target: '-50% cost reduction', measurement: 'Marketing analytics' },
          { metric: 'Automation rate', target: '80%+ processes automated', measurement: 'Process audit' }
        ],
        risks: [
          { risk: 'Over-automation', probability: 'medium', mitigation: 'Maintain personal touch in key interactions' },
          { risk: 'Technical issues', probability: 'low', mitigation: 'Regular monitoring and backup processes' }
        ],
        tags: ['automation', 'efficiency', 'cost_reduction'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: 'template',
        confidence: 0.85
      }
    ],
    customer_retention: [
      {
        id: 'ret-001',
        title: 'Launch Customer Loyalty Program',
        description: 'Create a points-based loyalty program to encourage repeat visits and increase customer lifetime value',
        category: 'customer_experience',
        objective: 'customer_retention',
        priority: 'high',
        effort: 'medium',
        impact: 'high',
        timeframe: 'medium_term',
        estimatedCost: { min: 500, max: 2500, currency: 'EUR' },
        estimatedROI: { 
          percentage: 300, 
          timeframe: '9 months', 
          disclaimer: 'Unverbindliche Schätzung basierend auf Branchendurchschnitt' 
        },
        prerequisites: ['POS system integration', 'Loyalty platform', 'Reward structure'],
        steps: [
          { order: 1, action: 'Design loyalty program structure', duration: '6 hours', resources: ['Program design'] },
          { order: 2, action: 'Set up loyalty platform', duration: '8 hours', resources: ['Loyalty software', 'POS integration'] },
          { order: 3, action: 'Train staff on program', duration: '2 hours', resources: ['Training materials'] },
          { order: 4, action: 'Launch with promotional campaign', duration: '4 hours', resources: ['Marketing materials'] }
        ],
        successMetrics: [
          { metric: 'Program enrollment', target: '40%+ customer enrollment', measurement: 'Loyalty platform data' },
          { metric: 'Repeat visit rate', target: '+50% repeat visits', measurement: 'POS system data' },
          { metric: 'Customer lifetime value', target: '+30% CLV increase', measurement: 'Customer analytics' }
        ],
        risks: [
          { risk: 'Low adoption', probability: 'medium', mitigation: 'Strong launch promotion and staff training' },
          { risk: 'Program costs', probability: 'medium', mitigation: 'Monitor ROI and adjust rewards as needed' }
        ],
        tags: ['loyalty', 'retention', 'customer_experience'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: 'template',
        confidence: 0.85
      }
    ],
    market_expansion: [
      {
        id: 'exp-001',
        title: 'Expand Delivery Radius',
        description: 'Increase delivery coverage area to reach new customer segments and geographic markets',
        category: 'operational_improvement',
        objective: 'market_expansion',
        priority: 'medium',
        effort: 'high',
        impact: 'medium',
        timeframe: 'medium_term',
        estimatedCost: { min: 1000, max: 5000, currency: 'EUR' },
        estimatedROI: { 
          percentage: 180, 
          timeframe: '12 months', 
          disclaimer: 'Unverbindliche Schätzung basierend auf Branchendurchschnitt' 
        },
        prerequisites: ['Delivery infrastructure', 'Market research', 'Operational capacity'],
        steps: [
          { order: 1, action: 'Analyze potential expansion areas', duration: '8 hours', resources: ['Market research tools'] },
          { order: 2, action: 'Assess delivery logistics', duration: '4 hours', resources: ['Logistics planning'] },
          { order: 3, action: 'Update delivery systems', duration: '12 hours', resources: ['System updates', 'Staff training'] },
          { order: 4, action: 'Launch in new areas', duration: '6 hours', resources: ['Marketing campaign'] }
        ],
        successMetrics: [
          { metric: 'Coverage area', target: '+50% delivery radius', measurement: 'Delivery system data' },
          { metric: 'New market customers', target: '30%+ orders from new areas', measurement: 'Order analytics' },
          { metric: 'Revenue growth', target: '+25% delivery revenue', measurement: 'Financial reports' }
        ],
        risks: [
          { risk: 'Delivery time increase', probability: 'high', mitigation: 'Optimize routes and consider additional delivery staff' },
          { risk: 'Service quality decline', probability: 'medium', mitigation: 'Gradual expansion with quality monitoring' }
        ],
        tags: ['expansion', 'delivery', 'geographic_growth'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: 'template',
        confidence: 0.7
      }
    ],
    operational_efficiency: [
      {
        id: 'eff-001',
        title: 'Implement Digital Menu Boards',
        description: 'Replace static menus with digital displays to improve order accuracy and reduce wait times',
        category: 'technology_upgrade',
        objective: 'operational_efficiency',
        priority: 'medium',
        effort: 'high',
        impact: 'medium',
        timeframe: 'medium_term',
        estimatedCost: { min: 2000, max: 8000, currency: 'EUR' },
        estimatedROI: { 
          percentage: 150, 
          timeframe: '18 months', 
          disclaimer: 'Unverbindliche Schätzung basierend auf Branchendurchschnitt' 
        },
        prerequisites: ['Digital display hardware', 'Menu management software', 'Installation support'],
        steps: [
          { order: 1, action: 'Select digital menu system', duration: '6 hours', resources: ['Vendor research'] },
          { order: 2, action: 'Install hardware and software', duration: '8 hours', resources: ['Installation team'] },
          { order: 3, action: 'Create digital menu content', duration: '12 hours', resources: ['Menu design', 'Photography'] },
          { order: 4, action: 'Train staff on system', duration: '4 hours', resources: ['Training materials'] }
        ],
        successMetrics: [
          { metric: 'Order accuracy', target: '95%+ order accuracy', measurement: 'POS system data' },
          { metric: 'Order time', target: '-30% average order time', measurement: 'Time tracking' },
          { metric: 'Upselling', target: '+20% average order value', measurement: 'POS analytics' }
        ],
        risks: [
          { risk: 'Technical failures', probability: 'medium', mitigation: 'Backup systems and maintenance contracts' },
          { risk: 'Staff resistance', probability: 'low', mitigation: 'Comprehensive training and support' }
        ],
        tags: ['technology', 'efficiency', 'customer_experience'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: 'template',
        confidence: 0.75
      }
    ]
  };

  /**
   * Generate recommendations based on goal profile and business context
   */
  public generateRecommendations(
    request: RecommendationRequest,
    goalProfile: GoalProfile,
    maxRecommendations: number = 10
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];
    
    // Get base recommendations for primary objective
    const primaryRecommendations = this.getRecommendationsForObjective(
      request.primaryObjective,
      request,
      goalProfile
    );
    recommendations.push(...primaryRecommendations);

    // Add recommendations for secondary objectives
    for (const objective of goalProfile.secondaryObjectives) {
      const secondaryRecommendations = this.getRecommendationsForObjective(
        objective,
        request,
        goalProfile
      );
      recommendations.push(...secondaryRecommendations.slice(0, 2)); // Limit secondary
    }

    // Customize recommendations based on business profile
    const customizedRecommendations = recommendations.map(rec => 
      this.customizeRecommendation(rec, request, goalProfile)
    );

    // Filter based on constraints
    const filteredRecommendations = this.filterByConstraints(
      customizedRecommendations,
      request.constraints
    );

    // Add AI-generated recommendations if needed
    if (filteredRecommendations.length < maxRecommendations) {
      const aiRecommendations = this.generateAIRecommendations(
        request,
        goalProfile,
        maxRecommendations - filteredRecommendations.length
      );
      filteredRecommendations.push(...aiRecommendations);
    }

    return filteredRecommendations.slice(0, maxRecommendations);
  }

  /**
   * Get template recommendations for a specific objective
   */
  private getRecommendationsForObjective(
    objective: BusinessObjective,
    request: RecommendationRequest,
    goalProfile: GoalProfile
  ): Recommendation[] {
    const templates = RecommendationGenerator.RECOMMENDATION_TEMPLATES[objective] || [];
    
    return templates.map(template => ({
      ...template,
      id: uuidv4(), // Generate new ID for each instance
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
  }

  /**
   * Customize recommendation based on business profile and constraints
   */
  private customizeRecommendation(
    recommendation: Recommendation,
    request: RecommendationRequest,
    goalProfile: GoalProfile
  ): Recommendation {
    const customized = { ...recommendation };

    // Adjust based on business size
    if (request.businessProfile.size === 'small') {
      // Reduce costs and complexity for small businesses
      if (customized.estimatedCost) {
        customized.estimatedCost.min = Math.floor(customized.estimatedCost.min * 0.7);
        customized.estimatedCost.max = Math.floor(customized.estimatedCost.max * 0.7);
      }
      
      // Simplify steps for small businesses
      if (customized.steps.length > 4) {
        customized.steps = customized.steps.slice(0, 4);
      }
    } else if (request.businessProfile.size === 'enterprise') {
      // Scale up for enterprise
      if (customized.estimatedCost) {
        customized.estimatedCost.min = Math.floor(customized.estimatedCost.min * 1.5);
        customized.estimatedCost.max = Math.floor(customized.estimatedCost.max * 2);
      }
    }

    // Adjust based on persona type
    if (request.personaType) {
      customized.description = this.adaptDescriptionForPersona(
        customized.description,
        request.personaType
      );
    }

    // Adjust based on industry context
    const competitionLevel = goalProfile.industryContext.competitionLevel;
    if (competitionLevel === 'intense') {
      customized.priority = this.increasePriority(customized.priority);
      customized.timeframe = 'immediate';
    }

    return customized;
  }

  /**
   * Filter recommendations based on business constraints
   */
  private filterByConstraints(
    recommendations: Recommendation[],
    constraints: RecommendationRequest['constraints']
  ): Recommendation[] {
    return recommendations.filter(rec => {
      // Budget constraint
      if (constraints.budget && rec.estimatedCost) {
        const maxBudget = constraints.budget.amount;
        if (rec.estimatedCost.min > maxBudget) {
          return false;
        }
      }

      // Timeline constraint
      if (constraints.timeline) {
        const timelineMonths = this.getTimelineInMonths(constraints.timeline);
        const recTimeframe = this.getTimeframeInMonths(rec.timeframe);
        if (recTimeframe > timelineMonths) {
          return false;
        }
      }

      // Resource constraints
      if (constraints.limitations.includes('no_technical_resources') && 
          rec.category === 'technology_upgrade') {
        return false;
      }

      return true;
    });
  }

  /**
   * Generate AI-powered recommendations (placeholder for future AI integration)
   */
  private generateAIRecommendations(
    request: RecommendationRequest,
    goalProfile: GoalProfile,
    count: number
  ): Recommendation[] {
    // This would integrate with AI service to generate custom recommendations
    // For now, return empty array as this is a placeholder
    return [];
  }

  /**
   * Adapt description for specific persona types
   */
  private adaptDescriptionForPersona(
    description: string,
    personaType: string
  ): string {
    switch (personaType) {
      case 'Solo-Sarah':
        return `${description} This solution is designed to be simple and time-efficient for busy restaurant owners.`;
      case 'Bewahrer-Ben':
        return `${description} This proven approach has helped many restaurants achieve reliable, sustainable results.`;
      case 'Wachstums-Walter':
        return `${description} This strategic initiative can significantly accelerate your business growth and market position.`;
      case 'Ketten-Katrin':
        return `${description} This scalable solution can be implemented across multiple locations for maximum efficiency.`;
      default:
        return description;
    }
  }

  /**
   * Increase priority level
   */
  private increasePriority(priority: PriorityLevel): PriorityLevel {
    switch (priority) {
      case 'low': return 'medium';
      case 'medium': return 'high';
      case 'high': return 'critical';
      case 'critical': return 'critical';
    }
  }

  /**
   * Convert timeline to months
   */
  private getTimelineInMonths(timeline: { start: string; end: string }): number {
    const start = new Date(timeline.start);
    const end = new Date(timeline.end);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.floor(diffDays / 30);
  }

  /**
   * Convert timeframe to months
   */
  private getTimeframeInMonths(timeframe: Timeframe): number {
    switch (timeframe) {
      case 'immediate': return 0.25;
      case 'short_term': return 3;
      case 'medium_term': return 6;
      case 'long_term': return 12;
    }
  }
}