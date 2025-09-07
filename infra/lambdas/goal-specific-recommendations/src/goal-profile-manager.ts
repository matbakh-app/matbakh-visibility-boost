import { 
  GoalProfile, 
  BusinessObjective, 
  RecommendationRequest,
  GoalProfileSchema 
} from './types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Goal Profile Manager
 * Creates and manages goal profiles for different business objectives
 */
export class GoalProfileManager {
  private static readonly DEFAULT_PROFILES: Record<BusinessObjective, Partial<GoalProfile>> = {
    increase_visibility: {
      name: 'Increase Online Visibility',
      description: 'Boost digital presence and search rankings to attract more customers',
      recommendationWeights: {
        priority: 0.3,
        effort: 0.2,
        impact: 0.4,
        timeframe: 0.1
      },
      keyMetrics: [
        {
          name: 'Google My Business Views',
          description: 'Monthly profile views on Google',
          target: '+50% in 3 months',
          measurement: 'Google My Business Insights',
          weight: 0.3
        },
        {
          name: 'Local Search Rankings',
          description: 'Position in local search results',
          target: 'Top 3 for primary keywords',
          measurement: 'Local SEO tracking tools',
          weight: 0.25
        },
        {
          name: 'Website Traffic',
          description: 'Organic website visitors',
          target: '+40% in 6 months',
          measurement: 'Google Analytics',
          weight: 0.25
        },
        {
          name: 'Social Media Reach',
          description: 'Total social media impressions',
          target: '+60% in 4 months',
          measurement: 'Social media analytics',
          weight: 0.2
        }
      ]
    },
    improve_reviews: {
      name: 'Improve Customer Reviews',
      description: 'Enhance review ratings and increase positive feedback volume',
      recommendationWeights: {
        priority: 0.4,
        effort: 0.2,
        impact: 0.3,
        timeframe: 0.1
      },
      keyMetrics: [
        {
          name: 'Average Rating',
          description: 'Overall review rating across platforms',
          target: '4.5+ stars',
          measurement: 'Review platform analytics',
          weight: 0.4
        },
        {
          name: 'Review Volume',
          description: 'Number of new reviews per month',
          target: '+100% monthly reviews',
          measurement: 'Review tracking systems',
          weight: 0.3
        },
        {
          name: 'Response Rate',
          description: 'Percentage of reviews responded to',
          target: '95% response rate',
          measurement: 'Manual tracking',
          weight: 0.2
        },
        {
          name: 'Sentiment Score',
          description: 'Positive sentiment in review text',
          target: '85% positive sentiment',
          measurement: 'Sentiment analysis tools',
          weight: 0.1
        }
      ]
    },
    boost_social_engagement: {
      name: 'Boost Social Media Engagement',
      description: 'Increase social media followers, likes, comments, and shares',
      recommendationWeights: {
        priority: 0.25,
        effort: 0.25,
        impact: 0.35,
        timeframe: 0.15
      },
      keyMetrics: [
        {
          name: 'Engagement Rate',
          description: 'Likes, comments, shares per post',
          target: '5%+ engagement rate',
          measurement: 'Social media analytics',
          weight: 0.35
        },
        {
          name: 'Follower Growth',
          description: 'New followers per month',
          target: '+20% monthly growth',
          measurement: 'Platform analytics',
          weight: 0.25
        },
        {
          name: 'Content Reach',
          description: 'People reached by posts',
          target: '+50% reach increase',
          measurement: 'Platform insights',
          weight: 0.25
        },
        {
          name: 'User-Generated Content',
          description: 'Customer posts featuring business',
          target: '10+ UGC posts/month',
          measurement: 'Social listening tools',
          weight: 0.15
        }
      ]
    },
    enhance_local_seo: {
      name: 'Enhance Local SEO',
      description: 'Improve local search rankings and online directory presence',
      recommendationWeights: {
        priority: 0.35,
        effort: 0.3,
        impact: 0.3,
        timeframe: 0.05
      },
      keyMetrics: [
        {
          name: 'Local Pack Rankings',
          description: 'Position in Google Local Pack',
          target: 'Top 3 for main keywords',
          measurement: 'Local SEO tools',
          weight: 0.4
        },
        {
          name: 'NAP Consistency',
          description: 'Name, Address, Phone consistency',
          target: '100% consistency',
          measurement: 'Citation audit tools',
          weight: 0.25
        },
        {
          name: 'Local Citations',
          description: 'Business listings in directories',
          target: '50+ quality citations',
          measurement: 'Citation tracking',
          weight: 0.2
        },
        {
          name: 'Local Keywords',
          description: 'Rankings for location-based terms',
          target: 'Top 5 for 10+ keywords',
          measurement: 'Keyword tracking tools',
          weight: 0.15
        }
      ]
    },
    drive_foot_traffic: {
      name: 'Drive Foot Traffic',
      description: 'Increase physical visits and in-store customer volume',
      recommendationWeights: {
        priority: 0.4,
        effort: 0.2,
        impact: 0.35,
        timeframe: 0.05
      },
      keyMetrics: [
        {
          name: 'Daily Visitors',
          description: 'Average daily foot traffic',
          target: '+30% daily visitors',
          measurement: 'Foot traffic counters',
          weight: 0.4
        },
        {
          name: 'Direction Requests',
          description: 'Google Maps direction requests',
          target: '+50% direction requests',
          measurement: 'Google My Business',
          weight: 0.25
        },
        {
          name: 'Local Event Attendance',
          description: 'Participation in local events',
          target: '2+ events per month',
          measurement: 'Event tracking',
          weight: 0.2
        },
        {
          name: 'Referral Traffic',
          description: 'Customers from referrals',
          target: '+25% referral customers',
          measurement: 'Customer surveys',
          weight: 0.15
        }
      ]
    },
    increase_online_orders: {
      name: 'Increase Online Orders',
      description: 'Boost delivery and takeout orders through digital channels',
      recommendationWeights: {
        priority: 0.45,
        effort: 0.15,
        impact: 0.35,
        timeframe: 0.05
      },
      keyMetrics: [
        {
          name: 'Online Order Volume',
          description: 'Monthly online orders',
          target: '+75% online orders',
          measurement: 'POS system data',
          weight: 0.4
        },
        {
          name: 'Average Order Value',
          description: 'Average online order amount',
          target: '+20% order value',
          measurement: 'Order analytics',
          weight: 0.3
        },
        {
          name: 'Conversion Rate',
          description: 'Website visitors to orders',
          target: '5%+ conversion rate',
          measurement: 'E-commerce analytics',
          weight: 0.2
        },
        {
          name: 'Platform Presence',
          description: 'Active on delivery platforms',
          target: '3+ delivery platforms',
          measurement: 'Platform analytics',
          weight: 0.1
        }
      ]
    },
    build_brand_awareness: {
      name: 'Build Brand Awareness',
      description: 'Increase brand recognition and recall in target market',
      recommendationWeights: {
        priority: 0.2,
        effort: 0.3,
        impact: 0.3,
        timeframe: 0.2
      },
      keyMetrics: [
        {
          name: 'Brand Mentions',
          description: 'Online mentions of business name',
          target: '+100% brand mentions',
          measurement: 'Social listening tools',
          weight: 0.3
        },
        {
          name: 'Direct Traffic',
          description: 'Website visitors typing URL',
          target: '+50% direct traffic',
          measurement: 'Google Analytics',
          weight: 0.25
        },
        {
          name: 'Brand Search Volume',
          description: 'Searches for business name',
          target: '+80% brand searches',
          measurement: 'Google Search Console',
          weight: 0.25
        },
        {
          name: 'Social Share of Voice',
          description: 'Brand mentions vs competitors',
          target: '15%+ share of voice',
          measurement: 'Competitive analysis',
          weight: 0.2
        }
      ]
    },
    competitive_positioning: {
      name: 'Competitive Positioning',
      description: 'Differentiate from competitors and capture market share',
      recommendationWeights: {
        priority: 0.3,
        effort: 0.25,
        impact: 0.35,
        timeframe: 0.1
      },
      keyMetrics: [
        {
          name: 'Market Share',
          description: 'Share of local market',
          target: '+5% market share',
          measurement: 'Market research',
          weight: 0.35
        },
        {
          name: 'Competitive Visibility',
          description: 'Visibility vs top competitors',
          target: 'Top 3 in local market',
          measurement: 'Competitive analysis',
          weight: 0.3
        },
        {
          name: 'Unique Value Proposition',
          description: 'Differentiation clarity',
          target: 'Clear UVP communication',
          measurement: 'Brand audit',
          weight: 0.2
        },
        {
          name: 'Customer Preference',
          description: 'Preference over competitors',
          target: '60%+ preference rate',
          measurement: 'Customer surveys',
          weight: 0.15
        }
      ]
    },
    cost_optimization: {
      name: 'Cost Optimization',
      description: 'Reduce marketing costs while maintaining or improving results',
      recommendationWeights: {
        priority: 0.35,
        effort: 0.25,
        impact: 0.35,
        timeframe: 0.05
      },
      keyMetrics: [
        {
          name: 'Cost Per Acquisition',
          description: 'Cost to acquire new customer',
          target: '-30% acquisition cost',
          measurement: 'Marketing analytics',
          weight: 0.4
        },
        {
          name: 'Marketing ROI',
          description: 'Return on marketing investment',
          target: '400%+ marketing ROI',
          measurement: 'Revenue attribution',
          weight: 0.3
        },
        {
          name: 'Organic Traffic Share',
          description: 'Percentage of organic traffic',
          target: '70%+ organic traffic',
          measurement: 'Google Analytics',
          weight: 0.2
        },
        {
          name: 'Automation Level',
          description: 'Automated marketing processes',
          target: '80%+ automation',
          measurement: 'Process audit',
          weight: 0.1
        }
      ]
    },
    customer_retention: {
      name: 'Customer Retention',
      description: 'Increase repeat customers and customer lifetime value',
      recommendationWeights: {
        priority: 0.4,
        effort: 0.2,
        impact: 0.35,
        timeframe: 0.05
      },
      keyMetrics: [
        {
          name: 'Repeat Customer Rate',
          description: 'Percentage of returning customers',
          target: '60%+ repeat customers',
          measurement: 'POS system data',
          weight: 0.35
        },
        {
          name: 'Customer Lifetime Value',
          description: 'Average customer value over time',
          target: '+40% customer LTV',
          measurement: 'Customer analytics',
          weight: 0.3
        },
        {
          name: 'Loyalty Program Engagement',
          description: 'Active loyalty program members',
          target: '50%+ program participation',
          measurement: 'Loyalty system data',
          weight: 0.2
        },
        {
          name: 'Customer Satisfaction',
          description: 'Overall satisfaction score',
          target: '90%+ satisfaction',
          measurement: 'Customer surveys',
          weight: 0.15
        }
      ]
    },
    market_expansion: {
      name: 'Market Expansion',
      description: 'Enter new markets or customer segments',
      recommendationWeights: {
        priority: 0.25,
        effort: 0.35,
        impact: 0.3,
        timeframe: 0.1
      },
      keyMetrics: [
        {
          name: 'New Market Penetration',
          description: 'Customers from new segments',
          target: '25% from new markets',
          measurement: 'Customer analytics',
          weight: 0.35
        },
        {
          name: 'Geographic Reach',
          description: 'Service area expansion',
          target: '+50% service radius',
          measurement: 'Delivery analytics',
          weight: 0.25
        },
        {
          name: 'Demographic Diversity',
          description: 'Customer demographic spread',
          target: '3+ new demographics',
          measurement: 'Customer surveys',
          weight: 0.25
        },
        {
          name: 'Channel Expansion',
          description: 'New marketing channels',
          target: '2+ new channels',
          measurement: 'Channel performance',
          weight: 0.15
        }
      ]
    },
    operational_efficiency: {
      name: 'Operational Efficiency',
      description: 'Streamline operations and improve productivity',
      recommendationWeights: {
        priority: 0.3,
        effort: 0.3,
        impact: 0.3,
        timeframe: 0.1
      },
      keyMetrics: [
        {
          name: 'Order Processing Time',
          description: 'Time from order to delivery',
          target: '-25% processing time',
          measurement: 'POS system data',
          weight: 0.3
        },
        {
          name: 'Staff Productivity',
          description: 'Revenue per employee hour',
          target: '+20% productivity',
          measurement: 'HR analytics',
          weight: 0.25
        },
        {
          name: 'Inventory Turnover',
          description: 'Inventory rotation rate',
          target: '+30% turnover rate',
          measurement: 'Inventory systems',
          weight: 0.25
        },
        {
          name: 'Customer Wait Time',
          description: 'Average customer wait time',
          target: '-40% wait time',
          measurement: 'Queue management',
          weight: 0.2
        }
      ]
    }
  };

