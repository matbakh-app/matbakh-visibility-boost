/**
 * Safe Archival System Tests
 * Comprehensive test suite for the safe archival system with backup,
 * rollback, and validation capabilities
 */

import { SafeArchivalSystem, ArchiveManifest, ArchivalOptions } from '../safe-archival-system';
import { LegacyComponent, ArchivalPlan } from '../legacy-component-detector';
import * as fs from 'fs/promises';
import * as path from 'path';
import { execSync } from 'child_process';

// Mock dependencies
jest.mock('fs/promises');
jest.mock('child_process');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockExecSync = execSync as jest.MockedFunction<typeof execSync>;

describe('SafeArchivalSystem', () => {
  const mockArchiveDir = 'src/archive/legacy-cleanup-2025-01-14';
  const mockTimestamp = '2025-01-14T10:00:00.000Z';

  const mockLegacyComponent: LegacyComponent = {
    path: 'src/components/legacy/OldComponent.tsx',
    origin: 'supabase',
    confidence: 0.9,
    markers: ['supabase', 'createClient'],
    dependencies: ['@supabase/supabase-js', './utils'],
    backendDependencies: [{
      type: 'database',
      name: 'supabase',
      isActive: true,
      migrationPath: 'src/services/aws-rds-client.ts'
    }],
    routeUsage: [{
      route: '/legacy/old',
      isActive: true,
      hasKiroAlternative: true,
      alternativeRoute: '/dashboard',
      usageCount: 5
    }],
    safeToArchive: true,
    archiveReason: 'Legacy component with Kiro alternative available',
    riskLevel: 'low',
    lastModified: new Date(mockTimestamp),
    fileSize: 1024
  };

  const mockArchivalPlan: ArchivalPlan = {
    components: [mockLegacyComponent],
    summary: {
      totalComponents: 1,
      safeToArchive: 1,
      requiresReview: 0,
      highRisk: 0
    },
    archiveGroups: {
      supabaseComponents: [mockLegacyComponent],
      lovableComponents: [],
      unknownComponents: []
    },
    backupPlan: {
      archiveDirectory: mockArchiveDir,
      timestamp: mockTimestamp,
      manifestFile: `${mockArchiveDir}/archive-manifest.json`,
      rollbackScript: `${mockArchiveDir}/rollback.sh`
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock file system operations
    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.copyFile.mockResolvedValue(undefined);
    mockFs.writeFile.mockResolvedValue(undefined);
    mockFs.readFile.mockResolvedValue('mock file content');
    mockFs.stat.mockResolvedValue({
      mtime: new Date(mockTimestamp),
      size: 1024
    } as any);
    mockFs.symlink.mockResolvedValue(undefined);
    mockFs.unlink.mockResolvedValue(undefined);
    
    // Mock command execution
    mockExecSync.mockReturnValue(Buffer.from('success'));
  });

  describe('executeArchival', () => {
    it('should execute complete archival process with default options', async () => {
      const result = await SafeArchivalSystem.executeArchival(mockArchivalPlan);

      expect(result).toBeDefined();
      expect(result.timestamp).toBe(mockTimestamp);
      expect(result.archiveDirectory).toBe(mockArchiveDir);
      expect(result.summary.archivedComponents).toBe(1);
      expect(result.components).toHaveLength(1);
      
      // Verify archive structure creation
      expect(mockFs.mkdir).toHaveBeenCalledWith(mockArchiveDir, { recursive: true });
      
      // Verify component archival
      expect(mockFs.copyFile).toHaveBeenCalledWith(
        mockLegacyComponent.path,
        expect.stringContaining(mockArchiveDir)
      );
      
      // Verify manifest creation
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('archive-manifest.json'),
        expect.any(String)
      );
    });

    it('should create symlinks when option is enabled', async () => {
      const options: Partial<ArchivalOptions> = {
        createSymlinks: true
      };

      await SafeArchivalSystem.executeArchival(mockArchivalPlan, options);

      expect(mockFs.symlink).toHaveBeenCalled();
    });

    it('should run validation checks when enabled', async () => {
      const options: Partial<ArchivalOptions> = {
        validateAfterArchive: true,
        testCommand: 'npm test'
      };

      await SafeArchivalSystem.executeArchival(mockArchivalPlan, options);

      expect(mockExecSync).toHaveBeenCalledWith('npx tsc --noEmit', { stdio: 'pipe' });
      expect(mockExecSync).toHaveBeenCalledWith('npm run build', { stdio: 'pipe' });
    });

    it('should generate rollback script when enabled', async () => {
      const options: Partial<ArchivalOptions> = {
        generateRollbackScript: true
      };

      await SafeArchivalSystem.executeArchival(mockArchivalPlan, options);

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('rollback.sh'),
        expect.stringContaining('#!/bin/bash')
      );
    });

    it('should process components in batches', async () => {
      const multiComponentPlan: ArchivalPlan = {
        ...mockArchivalPlan,
        components: [
          mockLegacyComponent,
          { ...mockLegacyComponent, path: 'src/components/legacy/Another.tsx' },
          { ...mockLegacyComponent, path: 'src/components/legacy/Third.tsx' }
        ],
        summary: {
          ...mockArchivalPlan.summary,
          totalComponents: 3,
          safeToArchive: 3
        }
      };

      const options: Partial<ArchivalOptions> = {
        batchSize: 2
      };

      await SafeArchivalSystem.executeArchival(multiComponentPlan, options);

      // Should process in 2 batches (2 + 1)
      expect(mockFs.copyFile).toHaveBeenCalledTimes(3);
    });

    it('should handle validation failure and rollback', async () => {
      mockExecSync.mockImplementationOnce(() => {
        throw new Error('Validation failed');
      });

      const options: Partial<ArchivalOptions> = {
        validateAfterArchive: true,
        testCommand: 'npm test'
      };

      await expect(
        SafeArchivalSystem.executeArchival(mockArchivalPlan, options)
      ).rejects.toThrow('Required validation check failed');
    });
  });

  describe('dependency resolution', () => {
    it('should resolve component dependencies correctly', async () => {
      const componentWithDeps: LegacyComponent = {
        ...mockLegacyComponent,
        dependencies: ['./utils', '@supabase/supabase-js'],
        backendDependencies: [{
          type: 'database',
          name: 'supabase',
          isActive: true,
          migrationPath: 'src/services/aws-rds-client.ts'
        }]
      };

      const plan: ArchivalPlan = {
        ...mockArchivalPlan,
        components: [componentWithDeps]
      };

      const result = await SafeArchivalSystem.executeArchival(plan);

      expect(result.dependencies).toBeDefined();
      expect(result.dependencies).toHaveLength(1);
      expect(result.dependencies[0].component).toBe(componentWithDeps.path);
      expect(result.dependencies[0].isResolved).toBe(true);
    });

    it('should detect unresolved dependencies', async () => {
      const componentWithUnresolvedDeps: LegacyComponent = {
        ...mockLegacyComponent,
        backendDependencies: [{
          type: 'database',
          name: 'legacy-db',
          isActive: true
          // No migrationPath
        }]
      };

      const plan: ArchivalPlan = {
        ...mockArchivalPlan,
        components: [componentWithUnresolvedDeps]
      };

      const result = await SafeArchivalSystem.executeArchival(plan);

      expect(result.dependencies[0].isResolved).toBe(false);
    });
  });

  describe('route redirectors', () => {
    it('should create route redirectors for legacy routes', async () => {
      const result = await SafeArchivalSystem.executeArchival(mockArchivalPlan);

      expect(result.routes).toBeDefined();
      expect(result.routes).toHaveLength(1);
      expect(result.routes[0].originalRoute).toBe('/legacy/old');
      expect(result.routes[0].redirectTo).toBe('/dashboard');
      expect(result.routes[0].fallbackEnabled).toBe(true);
    });

    it('should generate redirect configuration file', async () => {
      await SafeArchivalSystem.executeArchival(mockArchivalPlan);

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'redirect-config.json',
        expect.stringContaining('redirects')
      );
    });
  });

  describe('archive manifest', () => {
    it('should generate comprehensive archive manifest', async () => {
      const result = await SafeArchivalSystem.executeArchival(mockArchivalPlan);

      expect(result.timestamp).toBe(mockTimestamp);
      expect(result.archiveDirectory).toBe(mockArchiveDir);
      expect(result.version).toBe('1.0.0');
      expect(result.summary.totalComponents).toBe(1);
      expect(result.summary.archivedComponents).toBe(1);
      expect(result.components).toHaveLength(1);
      expect(result.dependencies).toBeDefined();
      expect(result.routes).toBeDefined();
      expect(result.rollbackInstructions).toHaveLength(6);
      expect(result.validationChecks).toBeDefined();
    });

    it('should include component checksums for integrity verification', async () => {
      const result = await SafeArchivalSystem.executeArchival(mockArchivalPlan);

      expect(result.components[0].checksum).toBeDefined();
      expect(result.components[0].checksum).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hash
    });

    it('should preserve original file metadata', async () => {
      const result = await SafeArchivalSystem.executeArchival(mockArchivalPlan);

      const component = result.components[0];
      expect(component.originalPath).toBe(mockLegacyComponent.path);
      expect(component.origin).toBe(mockLegacyComponent.origin);
      expect(component.riskLevel).toBe(mockLegacyComponent.riskLevel);
      expect(component.fileSize).toBe(mockLegacyComponent.fileSize);
      expect(component.lastModified).toBe(mockTimestamp);
    });
  });

  describe('rollback mechanism', () => {
    it('should create executable rollback script', async () => {
      await SafeArchivalSystem.executeArchival(mockArchivalPlan);

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('rollback.sh'),
        expect.stringContaining('#!/bin/bash')
      );
      
      expect(mockExecSync).toHaveBeenCalledWith(
        expect.stringContaining('chmod +x'),
        undefined
      );
    });

    it('should include component restoration commands in rollback script', async () => {
      await SafeArchivalSystem.executeArchival(mockArchivalPlan);

      const rollbackScriptCall = mockFs.writeFile.mock.calls.find(call => 
        call[0].toString().includes('rollback.sh')
      );
      
      expect(rollbackScriptCall).toBeDefined();
      const scriptContent = rollbackScriptCall![1] as string;
      expect(scriptContent).toContain('restore_component');
      expect(scriptContent).toContain(mockLegacyComponent.path);
    });

    it('should include validation checks in rollback script', async () => {
      await SafeArchivalSystem.executeArchival(mockArchivalPlan);

      const rollbackScriptCall = mockFs.writeFile.mock.calls.find(call => 
        call[0].toString().includes('rollback.sh')
      );
      
      const scriptContent = rollbackScriptCall![1] as string;
      expect(scriptContent).toContain('npx tsc --noEmit');
      expect(scriptContent).toContain('npm run build');
    });
  });

  describe('validation checks', () => {
    it('should run all required validation checks', async () => {
      await SafeArchivalSystem.executeArchival(mockArchivalPlan);

      expect(mockExecSync).toHaveBeenCalledWith('npx tsc --noEmit', { stdio: 'pipe' });
      expect(mockExecSync).toHaveBeenCalledWith('npm run build', { stdio: 'pipe' });
    });

    it('should save validation results', async () => {
      await SafeArchivalSystem.executeArchival(mockArchivalPlan);

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('validation-results.json'),
        expect.any(String)
      );
    });

    it('should handle optional validation check failures gracefully', async () => {
      mockExecSync.mockImplementation((command) => {
        if (command.toString().includes('npm run test:quick')) {
          throw new Error('Optional test failed');
        }
        return Buffer.from('success');
      });

      // Should not throw for optional check failure
      await expect(
        SafeArchivalSystem.executeArchival(mockArchivalPlan)
      ).resolves.toBeDefined();
    });
  });

  describe('component restoration', () => {
    it('should restore individual components from archive', async () => {
      const mockManifest: ArchiveManifest = {
        timestamp: mockTimestamp,
        archiveDirectory: mockArchiveDir,
        version: '1.0.0',
        summary: { totalComponents: 1, archivedComponents: 1, symlinkComponents: 0, skippedComponents: 0 },
        components: [{
          originalPath: mockLegacyComponent.path,
          archivePath: `${mockArchiveDir}/${mockLegacyComponent.path}`,
          origin: mockLegacyComponent.origin,
          riskLevel: mockLegacyComponent.riskLevel,
          archiveReason: mockLegacyComponent.archiveReason,
          dependencies: mockLegacyComponent.dependencies,
          backendDependencies: mockLegacyComponent.backendDependencies,
          routeUsage: mockLegacyComponent.routeUsage,
          fileSize: mockLegacyComponent.fileSize,
          lastModified: mockTimestamp,
          checksum: 'mock-checksum'
        }],
        dependencies: [],
        routes: [],
        rollbackInstructions: [],
        validationChecks: []
      };

      mockFs.readFile.mockResolvedValueOnce(JSON.stringify(mockManifest));

      const result = await SafeArchivalSystem.restoreComponent(
        mockArchiveDir,
        mockLegacyComponent.path
      );

      expect(result).toBe(true);
      expect(mockFs.copyFile).toHaveBeenCalledWith(
        mockManifest.components[0].archivePath,
        mockLegacyComponent.path
      );
    });

    it('should handle component not found in archive', async () => {
      const mockManifest: ArchiveManifest = {
        timestamp: mockTimestamp,
        archiveDirectory: mockArchiveDir,
        version: '1.0.0',
        summary: { totalComponents: 0, archivedComponents: 0, symlinkComponents: 0, skippedComponents: 0 },
        components: [],
        dependencies: [],
        routes: [],
        rollbackInstructions: [],
        validationChecks: []
      };

      mockFs.readFile.mockResolvedValueOnce(JSON.stringify(mockManifest));

      const result = await SafeArchivalSystem.restoreComponent(
        mockArchiveDir,
        'non-existent-component.tsx'
      );

      expect(result).toBe(false);
    });
  });

  describe('archive listing', () => {
    it('should list all archived components', async () => {
      const mockManifest: ArchiveManifest = {
        timestamp: mockTimestamp,
        archiveDirectory: mockArchiveDir,
        version: '1.0.0',
        summary: { totalComponents: 1, archivedComponents: 1, symlinkComponents: 0, skippedComponents: 0 },
        components: [{
          originalPath: mockLegacyComponent.path,
          archivePath: `${mockArchiveDir}/${mockLegacyComponent.path}`,
          origin: mockLegacyComponent.origin,
          riskLevel: mockLegacyComponent.riskLevel,
          archiveReason: mockLegacyComponent.archiveReason,
          dependencies: mockLegacyComponent.dependencies,
          backendDependencies: mockLegacyComponent.backendDependencies,
          routeUsage: mockLegacyComponent.routeUsage,
          fileSize: mockLegacyComponent.fileSize,
          lastModified: mockTimestamp,
          checksum: 'mock-checksum'
        }],
        dependencies: [],
        routes: [],
        rollbackInstructions: [],
        validationChecks: []
      };

      mockFs.readFile.mockResolvedValueOnce(JSON.stringify(mockManifest));

      const result = await SafeArchivalSystem.listArchivedComponents(mockArchiveDir);

      expect(result).toHaveLength(1);
      expect(result[0].originalPath).toBe(mockLegacyComponent.path);
    });

    it('should handle missing archive directory', async () => {
      mockFs.readFile.mockRejectedValueOnce(new Error('File not found'));

      const result = await SafeArchivalSystem.listArchivedComponents('non-existent-archive');

      expect(result).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('should handle file system errors gracefully', async () => {
      mockFs.mkdir.mockRejectedValueOnce(new Error('Permission denied'));

      await expect(
        SafeArchivalSystem.executeArchival(mockArchivalPlan)
      ).rejects.toThrow('Permission denied');
    });

    it('should handle component archival failures', async () => {
      mockFs.copyFile.mockRejectedValueOnce(new Error('File not found'));

      await expect(
        SafeArchivalSystem.executeArchival(mockArchivalPlan)
      ).rejects.toThrow('Archival failed for');
    });

    it('should handle validation command failures', async () => {
      mockExecSync.mockImplementationOnce(() => {
        throw new Error('Command failed');
      });

      await expect(
        SafeArchivalSystem.executeArchival(mockArchivalPlan)
      ).rejects.toThrow('Required validation check failed');
    });
  });

  describe('git history preservation', () => {
    it('should preserve git history when option is enabled', async () => {
      const options: Partial<ArchivalOptions> = {
        preserveGitHistory: true
      };

      await SafeArchivalSystem.executeArchival(mockArchivalPlan, options);

      expect(mockExecSync).toHaveBeenCalledWith(
        expect.stringContaining('git log --oneline'),
        expect.any(Object)
      );
    });

    it('should handle git history errors gracefully', async () => {
      mockExecSync.mockImplementationOnce((command) => {
        if (command.toString().includes('git log')) {
          throw new Error('Not a git repository');
        }
        return Buffer.from('success');
      });

      const options: Partial<ArchivalOptions> = {
        preserveGitHistory: true
      };

      // Should not throw for git history errors
      await expect(
        SafeArchivalSystem.executeArchival(mockArchivalPlan, options)
      ).resolves.toBeDefined();
    });
  });
});