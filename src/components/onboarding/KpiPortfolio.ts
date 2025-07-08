export interface KpiOption {
  key: string;
  label: {
    de: string;
    en: string;
  };
  unit?: string;
  category: 'financial' | 'operational' | 'marketing' | 'customer';
}

export const KPI_PORTFOLIO: KpiOption[] = [
  // Financial KPIs
  {
    key: 'average_check_amount',
    label: {
      de: 'Durchschnittlicher Bon',
      en: 'Average Check Amount'
    },
    unit: '€',
    category: 'financial'
  },
  {
    key: 'daily_revenue',
    label: {
      de: 'Tagesumsatz',
      en: 'Daily Revenue'
    },
    unit: '€',
    category: 'financial'
  },
  {
    key: 'monthly_revenue',
    label: {
      de: 'Monatsumsatz',
      en: 'Monthly Revenue'
    },
    unit: '€',
    category: 'financial'
  },
  {
    key: 'profit_margin',
    label: {
      de: 'Gewinnmarge',
      en: 'Profit Margin'
    },
    unit: '%',
    category: 'financial'
  },
  
  // Operational KPIs
  {
    key: 'table_turnover_rate',
    label: {
      de: 'Tischrotation',
      en: 'Table Turnover Rate'
    },
    unit: 'x',
    category: 'operational'
  },
  {
    key: 'average_service_time',
    label: {
      de: 'Durchschnittliche Servicezeit',
      en: 'Average Service Time'
    },
    unit: 'min',
    category: 'operational'
  },
  {
    key: 'occupancy_rate',
    label: {
      de: 'Auslastungsgrad',
      en: 'Occupancy Rate'
    },
    unit: '%',
    category: 'operational'
  },
  {
    key: 'covers_per_day',
    label: {
      de: 'Gedecke pro Tag',
      en: 'Covers per Day'
    },
    category: 'operational'
  },
  
  // Marketing KPIs
  {
    key: 'reservation_rate',
    label: {
      de: 'Reservierungsrate',
      en: 'Reservation Rate'
    },
    unit: '%',
    category: 'marketing'
  },
  {
    key: 'online_reviews_count',
    label: {
      de: 'Online-Bewertungen',
      en: 'Online Reviews Count'
    },
    category: 'marketing'
  },
  {
    key: 'social_media_engagement',
    label: {
      de: 'Social Media Engagement',
      en: 'Social Media Engagement'
    },
    unit: '%',
    category: 'marketing'
  },
  {
    key: 'website_visitors',
    label: {
      de: 'Website-Besucher',
      en: 'Website Visitors'
    },
    category: 'marketing'
  },
  
  // Customer KPIs
  {
    key: 'customer_satisfaction',
    label: {
      de: 'Kundenzufriedenheit',
      en: 'Customer Satisfaction'
    },
    unit: '/5',
    category: 'customer'
  },
  {
    key: 'repeat_customer_rate',
    label: {
      de: 'Stammkundenrate',
      en: 'Repeat Customer Rate'
    },
    unit: '%',
    category: 'customer'
  },
  {
    key: 'customer_acquisition_cost',
    label: {
      de: 'Kundenakquisitionskosten',
      en: 'Customer Acquisition Cost'
    },
    unit: '€',
    category: 'customer'
  },
  {
    key: 'average_wait_time',
    label: {
      de: 'Durchschnittliche Wartezeit',
      en: 'Average Wait Time'
    },
    unit: 'min',
    category: 'customer'
  }
];