  /**
   * Create a goal profile based on business objectives and constraints
   */
  public createGoalProfile(request: RecommendationRequest): GoalProfile {
    const baseProfile = this.DEFAULT_PROFILES[request.primaryObjective];
    
    if (!baseProfile) {
      throw new Error(`No default profile found for objective: ${request.primaryObjective}`);
    }

    const profile: GoalProfile = {
      id: uuidv4(),
      name: baseProfile.name || 'Custom Goal Profile',
      description: baseProfile.description || 'Custom business objective profile',
      primaryObjective: request.primaryObjective,
      secondaryObjectives: request.objectives.filter(obj => obj !== request.primaryObjective),
      targetAudience: this.inferTargetAudience(request),
      keyMetrics: baseProfile.keyMetrics || [],
      recommendationWeights: baseProfile.recommendationWeights || {
        priority: 0.25,
        effort: 0.25,
        impact: 0.25,
        timeframe: 0.25
      },
      industryContext: this.inferIndustryContext(request),
      constraints: request.constraints,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true
    };

    return GoalProfileSchema.parse(profile);
  }

  /**
   * Infer target audience based on business profile and objectives
   */
  private inferTargetAudience(request: RecommendationRequest) {
    const businessCategory = request.businessProfile.category.toLowerCase();
    
    // Base demographics for restaurant businesses
    let demographics = ['local_residents', 'working_professionals'];
    let behaviors = ['dines_out_regularly', 'uses_online_ordering'];
    let preferences = ['quality_food', 'convenient_location'];

    // Customize based on business category
    if (businessCategory.includes('fast') || businessCategory.includes('quick')) {
      demographics.push('students', 'busy_families');
      behaviors.push('values_speed', 'price_conscious');
      preferences.push('quick_service', 'affordable_prices');
    } else if (businessCategory.includes('fine') || businessCategory.includes('upscale')) {
      demographics.push('affluent_professionals', 'special_occasion_diners');
      behaviors.push('values_experience', 'willing_to_pay_premium');
      preferences.push('high_quality', 'exceptional_service');
    } else if (businessCategory.includes('family')) {
      demographics.push('families_with_children', 'multi_generational_groups');
      behaviors.push('group_dining', 'kid_friendly_seeking');
      preferences.push('family_atmosphere', 'varied_menu');
    }

    // Customize based on primary objective
    switch (request.primaryObjective) {
      case 'increase_online_orders':
        behaviors.push('tech_savvy', 'prefers_delivery');
        preferences.push('online_convenience', 'mobile_ordering');
        break;
      case 'boost_social_engagement':
        demographics.push('millennials', 'gen_z');
        behaviors.push('social_media_active', 'shares_experiences');
        preferences.push('instagram_worthy', 'trendy_atmosphere');
        break;
      case 'drive_foot_traffic':
        demographics.push('local_workers', 'neighborhood_residents');
        behaviors.push('walks_to_restaurants', 'spontaneous_dining');
        preferences.push('convenient_location', 'welcoming_atmosphere');
        break;
    }

    return {
      demographics,
      behaviors,
      preferences
    };
  }

