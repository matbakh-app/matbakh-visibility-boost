import { ConsentEnforcementEngine } from '../consent-enforcement-engine';
import { ConsentDatabase } from '../consent-database';
import { ConsentCache } from '../consent-cache';
import { 
  ConsentVerificationRequest, 
  ConsentEnforcementConfig, 
  ConsentRecord,
  ConsentType 
} from '../types';

// Mock dependencies
jest.mock('../consent-database');
jest.mock('../consent-cache');

const MockedConsentDatabase = ConsentDatabase as jest.MockedClass<typeof ConsentDatabase>;
const MockedConsentCache = ConsentCache as jest.MockedClass<typeof ConsentCache>;

describe('ConsentEnforcementEngine', () => {
  let engine: ConsentEnforcementEngine;
  let mockDatabase: jest.Mocked<ConsentDatabase>;
  let mockCache: jest.Mocked<ConsentCache>;
  let config: ConsentEnforcementConfig;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock instances
    mockDatabase = new MockedConsentDatabase() as jest.Mocked<ConsentDatabase>;
    mockCache = new MockedConsentCache() as jest.Mocked<ConsentCache>;

    // Default configuration
    config = {
      strictMode: false,
      defaultExpirationDays: 365,
      gracePeriodDays: 30,
      cacheExpirationSeconds: 300,
      requiredConsentsPerOperation: {
        upload: ['upload', 'data_storage'],
        analysis: ['vc', 'ai_processing'],
        processing: ['ai_processing', 'data_storage'],
        storage: ['data_storage'],
        sharing: ['third_party_sharing']
      }
    };

    // Create engine
    engine = new ConsentEnforcementEngine(mockDatabase, mockCache, config);
  });

  describe('verifyConsent', () => {
    it('should return cached result when available', async () => {
      const request: ConsentVerificationRequest = {
        userId: 'user-123',
        consentTypes: ['upload'],
        operation: 'upload'
      };

      const cachedResult = {
        isValid: true,
        missingConsents: [],
        expiredConsents: [],
        consentDetails: [],
        requiresRenewal: false,
        message: 'All consents valid'
      };

      mockCache.get.mockResolvedValue(cachedResult);
      mockDatabase.storeAuditLog.mockResolvedValue();

      const result = await engine.verifyConsent(request);

      expect(result).toEqual(cachedResult);
      expect(mockCache.get).toHaveBeenCalledWith('user-123', undefined, ['upload']);
      expect(mockDatabase.getConsentRecords).not.toHaveBeenCalled();
    });

    it('should verify consent from database when cache miss', async () => {
      const request: ConsentVerificationRequest = {
        userId: 'user-123',
        consentTypes: ['upload'],
        operation: 'upload'
      };

      const consentRecord: ConsentRecord = {
        id: 'consent-123',
        userId: 'user-123',
        consentType: 'upload',
        consentGiven: true,
        version: '1.0',
        createdAt: new Date(),
        updatedAt: new Date(),
        meta: {}
      };

      mockCache.get.mockResolvedValue(null);
      mockDatabase.getConsentRecords.mockResolvedValue([consentRecord]);
      mockCache.set.mockResolvedValue();
      mockDatabase.storeAuditLog.mockResolvedValue();

      const result = await engine.verifyConsent(request);

      expect(result.isValid).toBe(true);
      expect(result.missingConsents).toEqual([]);
      expect(mockDatabase.getConsentRecords).toHaveBeenCalledWith('user-123', undefined, ['upload', 'data_storage']);
    });

    it('should deny access when required consent is missing', async () => {
      const request: ConsentVerificationRequest = {
        userId: 'user-123',
        consentTypes: ['upload'],
        operation: 'upload'
      };

      mockCache.get.mockResolvedValue(null);
      mockDatabase.getConsentRecords.mockResolvedValue([]); // No consent records
      mockCache.set.mockResolvedValue();
      mockDatabase.storeAuditLog.mockResolvedValue();

      const result = await engine.verifyConsent(request);

      expect(result.isValid).toBe(false);
      expect(result.missingConsents).toEqual(['upload', 'data_storage']);
      expect(result.message).toContain('Missing consents');
    });

    it('should deny access when consent is withdrawn', async () => {
      const request: ConsentVerificationRequest = {
        userId: 'user-123',
        consentTypes: ['upload'],
        operation: 'upload'
      };

      const withdrawnConsent: ConsentRecord = {
        id: 'consent-123',
        userId: 'user-123',
        consentType: 'upload',
        consentGiven: false, // Consent withdrawn
        version: '1.0',
        createdAt: new Date(),
        updatedAt: new Date(),
        meta: {}
      };

      mockCache.get.mockResolvedValue(null);
      mockDatabase.getConsentRecords.mockResolvedValue([withdrawnConsent]);
      mockCache.set.mockResolvedValue();
      mockDatabase.storeAuditLog.mockResolvedValue();

      const result = await engine.verifyConsent(request);

      expect(result.isValid).toBe(false);
      expect(result.missingConsents).toContain('upload');
    });

    it('should handle expired consent in strict mode', async () => {
      config.strictMode = true;
      engine = new ConsentEnforcementEngine(mockDatabase, mockCache, config);

      const request: ConsentVerificationRequest = {
        userId: 'user-123',
        consentTypes: ['upload'],
        operation: 'upload'
      };

      const expiredConsent: ConsentRecord = {
        id: 'consent-123',
        userId: 'user-123',
        consentType: 'upload',
        consentGiven: true,
        version: '1.0',
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expired yesterday
        createdAt: new Date(),
        updatedAt: new Date(),
        meta: {}
      };

      mockCache.get.mockResolvedValue(null);
      mockDatabase.getConsentRecords.mockResolvedValue([expiredConsent]);
      mockCache.set.mockResolvedValue();
      mockDatabase.storeAuditLog.mockResolvedValue();

      const result = await engine.verifyConsent(request);

      expect(result.isValid).toBe(false);
      expect(result.expiredConsents).toContain('upload');
    });

    it('should allow expired consent in non-strict mode with warning', async () => {
      config.strictMode = false;
      engine = new ConsentEnforcementEngine(mockDatabase, mockCache, config);

      const request: ConsentVerificationRequest = {
        userId: 'user-123',
        consentTypes: ['upload'],
        operation: 'upload'
      };

      const expiredConsent: ConsentRecord = {
        id: 'consent-123',
        userId: 'user-123',
        consentType: 'upload',
        consentGiven: true,
        version: '1.0',
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expired yesterday
        createdAt: new Date(),
        updatedAt: new Date(),
        meta: {}
      };

      const storageConsent: ConsentRecord = {
        id: 'consent-124',
        userId: 'user-123',
        consentType: 'data_storage',
        consentGiven: true,
        version: '1.0',
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expired yesterday
        createdAt: new Date(),
        updatedAt: new Date(),
        meta: {}
      };

      mockCache.get.mockResolvedValue(null);
      mockDatabase.getConsentRecords.mockResolvedValue([expiredConsent, storageConsent]);
      mockCache.set.mockResolvedValue();
      mockDatabase.storeAuditLog.mockResolvedValue();

      const result = await engine.verifyConsent(request);

      expect(result.isValid).toBe(true);
      expect(result.requiresRenewal).toBe(true);
      expect(result.message).toContain('non-strict mode');
    });

    it('should detect consent approaching expiration', async () => {
      const request: ConsentVerificationRequest = {
        userId: 'user-123',
        consentTypes: ['upload'],
        operation: 'upload'
      };

      const soonToExpireConsent: ConsentRecord = {
        id: 'consent-123',
        userId: 'user-123',
        consentType: 'upload',
        consentGiven: true,
        version: '1.0',
        expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // Expires in 15 days
        createdAt: new Date(),
        updatedAt: new Date(),
        meta: {}
      };

      const storageConsent: ConsentRecord = {
        id: 'consent-124',
        userId: 'user-123',
        consentType: 'data_storage',
        consentGiven: true,
        version: '1.0',
        createdAt: new Date(),
        updatedAt: new Date(),
        meta: {}
      };

      mockCache.get.mockResolvedValue(null);
      mockDatabase.getConsentRecords.mockResolvedValue([soonToExpireConsent, storageConsent]);
      mockCache.set.mockResolvedValue();
      mockDatabase.storeAuditLog.mockResolvedValue();

      const result = await engine.verifyConsent(request);

      expect(result.isValid).toBe(true);
      expect(result.requiresRenewal).toBe(true);
      expect(result.message).toContain('renewal recommended');
    });
  });

  describe('storeConsent', () => {
    it('should store new consent and invalidate cache', async () => {
      const consentId = 'consent-123';
      
      mockDatabase.storeConsent.mockResolvedValue(consentId);
      mockCache.invalidate.mockResolvedValue();
      mockDatabase.storeAuditLog.mockResolvedValue();

      const result = await engine.storeConsent(
        'user-123',
        '192.168.1.1',
        'Mozilla/5.0',
        'upload',
        true,
        '1.0',
        365,
        { source: 'test' }
      );

      expect(result).toBe(consentId);
      expect(mockDatabase.storeConsent).toHaveBeenCalledWith(
        'user-123',
        '192.168.1.1',
        'Mozilla/5.0',
        'upload',
        true,
        '1.0',
        expect.any(Date),
        { source: 'test' }
      );
      expect(mockCache.invalidate).toHaveBeenCalledWith('user-123', '192.168.1.1');
    });
  });

  describe('withdrawConsent', () => {
    it('should withdraw consent and invalidate cache', async () => {
      const existingConsent: ConsentRecord = {
        id: 'consent-123',
        userId: 'user-123',
        consentType: 'upload',
        consentGiven: true,
        version: '1.0',
        createdAt: new Date(),
        updatedAt: new Date(),
        meta: {}
      };

      mockDatabase.getConsentRecords.mockResolvedValue([existingConsent]);
      mockDatabase.updateConsent.mockResolvedValue();
      mockCache.invalidate.mockResolvedValue();
      mockDatabase.storeAuditLog.mockResolvedValue();

      await engine.withdrawConsent('user-123', 'upload', 'User requested');

      expect(mockDatabase.updateConsent).toHaveBeenCalledWith(
        'consent-123',
        false,
        '1.0',
        undefined,
        expect.objectContaining({
          withdrawalReason: 'User requested',
          withdrawnAt: expect.any(String)
        })
      );
      expect(mockCache.invalidate).toHaveBeenCalledWith('user-123');
    });

    it('should throw error when no consent record exists', async () => {
      mockDatabase.getConsentRecords.mockResolvedValue([]);

      await expect(
        engine.withdrawConsent('user-123', 'upload', 'User requested')
      ).rejects.toThrow('No consent record found for type: upload');
    });
  });

  describe('getConsentStatus', () => {
    it('should return consent status with renewal flags', async () => {
      const consents: ConsentRecord[] = [
        {
          id: 'consent-123',
          userId: 'user-123',
          consentType: 'upload',
          consentGiven: true,
          version: '1.0',
          expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days
          createdAt: new Date(),
          updatedAt: new Date(),
          meta: {}
        },
        {
          id: 'consent-124',
          userId: 'user-123',
          consentType: 'analytics',
          consentGiven: false,
          version: '1.0',
          createdAt: new Date(),
          updatedAt: new Date(),
          meta: {}
        }
      ];

      mockDatabase.getConsentRecords.mockResolvedValue(consents);

      const result = await engine.getConsentStatus('user-123');

      expect(result.consents).toEqual(consents);
      expect(result.summary.upload.given).toBe(true);
      expect(result.summary.upload.requiresRenewal).toBe(true);
      expect(result.summary.analytics.given).toBe(false);
      expect(result.summary.analytics.requiresRenewal).toBe(false);
    });
  });
});