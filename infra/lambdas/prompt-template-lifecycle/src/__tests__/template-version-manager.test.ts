/**
 * @jest-environment node
 */

import { TemplateVersionManager } from '../template-version-manager';

// Use global mockSend and helpers from setup
const mockSend = (global as any).mockSend;
const createMockDynamoResponse = (global as any).createMockDynamoResponse;
const createMockDynamoListResponse = (global as any).createMockDynamoListResponse;
const createMockDynamoEmptyResponse = (global as any).createMockDynamoEmptyResponse;
const createMockDynamoNullResponse = (global as any).createMockDynamoNullResponse;

describe('TemplateVersionManager', () => {
  let manager: TemplateVersionManager;

  beforeEach(() => {
    manager = new TemplateVersionManager();
    mockSend.mockClear();
  });

  describe('createTemplate', () => {
    it('should create a new template with initial version', async () => {
      const templateData = {
        name: 'Test Template',
        description: 'A test template',
        content: 'Hello {{name}}!',
        variables: [
          {
            name: 'name',
            type: 'string' as const,
            required: true,
            description: 'User name'
          }
        ],
        provider: 'claude' as const,
        category: 'generation' as const,
        tags: ['test'],
        metadata: {
          author: 'test-user',
          version: '1.0.0',
          changelog: 'Initial version',
          estimatedTokens: 50,
          complexity: 'low' as const,
          usageContext: ['testing']
        }
      };

      // Mock successful template creation
      mockSend.mockResolvedValueOnce(createMockDynamoEmptyResponse()); // PutCommand for template
      mockSend.mockResolvedValueOnce(createMockDynamoResponse({ ...templateData, id: 'template-123' })); // GetCommand for template
      mockSend.mockResolvedValueOnce(createMockDynamoListResponse([])); // QueryCommand for latest version
      mockSend.mockResolvedValueOnce(createMockDynamoEmptyResponse()); // PutCommand for version

      const result = await manager.createTemplate(templateData);

      expect(result).toMatchObject({
        name: 'Test Template',
        description: 'A test template',
        content: 'Hello {{name}}!',
        provider: 'claude',
        category: 'generation'
      });
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      expect(mockSend).toHaveBeenCalledTimes(4);
    });

    it('should throw error if template creation fails', async () => {
      const templateData = createMockTemplate();
      delete templateData.id;
      delete templateData.createdAt;
      delete templateData.updatedAt;

      mockSend.mockRejectedValueOnce(new Error('DynamoDB error'));

      await expect(manager.createTemplate(templateData)).rejects.toThrow('DynamoDB error');
    });
  });

  describe('createVersion', () => {
    it('should create a new version for existing template', async () => {
      const templateId = 'template-123';
      const versionData = {
        content: 'Updated content {{name}}!',
        variables: [
          {
            name: 'name',
            type: 'string' as const,
            required: true,
            description: 'User name'
          }
        ],
        metadata: {
          author: 'test-user',
          version: '1.1.0',
          changelog: 'Updated content',
          estimatedTokens: 60,
          complexity: 'low' as const,
          usageContext: ['testing']
        },
        environment: 'development' as const
      };

      // Mock template exists
      mockSend.mockResolvedValueOnce(createMockDynamoResponse(createMockTemplate()));
      // Mock latest version query
      mockSend.mockResolvedValueOnce(createMockDynamoListResponse([{ version: '1.0.0' }]));
      // Mock version creation
      mockSend.mockResolvedValueOnce(createMockDynamoEmptyResponse());

      const result = await manager.createVersion(templateId, versionData);

      expect(result).toMatchObject({
        templateId,
        content: 'Updated content {{name}}!',
        version: '1.0.1',
        status: 'draft',
        environment: 'development'
      });
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeDefined();
      expect(mockSend).toHaveBeenCalledTimes(3);
    });

    it('should throw error if template does not exist', async () => {
      const templateId = 'nonexistent-template';
      const versionData = {
        content: 'Test content',
        variables: [],
        metadata: {
          author: 'test-user',
          version: '1.0.0',
          changelog: 'Initial version',
          estimatedTokens: 50,
          complexity: 'low' as const,
          usageContext: ['testing']
        },
        environment: 'development' as const
      };

      mockSend.mockResolvedValueOnce(createMockDynamoNullResponse());

      await expect(manager.createVersion(templateId, versionData)).rejects.toThrow(
        `Template ${templateId} not found`
      );
    });
  });

  describe('getTemplate', () => {
    it('should return template if it exists', async () => {
      const templateId = 'template-123';
      const mockTemplate = mockTemplate();

      mockSend.mockResolvedValueOnce(createMockDynamoResponse(mockTemplate));

      const result = await manager.getTemplate(templateId);

      expect(result).toEqual(mockTemplate);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should return null if template does not exist', async () => {
      const templateId = 'nonexistent-template';

      mockSend.mockResolvedValueOnce(createMockDynamoNullResponse());

      const result = await manager.getTemplate(templateId);

      expect(result).toBeNull();
    });
  });

  describe('deployVersion', () => {
    it('should deploy approved version to target environment', async () => {
      const versionId = 'version-123';
      const targetEnvironment = 'production';
      const mockVersion = {
        ...createMockVersion(),
        status: 'approved'
      };

      // Mock get version
      mockSend.mockResolvedValueOnce(createMockDynamoResponse(mockVersion));
      // Mock update version
      mockSend.mockResolvedValueOnce(createMockDynamoEmptyResponse());
      // Mock deprecate previous versions query
      mockSend.mockResolvedValueOnce(createMockDynamoListResponse([]));

      await manager.deployVersion(versionId, targetEnvironment);

      expect(mockSend).toHaveBeenCalledTimes(3);
    });

    it('should throw error if version is not approved', async () => {
      const versionId = 'version-123';
      const targetEnvironment = 'production';
      const mockVersion = {
        ...createMockVersion(),
        status: 'draft'
      };

      mockSend.mockResolvedValueOnce(createMockDynamoResponse(mockVersion));

      await expect(manager.deployVersion(versionId, targetEnvironment)).rejects.toThrow(
        `Version ${versionId} is not approved for deployment`
      );
    });
  });

  describe('rollbackVersion', () => {
    it('should rollback to target version', async () => {
      const currentVersionId = 'version-current';
      const targetVersionId = 'version-target';
      const reason = 'Performance issues';
      const userId = 'admin-user';

      const currentVersion = {
        ...createMockVersion(),
        id: currentVersionId,
        templateId: 'template-123',
        environment: 'production'
      };

      const targetVersion = {
        ...createMockVersion(),
        id: targetVersionId,
        templateId: 'template-123',
        environment: 'production',
        status: 'approved' as const
      };

      // Mock get versions
      mockSend.mockResolvedValueOnce(createMockDynamoResponse(currentVersion));
      mockSend.mockResolvedValueOnce(createMockDynamoResponse(targetVersion));
      // Mock update current version with rollback info
      mockSend.mockResolvedValueOnce(createMockDynamoEmptyResponse());
      // Mock deploy target version
      mockSend.mockResolvedValueOnce(createMockDynamoResponse(targetVersion));
      mockSend.mockResolvedValueOnce(createMockDynamoEmptyResponse());
      mockSend.mockResolvedValueOnce(createMockDynamoListResponse([]));
      // Mock update rollback status
      mockSend.mockResolvedValueOnce(createMockDynamoEmptyResponse());

      await manager.rollbackVersion(currentVersionId, targetVersionId, reason, userId);

      expect(mockSend).toHaveBeenCalledTimes(7);
      // Verify rollback was initiated (business logic validation)
    });

    it('should throw error if versions belong to different templates', async () => {
      const currentVersionId = 'version-current';
      const targetVersionId = 'version-target';
      const reason = 'Test rollback';
      const userId = 'admin-user';

      const currentVersion = {
        ...createMockVersion(),
        id: currentVersionId,
        templateId: 'template-123'
      };

      const targetVersion = {
        ...createMockVersion(),
        id: targetVersionId,
        templateId: 'template-456'
      };

      mockSend.mockResolvedValueOnce(createMockDynamoResponse(currentVersion));
      mockSend.mockResolvedValueOnce(createMockDynamoResponse(targetVersion));

      await expect(
        manager.rollbackVersion(currentVersionId, targetVersionId, reason, userId)
      ).rejects.toThrow('Cannot rollback to version from different template');
    });
  });

  describe('getVersionsByTemplate', () => {
    it('should return all versions for a template', async () => {
      const templateId = 'template-123';
      const mockVersions = [
        { ...createMockVersion(), version: '1.0.0' },
        { ...createMockVersion(), version: '1.1.0' }
      ];

      mockSend.mockResolvedValueOnce(createMockDynamoListResponse(mockVersions));

      const result = await manager.getVersionsByTemplate(templateId);

      expect(result).toEqual(mockVersions);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });
});