  /**
   * Infer industry context based on business profile
   */
  private inferIndustryContext(request: RecommendationRequest) {
    const businessSize = request.businessProfile.size;
    let marketSize: 'local' | 'regional' | 'national' | 'international' = 'local';
    let competitionLevel: 'low' | 'medium' | 'high' | 'intense' = 'medium';

    // Determine market size based on business size
    switch (businessSize) {
      case 'small':
        marketSize = 'local';
        break;
      case 'medium':
        marketSize = 'regional';
        break;
      case 'large':
        marketSize = 'regional';
        break;
      case 'enterprise':
        marketSize = 'national';
        break;
    }

    // Estimate competition level based on location and category
    const category = request.businessProfile.category.toLowerCase();
    if (category.includes('pizza') || category.includes('burger') || category.includes('coffee')) {
      competitionLevel = 'intense';
    } else if (category.includes('ethnic') || category.includes('specialty')) {
      competitionLevel = 'medium';
    } else if (category.includes('fine') || category.includes('unique')) {
      competitionLevel = 'low';
    }

    return {
      sector: 'food_service',
      businessModel: this.inferBusinessModel(request.businessProfile.category),
      marketSize,
      competitionLevel
    };
  }

  /**
   * Infer business model based on category
   */
  private inferBusinessModel(category: string): string {
    const lowerCategory = category.toLowerCase();
    
    if (lowerCategory.includes('fast') || lowerCategory.includes('quick')) {
      return 'quick_service_restaurant';
    } else if (lowerCategory.includes('casual')) {
      return 'casual_dining';
    } else if (lowerCategory.includes('fine') || lowerCategory.includes('upscale')) {
      return 'fine_dining';
    } else if (lowerCategory.includes('cafe') || lowerCategory.includes('coffee')) {
      return 'cafe_coffee_shop';
    } else if (lowerCategory.includes('bar') || lowerCategory.includes('pub')) {
      return 'bar_pub';
    } else {
      return 'full_service_restaurant';
    }
  }

  /**
   * Update goal profile based on performance data
   */
  public updateGoalProfile(
    profile: GoalProfile, 
    performanceData: Record<string, number>
  ): GoalProfile {
    // Adjust weights based on what's working
    const updatedWeights = { ...profile.recommendationWeights };
    
    // If high-impact recommendations are performing well, increase impact weight
    if (performanceData.highImpactSuccess > 0.7) {
      updatedWeights.impact = Math.min(updatedWeights.impact + 0.1, 1);
      updatedWeights.effort = Math.max(updatedWeights.effort - 0.05, 0);
    }
    
    // If quick wins are successful, increase priority weight
    if (performanceData.quickWinSuccess > 0.8) {
      updatedWeights.priority = Math.min(updatedWeights.priority + 0.1, 1);
      updatedWeights.timeframe = Math.max(updatedWeights.timeframe - 0.05, 0);
    }

    return {
      ...profile,
      recommendationWeights: updatedWeights,
      updatedAt: new Date().toISOString()
    };
  }
}