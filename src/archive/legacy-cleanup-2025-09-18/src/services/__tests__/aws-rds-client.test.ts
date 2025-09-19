import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock localStorage for testing
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

// Mock the AwsRdsClient class
const mockRdsClient = {
  query: jest.fn(),
  queryOne: jest.fn(),
  transaction: jest.fn(),
  executeQuery: jest.fn(),
  mapRecord: jest.fn(),
  testConnection: jest.fn(),
};

jest.mock('../aws-rds-client', () => ({
  AwsRdsClient: jest.fn().mockImplementation(() => mockRdsClient),
  rdsClient: mockRdsClient
}));

// Import after mock
import { AwsRdsClient } from '../aws-rds-client';

describe('AwsRdsClient', () => {
  let rdsClient: any;

  beforeEach(() => {
    rdsClient = new AwsRdsClient();
    
    // Reset all mocks
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
    mockLocalStorage.removeItem.mockClear();
    mockLocalStorage.clear.mockClear();
    
    // Setup default mock implementations
    mockRdsClient.query.mockImplementation(async (sql: string, params: any[] = []) => {
      try {
        if (sql.includes('SELECT') && sql.includes('profiles')) {
          const userId = params[0];
          const stored = mockLocalStorage.getItem(`profile_${userId}`);
          return stored ? [JSON.parse(stored)] : [];
        }
        
        if (sql.includes('INSERT') && sql.includes('profiles')) {
          const profileData = {
            id: params[0],
            user_id: params[1],
            company_name: params[2],
            address: params[3],
            phone: params[4],
            website: params[5],
            description: params[6],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          mockLocalStorage.setItem(`profile_${params[1]}`, JSON.stringify(profileData));
          return [profileData];
        }
        
        if (sql.includes('UPDATE') && sql.includes('profiles')) {
          const userId = params[params.length - 1];
          const stored = mockLocalStorage.getItem(`profile_${userId}`);
          if (stored) {
            const existing = JSON.parse(stored);
            const updated = { ...existing, updated_at: new Date().toISOString() };
            mockLocalStorage.setItem(`profile_${userId}`, JSON.stringify(updated));
            return [updated];
          }
        }
        
        return [];
      } catch (error) {
        throw new Error(`Database query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
    
    mockRdsClient.queryOne.mockImplementation(async (sql: string, params: any[] = []) => {
      const results = await mockRdsClient.query(sql, params);
      return results.length > 0 ? results[0] : null;
    });
    
    mockRdsClient.transaction.mockImplementation(async (callback: Function) => {
      return await callback(rdsClient);
    });
  });

  describe('Query Execution', () => {
    it('should execute SELECT query for profiles successfully', async () => {
      const testProfile = {
        id: '1',
        user_id: 'test-user',
        company_name: 'Test Restaurant',
        created_at: '2024-01-01T00:00:00Z'
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(testProfile));

      const result = await rdsClient.query(
        'SELECT * FROM profiles WHERE user_id = ?',
        ['test-user']
      );

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('profile_test-user');
      expect(result).toEqual([testProfile]);
    });

    it('should execute INSERT query for profiles successfully', async () => {
      const result = await rdsClient.query(
        'INSERT INTO profiles (id, user_id, company_name, address, phone, website, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['1', 'new-user', 'New Restaurant', '123 Main St', '555-0123', 'https://example.com', 'A great restaurant']
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: '1',
        user_id: 'new-user',
        company_name: 'New Restaurant',
        address: '123 Main St',
        phone: '555-0123',
        website: 'https://example.com',
        description: 'A great restaurant'
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'profile_new-user',
        expect.stringContaining('"user_id":"new-user"')
      );
    });

    it('should execute UPDATE query for profiles successfully', async () => {
      const existingProfile = {
        id: '1',
        user_id: 'update-user',
        company_name: 'Old Name',
        created_at: '2024-01-01T00:00:00Z'
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingProfile));

      const result = await rdsClient.query(
        'UPDATE profiles SET company_name = ? WHERE user_id = ?',
        ['Updated Name', 'update-user']
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        user_id: 'update-user',
        updated_at: expect.any(String)
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'profile_update-user',
        expect.stringContaining('"updated_at"')
      );
    });

    it('should handle queries with no results', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = await rdsClient.query(
        'SELECT * FROM profiles WHERE user_id = ?',
        ['nonexistent-user']
      );

      expect(result).toEqual([]);
    });

    it('should handle non-profile queries', async () => {
      const result = await rdsClient.query(
        'SELECT * FROM other_table WHERE id = ?',
        ['1']
      );

      expect(result).toEqual([]);
    });
  });

  describe('Single Query Execution', () => {
    it('should execute queryOne and return single result', async () => {
      const testProfile = {
        id: '1',
        user_id: 'test-user',
        company_name: 'Test Restaurant'
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(testProfile));

      const result = await rdsClient.queryOne(
        'SELECT * FROM profiles WHERE user_id = ?',
        ['test-user']
      );

      expect(result).toEqual(testProfile);
    });

    it('should return null when no results found', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = await rdsClient.queryOne(
        'SELECT * FROM profiles WHERE user_id = ?',
        ['nonexistent-user']
      );

      expect(result).toBeNull();
    });
  });

  describe('Transaction Management', () => {
    it('should execute transaction callback successfully', async () => {
      const testCallback = jest.fn().mockResolvedValue('success');

      const result = await rdsClient.transaction(testCallback);

      expect(testCallback).toHaveBeenCalledWith(rdsClient);
      expect(result).toBe('success');
    });

    it('should handle transaction callback errors', async () => {
      const testError = new Error('Transaction failed');
      const testCallback = jest.fn().mockRejectedValue(testError);

      await expect(rdsClient.transaction(testCallback)).rejects.toThrow('Transaction failed');
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', async () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      await expect(
        rdsClient.query('SELECT * FROM profiles WHERE user_id = ?', ['test-user'])
      ).rejects.toThrow('Database query failed: Storage error');
    });

    it('should handle JSON parsing errors', async () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json');

      await expect(
        rdsClient.query('SELECT * FROM profiles WHERE user_id = ?', ['test-user'])
      ).rejects.toThrow('Database query failed');
    });
  });
});