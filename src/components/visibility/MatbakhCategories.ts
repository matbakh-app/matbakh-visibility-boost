
export interface MatbakhCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'ambience' | 'dietary' | 'service' | 'accessibility' | 'experience';
  applicableFor: string[]; // GMB category IDs this applies to
}

export const MATBAKH_CATEGORIES: MatbakhCategory[] = [
  // Ambience & Location
  {
    id: 'outdoor_seating',
    name: 'Außenbereich',
    description: 'Terrasse, Biergarten oder Außenplätze',
    icon: '🌿',
    category: 'ambience',
    applicableFor: ['gcid:restaurant', 'gcid:cafe', 'gcid:bar']
  },
  {
    id: 'rooftop',
    name: 'Dachterrasse',
    description: 'Rooftop-Bar oder Dachterrasse',
    icon: '🏙️',
    category: 'ambience',
    applicableFor: ['gcid:restaurant', 'gcid:bar']
  },
  {
    id: 'waterfront',
    name: 'Wasserblick',
    description: 'Direkt am Wasser gelegen',
    icon: '🌊',
    category: 'ambience',
    applicableFor: ['gcid:restaurant', 'gcid:cafe']
  },
  {
    id: 'live_music',
    name: 'Live Musik',
    description: 'Regelmäßige Live-Auftritte',
    icon: '🎵',
    category: 'experience',
    applicableFor: ['gcid:restaurant', 'gcid:bar', 'gcid:cafe']
  },
  
  // Dietary Options
  {
    id: 'vegan_options',
    name: 'Vegane Optionen',
    description: 'Umfangreiche vegane Speisekarte',
    icon: '🌱',
    category: 'dietary',
    applicableFor: ['gcid:restaurant', 'gcid:cafe', 'gcid:fast_food']
  },
  {
    id: 'vegetarian_friendly',
    name: 'Vegetarierfreundlich',
    description: 'Große Auswahl vegetarischer Gerichte',
    icon: '🥗',
    category: 'dietary',
    applicableFor: ['gcid:restaurant', 'gcid:cafe']
  },
  {
    id: 'gluten_free',
    name: 'Glutenfrei',
    description: 'Glutenfreie Optionen verfügbar',
    icon: '🌾',
    category: 'dietary',
    applicableFor: ['gcid:restaurant', 'gcid:bakery', 'gcid:cafe']
  },
  {
    id: 'organic_focus',
    name: 'Bio-Fokus',
    description: 'Schwerpunkt auf biologische Zutaten',
    icon: '🌿',
    category: 'dietary',
    applicableFor: ['gcid:restaurant', 'gcid:cafe']
  },
  
  // Service Features
  {
    id: 'delivery',
    name: 'Lieferservice',
    description: 'Lieferung nach Hause',
    icon: '🚚',
    category: 'service',
    applicableFor: ['gcid:restaurant', 'gcid:fast_food', 'gcid:pizza']
  },
  {
    id: 'takeout',
    name: 'Abholung',
    description: 'Take-Away Service',
    icon: '🥡',
    category: 'service',
    applicableFor: ['gcid:restaurant', 'gcid:fast_food', 'gcid:cafe']
  },
  {
    id: 'catering',
    name: 'Catering',
    description: 'Event-Catering verfügbar',
    icon: '🍽️',
    category: 'service',
    applicableFor: ['gcid:restaurant']
  },
  {
    id: 'reservations',
    name: 'Online Reservierung',
    description: 'Tischreservierung online möglich',
    icon: '📅',
    category: 'service',
    applicableFor: ['gcid:restaurant']
  },
  
  // Accessibility & Convenience
  {
    id: 'wheelchair_accessible',
    name: 'Barrierefrei',
    description: 'Rollstuhlgerechter Zugang',
    icon: '♿',
    category: 'accessibility',
    applicableFor: ['gcid:restaurant', 'gcid:cafe', 'gcid:bar']
  },
  {
    id: 'parking_available',
    name: 'Parkplätze',
    description: 'Eigene Parkplätze vorhanden',
    icon: '🅿️',
    category: 'accessibility',
    applicableFor: ['gcid:restaurant', 'gcid:cafe']
  },
  {
    id: 'family_friendly',
    name: 'Familienfreundlich',
    description: 'Kinderfreundliche Ausstattung',
    icon: '👨‍👩‍👧‍👦',
    category: 'experience',
    applicableFor: ['gcid:restaurant', 'gcid:cafe']
  },
  {
    id: 'pet_friendly',
    name: 'Haustierfreundlich',
    description: 'Haustiere willkommen',
    icon: '🐕',
    category: 'experience',
    applicableFor: ['gcid:restaurant', 'gcid:cafe']
  },
  
  // Special Experiences
  {
    id: 'wine_bar',
    name: 'Weinbar',
    description: 'Umfangreiche Weinkarte',
    icon: '🍷',
    category: 'experience',
    applicableFor: ['gcid:restaurant', 'gcid:bar']
  },
  {
    id: 'craft_beer',
    name: 'Craft Beer',
    description: 'Spezialisiert auf Craft-Biere',
    icon: '🍺',
    category: 'experience',
    applicableFor: ['gcid:bar', 'gcid:restaurant']
  },
  {
    id: 'breakfast_all_day',
    name: 'Ganztags Frühstück',
    description: 'Frühstück rund um die Uhr',
    icon: '🥞',
    category: 'service',
    applicableFor: ['gcid:cafe', 'gcid:restaurant']
  },
  {
    id: 'late_night',
    name: 'Spätöffnung',
    description: 'Geöffnet bis spät in die Nacht',
    icon: '🌙',
    category: 'service',
    applicableFor: ['gcid:restaurant', 'gcid:bar']
  }
];

export const getCategoriesForGmbType = (gmbCategoryId: string): MatbakhCategory[] => {
  return MATBAKH_CATEGORIES.filter(cat => 
    cat.applicableFor.includes(gmbCategoryId)
  );
};

export const getCategoryById = (id: string): MatbakhCategory | undefined => {
  return MATBAKH_CATEGORIES.find(cat => cat.id === id);
};
