import { generateTodos, type Todo } from '../todoGenerator';

describe('generateTodos', () => {
  describe('Google My Business Checks', () => {
    it('should create high priority todo for missing photos', () => {
      const analysis = { 
        google: { photos: [] },
        score: 85 
      };
      const { todos } = generateTodos(analysis, 'hospitality');
      
      expect(todos).toContainEqual(expect.objectContaining({
        type: 'Google: Fotos fehlen',
        priority: 'high'
      }));
    });

    it('should create high priority todo for missing hours', () => {
      const analysis = { 
        google: { hasHours: false },
        score: 85 
      };
      const { todos } = generateTodos(analysis, 'hospitality');
      
      expect(todos).toContainEqual(expect.objectContaining({
        type: 'Google: Öffnungszeiten fehlen',
        priority: 'high'
      }));
    });

    it('should create medium priority todo for incomplete profile', () => {
      const analysis = { 
        google: { profileComplete: false },
        score: 85 
      };
      const { todos } = generateTodos(analysis, 'hospitality');
      
      expect(todos).toContainEqual(expect.objectContaining({
        type: 'Google: Profil unvollständig',
        priority: 'medium'
      }));
    });
  });

  describe('Meta/Facebook Checks', () => {
    it('should create medium priority todo for disabled messenger', () => {
      const analysis = { 
        meta: { messenger_enabled: false },
        score: 85 
      };
      const { todos } = generateTodos(analysis, 'hospitality');
      
      expect(todos).toContainEqual(expect.objectContaining({
        type: 'Meta: Messenger nicht aktiviert',
        priority: 'medium'
      }));
    });

    it('should create medium priority todo for missing photos', () => {
      const analysis = { 
        meta: { hasPhotos: false },
        score: 85 
      };
      const { todos } = generateTodos(analysis, 'hospitality');
      
      expect(todos).toContainEqual(expect.objectContaining({
        type: 'Meta: Fehlende visuelle Inhalte',
        priority: 'medium'
      }));
    });
  });

  describe('Instagram Checks', () => {
    it('should create medium priority todo for missing business account', () => {
      const analysis = { 
        instagram: { hasProfile: false },
        score: 85 
      };
      const { todos } = generateTodos(analysis, 'hospitality');
      
      expect(todos).toContainEqual(expect.objectContaining({
        type: 'Instagram: Kein Business Account',
        priority: 'medium'
      }));
    });

    it('should create low priority todo for low follower count', () => {
      const analysis = { 
        instagram: { hasProfile: true, followerCount: 50 },
        score: 85 
      };
      const { todos } = generateTodos(analysis, 'hospitality');
      
      expect(todos).toContainEqual(expect.objectContaining({
        type: 'Instagram: Geringe Reichweite',
        priority: 'low'
      }));
    });

    it('should not create low follower todo for sufficient followers', () => {
      const analysis = { 
        instagram: { hasProfile: true, followerCount: 500 },
        score: 85 
      };
      const { todos } = generateTodos(analysis, 'hospitality');
      
      expect(todos).not.toContainEqual(expect.objectContaining({
        type: 'Instagram: Geringe Reichweite'
      }));
    });
  });

  describe('Industry-specific Checks', () => {
    describe('Hospitality', () => {
      it('should create high priority todo for missing reservation system', () => {
        const analysis = { 
          reservationAvailable: false,
          score: 85 
        };
        const { todos } = generateTodos(analysis, 'hospitality');
        
        expect(todos).toContainEqual(expect.objectContaining({
          type: 'Gastronomie: Online-Reservierung fehlt',
          priority: 'high'
        }));
      });

      it('should create high priority todo for low ratings', () => {
        const analysis = { 
          google: { rating: 3.5 },
          score: 85 
        };
        const { todos } = generateTodos(analysis, 'hospitality');
        
        expect(todos).toContainEqual(expect.objectContaining({
          type: 'Gastronomie: Bewertungen verbessern',
          priority: 'high'
        }));
      });

      it('should not create rating todo for good ratings', () => {
        const analysis = { 
          google: { rating: 4.5 },
          score: 85 
        };
        const { todos } = generateTodos(analysis, 'hospitality');
        
        expect(todos).not.toContainEqual(expect.objectContaining({
          type: 'Gastronomie: Bewertungen verbessern'
        }));
      });
    });

    describe('Retail', () => {
      it('should create high priority todo for missing online shop', () => {
        const analysis = { 
          hasOnlineShop: false,
          score: 85 
        };
        const { todos } = generateTodos(analysis, 'retail');
        
        expect(todos).toContainEqual(expect.objectContaining({
          type: 'Einzelhandel: Online-Shop fehlt',
          priority: 'high'
        }));
      });
    });
  });

  describe('Satisfaction Logic', () => {
    it('should return fully satisfied when no high priority todos and score >= 80', () => {
      const analysis = { 
        google: { photos: ['photo1.jpg'], hasHours: true, profileComplete: true, rating: 4.5 },
        meta: { messenger_enabled: true, hasPhotos: true },
        instagram: { hasProfile: true, followerCount: 500 },
        reservationAvailable: true,
        score: 85 
      };
      const { todos, is_fully_satisfied } = generateTodos(analysis, 'hospitality');
      
      const highPriorityTodos = todos.filter(todo => todo.priority === 'high');
      expect(highPriorityTodos).toHaveLength(0);
      expect(is_fully_satisfied).toBe(true);
    });

    it('should return not satisfied when high priority todos exist', () => {
      const analysis = { 
        google: { photos: [] }, // Missing photos = high priority todo
        score: 85 
      };
      const { todos, is_fully_satisfied } = generateTodos(analysis, 'hospitality');
      
      const highPriorityTodos = todos.filter(todo => todo.priority === 'high');
      expect(highPriorityTodos.length).toBeGreaterThan(0);
      expect(is_fully_satisfied).toBe(false);
    });

    it('should return not satisfied when score < 80', () => {
      const analysis = { 
        google: { photos: ['photo1.jpg'], hasHours: true, profileComplete: true, rating: 4.5 },
        meta: { messenger_enabled: true, hasPhotos: true },
        instagram: { hasProfile: true, followerCount: 500 },
        reservationAvailable: true,
        score: 75 // Low score
      };
      const { todos, is_fully_satisfied } = generateTodos(analysis, 'hospitality');
      
      expect(is_fully_satisfied).toBe(false);
    });

    it('should handle missing score gracefully', () => {
      const analysis = { 
        google: { photos: ['photo1.jpg'], hasHours: true, profileComplete: true, rating: 4.5 },
        meta: { messenger_enabled: true, hasPhotos: true },
        instagram: { hasProfile: true, followerCount: 500 },
        reservationAvailable: true
        // No score provided
      };
      const { is_fully_satisfied } = generateTodos(analysis, 'hospitality');
      
      expect(is_fully_satisfied).toBe(false); // Should default to not satisfied when score is missing/0
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty analysis object', () => {
      const analysis = {};
      const { todos, is_fully_satisfied } = generateTodos(analysis, 'hospitality');
      
      expect(todos.length).toBeGreaterThan(0); // Should create todos for missing data
      expect(is_fully_satisfied).toBe(false);
    });

    it('should handle null/undefined analysis fields', () => {
      const analysis = { 
        google: null,
        meta: undefined,
        instagram: null,
        score: 0
      };
      const { todos, is_fully_satisfied } = generateTodos(analysis, 'hospitality');
      
      expect(todos.length).toBeGreaterThan(0);
      expect(is_fully_satisfied).toBe(false);
    });

    it('should handle unknown industry gracefully', () => {
      const analysis = { score: 85 };
      const { todos, is_fully_satisfied } = generateTodos(analysis, 'unknown_industry');
      
      // Should not throw and should still process general checks
      expect(todos).toBeDefined();
      expect(is_fully_satisfied).toBeDefined();
    });
  });

  describe('Todo Structure', () => {
    it('should return todos with correct structure', () => {
      const analysis = { google: { photos: [] } };
      const { todos } = generateTodos(analysis, 'hospitality');
      
      expect(todos.length).toBeGreaterThan(0);
      todos.forEach(todo => {
        expect(todo).toHaveProperty('type');
        expect(todo).toHaveProperty('priority');
        expect(todo).toHaveProperty('text');
        expect(todo).toHaveProperty('why');
        expect(['high', 'medium', 'low']).toContain(todo.priority);
      });
    });
  });
});