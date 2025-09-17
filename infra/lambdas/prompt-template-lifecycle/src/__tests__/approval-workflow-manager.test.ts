/**
 * Approval Workflow Manager Test Suite
 * 
 * This test suite validates approval workflow functionality including workflow
 * creation, stage management, approvals, rejections, and workflow lifecycle.
 */

import { jest } from '@jest/globals';
/**
 * @jest-environment node
 */

import { ApprovalWorkflowManager } from '../approval-workflow-manager';
import { TemplateVersionManager } from '../template-version-manager';

describe('ApprovalWorkflowManager', () => {
  let manager: ApprovalWorkflowManager;
  let mockVersionManager: jest.Mocked<TemplateVersionManager>;

  beforeEach(() => {
    manager = new ApprovalWorkflowManager();
    mockVersionManager = new TemplateVersionManager() as jest.Mocked<TemplateVersionManager>;
    (manager as any).versionManager = mockVersionManager;
  });

  describe('submitForApproval', () => {
    it('should initiate approval workflow for draft version', async () => {
      const userId = 'submitter-user-123';
      
      const mockVersion = createMockVersion({
        status: 'draft',
        approvalWorkflow: createMockApprovalWorkflow({
          status: 'pending',
          requestedBy: userId,
          stages: [
            {
              id: 'tech-review-stage',
              name: 'Technical Review',
              approvers: ['tech-lead-1', 'tech-lead-2'],
              requiredApprovals: 1,
              approvals: [],
              status: 'pending',
              autoApprove: false,
              timeoutHours: 24
            }
          ]
        })
      });

      mockVersionManager.getVersion.mockResolvedValueOnce(mockVersion);
      mockVersionManager.updateVersionStatus.mockResolvedValueOnce();
      mockSend.mockResolvedValueOnce(createMockDynamoEmptyResponse());

      const result = await manager.submitForApproval(mockVersion.id, userId);

      expect(result.status).toBe('pending');
      expect(result.requestedBy).toBe(userId);
      expect(result.requestedAt).toBeValidTimestamp();
      expect(result.stages[0].status).toBe('pending');
      expect(mockVersionManager.updateVersionStatus).toHaveBeenCalledWith(mockVersion.id, 'pending_approval');
    });

    it('should validate version status before submission', async () => {
      const userId = 'user-123';
      const mockVersion = createMockVersion({
        status: 'approved' // Already approved
      });

      mockVersionManager.getVersion.mockResolvedValueOnce(mockVersion);

      await expect(manager.submitForApproval(mockVersion.id, userId)).rejects.toThrow(
        `Version ${mockVersion.id} is not in draft status`
      );
    });

    it('should handle auto-approval stages', async () => {
      const userId = 'submitter-123';
      
      const mockVersion = createMockVersion({
        status: 'draft',
        approvalWorkflow: createMockApprovalWorkflow({
          stages: [
            {
              id: 'auto-stage',
              name: 'Automated Checks',
              approvers: ['system'],
              requiredApprovals: 1,
              approvals: [],
              status: 'pending',
              autoApprove: true, // Auto-approval enabled
              timeoutHours: 1
            }
          ]
        })
      });

      mockVersionManager.getVersion.mockResolvedValueOnce(mockVersion);
      mockVersionManager.updateVersionStatus.mockResolvedValueOnce();
      mockSend.mockResolvedValueOnce(createMockDynamoEmptyResponse());
      mockSend.mockResolvedValueOnce(createMockDynamoEmptyResponse()); // Auto-approval

      const result = await manager.submitForApproval(mockVersion.id, userId);

      expect(result.stages[0].status).toBe('approved');
      expect(result.stages[0].approvals).toHaveLength(1);
      expect(result.stages[0].approvals[0].approverId).toBe('system');
    });
  });

  describe('approveStage', () => {
    it('should approve stage and advance workflow to next stage', async () => {
      const stageIndex = 0;
      const approverId = 'tech-lead-1';
      const comment = 'Code quality looks excellent, approved for next stage';

      const mockVersion = createMockVersion({
        approvalWorkflow: createMockApprovalWorkflow({
          status: 'pending',
          stages: [
            {
              id: 'tech-review',
              name: 'Technical Review',
              approvers: ['tech-lead-1', 'tech-lead-2'],
              requiredApprovals: 1,
              approvals: [],
              status: 'pending'
            },
            {
              id: 'qa-review',
              name: 'QA Review',
              approvers: ['qa-lead'],
              requiredApprovals: 1,
              approvals: [],
              status: 'pending'
            }
          ],
          currentStage: 0
        })
      });

      mockVersionManager.getVersion.mockResolvedValueOnce(mockVersion);
      mockSend.mockResolvedValueOnce(createMockDynamoEmptyResponse());

      const result = await manager.approveStage(mockVersion.id, stageIndex, approverId, comment);

      expect(result.stages[0].status).toBe('approved');
      expect(result.stages[0].approvals).toHaveLength(1);
      expect(result.stages[0].approvals[0]).toMatchObject({
        approverId,
        comment,
        approvedAt: expect.any(String)
      });
      expect(result.currentStage).toBe(1);
      expect(result.stages[1].status).toBe('in_progress');
    });

    it('should complete workflow when final stage is approved', async () => {
      const stageIndex = 0;
      const approverId = 'final-approver';

      const mockVersion = createMockVersion({
        approvalWorkflow: createMockApprovalWorkflow({
          status: 'pending',
          stages: [
            {
              id: 'final-stage',
              name: 'Final Review',
              approvers: ['final-approver'],
              requiredApprovals: 1,
              approvals: [],
              status: 'pending'
            }
          ],
          currentStage: 0
        })
      });

      mockVersionManager.getVersion.mockResolvedValueOnce(mockVersion);
      mockVersionManager.updateVersionStatus.mockResolvedValueOnce();
      mockSend.mockResolvedValueOnce(createMockDynamoEmptyResponse());

      const result = await manager.approveStage(mockVersion.id, stageIndex, approverId);

      expect(result.status).toBe('approved');
      expect(result.completedAt).toBeValidTimestamp();
      expect(result.stages[0].status).toBe('approved');
      expect(mockVersionManager.updateVersionStatus).toHaveBeenCalledWith(mockVersion.id, 'approved');
    });

    it('should validate approver authorization', async () => {
      const stageIndex = 0;
      const unauthorizedUser = 'unauthorized-user-123';

      const mockVersion = createMockVersion({
        approvalWorkflow: createMockApprovalWorkflow({
          status: 'pending',
          stages: [
            {
              id: 'restricted-stage',
              name: 'Security Review',
              approvers: ['security-lead', 'security-admin'], // Specific approvers only
              requiredApprovals: 1,
              approvals: [],
              status: 'pending'
            }
          ],
          currentStage: 0
        })
      });

      mockVersionManager.getVersion.mockResolvedValueOnce(mockVersion);

      await expect(manager.approveStage(mockVersion.id, stageIndex, unauthorizedUser)).rejects.toThrow(
        `User ${unauthorizedUser} is not authorized to approve this stage`
      );
    });

    it('should handle multiple approvals requirement', async () => {
      const stageIndex = 0;
      const firstApproverId = 'approver-1';
      const secondApproverId = 'approver-2';

      const mockVersion = createMockVersion({
        approvalWorkflow: createMockApprovalWorkflow({
          status: 'pending',
          stages: [
            {
              id: 'multi-approval-stage',
              name: 'Multi-Approver Review',
              approvers: ['approver-1', 'approver-2', 'approver-3'],
              requiredApprovals: 2, // Requires 2 approvals
              approvals: [],
              status: 'pending'
            }
          ],
          currentStage: 0
        })
      });

      // First approval
      mockVersionManager.getVersion.mockResolvedValueOnce(mockVersion);
      mockSend.mockResolvedValueOnce(createMockDynamoEmptyResponse());

      const firstResult = await manager.approveStage(mockVersion.id, stageIndex, firstApproverId);

      expect(firstResult.stages[0].status).toBe('pending'); // Still pending, needs more approvals
      expect(firstResult.stages[0].approvals).toHaveLength(1);

      // Update mock for second approval
      const updatedVersion = {
        ...mockVersion,
        approvalWorkflow: {
          ...mockVersion.approvalWorkflow,
          stages: [
            {
              ...mockVersion.approvalWorkflow.stages[0],
              approvals: [{ approverId: firstApproverId, approvedAt: new Date().toISOString() }]
            }
          ]
        }
      };

      mockVersionManager.getVersion.mockResolvedValueOnce(updatedVersion);
      mockSend.mockResolvedValueOnce(createMockDynamoEmptyResponse());

      const secondResult = await manager.approveStage(mockVersion.id, stageIndex, secondApproverId);

      expect(secondResult.stages[0].status).toBe('approved'); // Now approved
      expect(secondResult.stages[0].approvals).toHaveLength(2);
    });
  });

  describe('rejectStage', () => {
    it('should reject stage and terminate workflow', async () => {
      const stageIndex = 0;
      const approverId = 'security-reviewer';
      const reason = 'Critical security vulnerabilities identified in template logic';

      const mockVersion = createMockVersion({
        approvalWorkflow: createMockApprovalWorkflow({
          status: 'pending',
          stages: [
            {
              id: 'security-stage',
              name: 'Security Review',
              approvers: ['security-reviewer'],
              requiredApprovals: 1,
              approvals: [],
              status: 'pending'
            }
          ],
          currentStage: 0
        })
      });

      mockVersionManager.getVersion.mockResolvedValueOnce(mockVersion);
      mockVersionManager.updateVersionStatus.mockResolvedValueOnce();
      mockSend.mockResolvedValueOnce(createMockDynamoEmptyResponse());

      const result = await manager.rejectStage(mockVersion.id, stageIndex, approverId, reason);

      expect(result.status).toBe('rejected');
      expect(result.stages[0].status).toBe('rejected');
      expect(result.completedAt).toBeValidTimestamp();
      expect(result.comments).toHaveLength(1);
      expect(result.comments[0]).toMatchObject({
        type: 'rejection',
        userId: approverId,
        comment: expect.stringContaining(reason)
      });
      expect(mockVersionManager.updateVersionStatus).toHaveBeenCalledWith(mockVersion.id, 'draft');
    });

    it('should validate rejector authorization', async () => {
      const stageIndex = 0;
      const unauthorizedUser = 'random-user';
      const reason = 'Unauthorized rejection attempt';

      const mockVersion = createMockVersion({
        approvalWorkflow: createMockApprovalWorkflow({
          status: 'pending',
          stages: [
            {
              id: 'restricted-stage',
              name: 'Executive Review',
              approvers: ['cto', 'ceo'], // Only executives can approve/reject
              requiredApprovals: 1,
              approvals: [],
              status: 'pending'
            }
          ]
        })
      });

      mockVersionManager.getVersion.mockResolvedValueOnce(mockVersion);

      await expect(manager.rejectStage(mockVersion.id, stageIndex, unauthorizedUser, reason)).rejects.toThrow(
        `User ${unauthorizedUser} is not authorized to approve this stage`
      );
    });
  });

  describe('getPendingApprovals', () => {
    it('should return versions awaiting approval from specific user', async () => {
      const approverId = 'tech-lead-reviewer';
      
      const mockVersions = [
        createMockVersion({
          status: 'pending_approval',
          approvalWorkflow: createMockApprovalWorkflow({
            status: 'pending',
            stages: [
              {
                id: 'tech-review-stage',
                name: 'Technical Review',
                approvers: ['tech-lead-reviewer', 'senior-dev'],
                requiredApprovals: 1,
                approvals: [],
                status: 'pending'
              }
            ],
            currentStage: 0
          })
        }),
        createMockVersion({
          status: 'pending_approval',
          approvalWorkflow: createMockApprovalWorkflow({
            status: 'pending',
            stages: [
              {
                id: 'security-stage',
                name: 'Security Review',
                approvers: ['security-lead'], // Different approver
                requiredApprovals: 1,
                approvals: [],
                status: 'pending'
              }
            ],
            currentStage: 0
          })
        })
      ];

      mockSend.mockResolvedValueOnce(createMockDynamoListResponse(mockVersions));

      const result = await manager.getPendingApprovals(approverId);

      expect(result).toHaveLength(1); // Only the version where user is an approver
      expect(result[0].approvalWorkflow.stages[0].approvers).toContain(approverId);
      expect(result[0].status).toBe('pending_approval');
    });

    it('should handle empty pending approvals list', async () => {
      const approverId = 'inactive-approver';

      mockSend.mockResolvedValueOnce(createMockDynamoListResponse([]));

      const result = await manager.getPendingApprovals(approverId);

      expect(result).toHaveLength(0);
    });

    it('should filter by current stage approvers only', async () => {
      const approverId = 'future-stage-approver';
      
      const mockVersions = [
        createMockVersion({
          status: 'pending_approval',
          approvalWorkflow: createMockApprovalWorkflow({
            status: 'pending',
            stages: [
              {
                id: 'current-stage',
                name: 'Current Review',
                approvers: ['current-approver'],
                requiredApprovals: 1,
                approvals: [],
                status: 'pending'
              },
              {
                id: 'future-stage',
                name: 'Future Review',
                approvers: ['future-stage-approver'], // User is approver for future stage
                requiredApprovals: 1,
                approvals: [],
                status: 'pending'
              }
            ],
            currentStage: 0 // Currently on first stage
          })
        })
      ];

      mockSend.mockResolvedValueOnce(createMockDynamoListResponse(mockVersions));

      const result = await manager.getPendingApprovals(approverId);

      expect(result).toHaveLength(0); // User is not approver for current stage
    });
  });

  describe('addComment', () => {
    it('should add comment to workflow with proper metadata', async () => {
      const userId = 'reviewer-123';
      const comment = 'Please review the security implications of the new template variables';
      const type = 'change_request';

      const mockVersion = createMockVersion({
        approvalWorkflow: createMockApprovalWorkflow({
          status: 'pending',
          comments: [] // Start with empty comments
        })
      });

      mockVersionManager.getVersion.mockResolvedValueOnce(mockVersion);
      mockSend.mockResolvedValueOnce(createMockDynamoEmptyResponse());

      const result = await manager.addComment(mockVersion.id, userId, comment, type);

      expect(result.comments).toHaveLength(1);
      expect(result.comments[0]).toMatchObject({
        id: expect.any(String),
        userId,
        comment,
        type,
        timestamp: expect.any(String)
      });
      expect(result.comments[0].timestamp).toBeValidTimestamp();
    });

    it('should preserve existing comments when adding new ones', async () => {
      const userId = 'new-commenter';
      const comment = 'Additional feedback on implementation';
      const type = 'feedback';

      const existingComment = {
        id: 'existing-comment-id',
        userId: 'previous-user',
        comment: 'Previous comment',
        type: 'general',
        timestamp: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
      };

      const mockVersion = createMockVersion({
        approvalWorkflow: createMockApprovalWorkflow({
          status: 'pending',
          comments: [existingComment]
        })
      });

      mockVersionManager.getVersion.mockResolvedValueOnce(mockVersion);
      mockSend.mockResolvedValueOnce(createMockDynamoEmptyResponse());

      const result = await manager.addComment(mockVersion.id, userId, comment, type);

      expect(result.comments).toHaveLength(2);
      expect(result.comments[0]).toEqual(existingComment); // Existing comment preserved
      expect(result.comments[1]).toMatchObject({
        userId,
        comment,
        type
      });
    });
  });

  describe('cancelApproval', () => {
    it('should allow requester to cancel pending workflow', async () => {
      const userId = 'original-requester';
      const reason = 'Need to make significant changes based on initial feedback';

      const mockVersion = createMockVersion({
        approvalWorkflow: createMockApprovalWorkflow({
          status: 'pending',
          requestedBy: userId, // Same user who submitted
          comments: []
        })
      });

      mockVersionManager.getVersion.mockResolvedValueOnce(mockVersion);
      mockVersionManager.updateVersionStatus.mockResolvedValueOnce();
      mockSend.mockResolvedValueOnce(createMockDynamoEmptyResponse());

      const result = await manager.cancelApproval(mockVersion.id, userId, reason);

      expect(result.status).toBe('cancelled');
      expect(result.completedAt).toBeValidTimestamp();
      expect(result.comments).toHaveLength(1);
      expect(result.comments[0]).toMatchObject({
        type: 'cancellation',
        userId,
        comment: expect.stringContaining(reason)
      });
      expect(mockVersionManager.updateVersionStatus).toHaveBeenCalledWith(mockVersion.id, 'draft');
    });

    it('should prevent non-requester from cancelling workflow', async () => {
      const originalRequester = 'original-user';
      const otherUser = 'different-user';
      const reason = 'Unauthorized cancellation attempt';

      const mockVersion = createMockVersion({
        approvalWorkflow: createMockApprovalWorkflow({
          status: 'pending',
          requestedBy: originalRequester // Different from cancelling user
        })
      });

      mockVersionManager.getVersion.mockResolvedValueOnce(mockVersion);

      await expect(manager.cancelApproval(mockVersion.id, otherUser, reason)).rejects.toThrow(
        'Only the requester can cancel the approval workflow'
      );
    });

    it('should handle cancellation of already completed workflow', async () => {
      const userId = 'requester';
      const reason = 'Late cancellation attempt';

      const mockVersion = createMockVersion({
        approvalWorkflow: createMockApprovalWorkflow({
          status: 'approved', // Already completed
          requestedBy: userId,
          completedAt: new Date().toISOString()
        })
      });

      mockVersionManager.getVersion.mockResolvedValueOnce(mockVersion);

      await expect(manager.cancelApproval(mockVersion.id, userId, reason)).rejects.toThrow();
    });
  });
});