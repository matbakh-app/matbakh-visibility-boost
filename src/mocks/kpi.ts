
export const kpiMocks: Record<string, { value: number | string; trend?: string }> = {
  // GMB KPIs
  impressions: { value: 1234, trend: '+15%' },
  ctr: { value: '4.2%', trend: '-0.3%' },
  profileViews: { value: 567, trend: '+8%' },
  calls: { value: 23, trend: '+12%' },
  websiteClicks: { value: 89, trend: '+5%' },
  directionsRequests: { value: 45, trend: '+18%' },
  photoViews: { value: 890, trend: '+22%' },
  postViews: { value: 156, trend: '+9%' },
  
  // GA4 KPIs
  sessions: { value: 2340, trend: '+7%' },
  bounceRate: { value: '58%', trend: '-3%' },
  avgSessionDuration: { value: '2:34', trend: '+12%' },
  pageViews: { value: 4567, trend: '+6%' },
  conversions: { value: 34, trend: '+25%' },
  conversionRate: { value: '1.45%', trend: '+18%' },
  newUsers: { value: 1890, trend: '+14%' },
  returningUsers: { value: 450, trend: '+3%' },
  
  // Social Media KPIs
  instagramFollowers: { value: 1542, trend: '+10%' },
  facebookLikes: { value: 756, trend: '-5%' },
  socialEngagement: { value: '3.8%', trend: '+12%' },
  socialShares: { value: 78, trend: '+25%' },
  tiktokFollowers: { value: 234, trend: '+45%' },
  
  // Additional KPIs
  visibility_score: { value: 87, trend: '+5%' },
  customer_satisfaction: { value: '4.2/5', trend: '+2%' },
  response_time: { value: '15 min', trend: '-20%' }
};
