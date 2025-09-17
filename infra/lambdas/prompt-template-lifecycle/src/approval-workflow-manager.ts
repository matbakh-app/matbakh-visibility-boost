import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import {
  ApprovalWorkflow,
  ApprovalStage,
  Approval,
  ApprovalComment,
  ApprovalStatus,
  ApprovalStageStatus,
  TemplateVersion
} from './types';
import { TemplateVersionManager } from './template-version-manager';

export class ApprovalWorkflowManager {
  private dynamoClient: DynamoDBDocumentClient;
  private versionsTable: string;
  private versionManager: TemplateVersionManager;

  constructor() {
    const client = new DynamoDBClient({
      region: process.env.AWS_REGION || 'eu-central-1'
    });
    this.dynamoClient = DynamoDBDocumentClient.from(client);
    this.versionsTable = process.env.VERSIONS_TABLE || 'template-versions';
    this.versionManager = new TemplateVersionManager();
  }

  async submitForApproval(versionId: string, userId: string): Promise<ApprovalWorkflow> {
    const version = await this.versionManager.getVersion(versionId);
    if (!version) {
      throw new Error(`Version ${versionId} not found`);
    }

    if (version.status !== 'draft') {
      throw new Error(`Version ${versionId} is not in draft status`);
    }

    // Update workflow status
    const updatedWorkflow: ApprovalWorkflow = {
      ...version.approvalWorkflow,
      status: 'pending',
      requestedBy: userId,
      requestedAt: new Date().toISOString()
    };

    await this.updateVersionWorkflow(versionId, updatedWorkflow);
    await this.versionManager.updateVersionStatus(versionId, 'pending_approval');

    // Auto-approve if first stage allows it
    if (updatedWorkflow.stages[0]?.autoApprove) {
      await this.autoApproveStage(versionId, 0, 'system');
    }

    return updatedWorkflow;
  }

  async approveStage(
    versionId: string,
    stageIndex: number,
    approverId: string,
    comment?: string
  ): Promise<ApprovalWorkflow> {
    const version = await this.versionManager.getVersion(versionId);
    if (!version) {
      throw new Error(`Version ${versionId} not found`);
    }

    const workflow = version.approvalWorkflow;
    const stage = workflow.stages[stageIndex];

    if (!stage) {
      throw new Error(`Stage ${stageIndex} not found`);
    }

    if (!stage.approvers.includes(approverId)) {
      throw new Error(`User ${approverId} is not authorized to approve this stage`);
    }

    // Check if already approved by this user
    const existingApproval = stage.approvals.find(a => a.approverId === approverId);
    if (existingApproval) {
      throw new Error(`User ${approverId} has already provided approval for this stage`);
    }

    // Add approval
    const approval: Approval = {
      approverId,
      status: 'approved',
      comment,
      timestamp: new Date().toISOString()
    };

    stage.approvals.push(approval);

    // Check if stage is complete
    const approvedCount = stage.approvals.filter(a => a.status === 'approved').length;
    if (approvedCount >= stage.requiredApprovals) {
      stage.status = 'approved';
      
      // Move to next stage or complete workflow
      if (stageIndex < workflow.stages.length - 1) {
        workflow.currentStage = stageIndex + 1;
        workflow.stages[stageIndex + 1].status = 'in_progress';
      } else {
        // All stages complete
        workflow.status = 'approved';
        workflow.completedAt = new Date().toISOString();
        await this.versionManager.updateVersionStatus(versionId, 'approved');
      }
    }

    // Add comment if provided
    if (comment) {
      const approvalComment: ApprovalComment = {
        id: uuidv4(),
        userId: approverId,
        comment,
        timestamp: new Date().toISOString(),
        type: 'approval'
      };
      workflow.comments.push(approvalComment);
    }

    await this.updateVersionWorkflow(versionId, workflow);
    return workflow;
  }

  async rejectStage(
    versionId: string,
    stageIndex: number,
    approverId: string,
    reason: string
  ): Promise<ApprovalWorkflow> {
    const version = await this.versionManager.getVersion(versionId);
    if (!version) {
      throw new Error(`Version ${versionId} not found`);
    }

    const workflow = version.approvalWorkflow;
    const stage = workflow.stages[stageIndex];

    if (!stage) {
      throw new Error(`Stage ${stageIndex} not found`);
    }

    if (!stage.approvers.includes(approverId)) {
      throw new Error(`User ${approverId} is not authorized to reject this stage`);
    }

    // Add rejection
    const rejection: Approval = {
      approverId,
      status: 'rejected',
      comment: reason,
      timestamp: new Date().toISOString()
    };

    stage.approvals.push(rejection);
    stage.status = 'rejected';
    workflow.status = 'rejected';
    workflow.completedAt = new Date().toISOString();

    // Add rejection comment
    const rejectionComment: ApprovalComment = {
      id: uuidv4(),
      userId: approverId,
      comment: reason,
      timestamp: new Date().toISOString(),
      type: 'rejection'
    };
    workflow.comments.push(rejectionComment);

    await this.updateVersionWorkflow(versionId, workflow);
    await this.versionManager.updateVersionStatus(versionId, 'draft');

    return workflow;
  }

  async addComment(
    versionId: string,
    userId: string,
    comment: string,
    type: 'general' | 'change_request' = 'general'
  ): Promise<ApprovalWorkflow> {
    const version = await this.versionManager.getVersion(versionId);
    if (!version) {
      throw new Error(`Version ${versionId} not found`);
    }

    const workflow = version.approvalWorkflow;
    const newComment: ApprovalComment = {
      id: uuidv4(),
      userId,
      comment,
      timestamp: new Date().toISOString(),
      type
    };

    workflow.comments.push(newComment);
    await this.updateVersionWorkflow(versionId, workflow);

    return workflow;
  }

  async getWorkflowHistory(templateId: string): Promise<ApprovalWorkflow[]> {
    const versions = await this.versionManager.getVersionsByTemplate(templateId);
    return versions.map(v => v.approvalWorkflow).sort((a, b) => 
      new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
    );
  }

  async getPendingApprovals(approverId: string): Promise<TemplateVersion[]> {
    // This would typically use a GSI on approver ID
    // For now, we'll scan all pending versions
    const result = await this.dynamoClient.send(new QueryCommand({
      TableName: this.versionsTable,
      IndexName: 'status-index',
      KeyConditionExpression: '#status = :status',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': 'pending_approval'
      }
    }));

    const versions = result.Items as TemplateVersion[] || [];
    
    // Filter versions where user is an approver for current stage
    return versions.filter(version => {
      const currentStage = version.approvalWorkflow.stages[version.approvalWorkflow.currentStage];
      return currentStage?.approvers.includes(approverId) && 
             currentStage.status === 'pending';
    });
  }

  async cancelApproval(versionId: string, userId: string, reason: string): Promise<ApprovalWorkflow> {
    const version = await this.versionManager.getVersion(versionId);
    if (!version) {
      throw new Error(`Version ${versionId} not found`);
    }

    const workflow = version.approvalWorkflow;
    
    if (workflow.requestedBy !== userId) {
      throw new Error('Only the requester can cancel the approval workflow');
    }

    if (workflow.status !== 'pending') {
      throw new Error('Can only cancel pending approval workflows');
    }

    workflow.status = 'cancelled';
    workflow.completedAt = new Date().toISOString();

    // Add cancellation comment
    const cancellationComment: ApprovalComment = {
      id: uuidv4(),
      userId,
      comment: `Approval cancelled: ${reason}`,
      timestamp: new Date().toISOString(),
      type: 'general'
    };
    workflow.comments.push(cancellationComment);

    await this.updateVersionWorkflow(versionId, workflow);
    await this.versionManager.updateVersionStatus(versionId, 'draft');

    return workflow;
  }

  private async autoApproveStage(versionId: string, stageIndex: number, approverId: string): Promise<void> {
    const version = await this.versionManager.getVersion(versionId);
    if (!version) return;

    const workflow = version.approvalWorkflow;
    const stage = workflow.stages[stageIndex];

    if (!stage?.autoApprove) return;

    const approval: Approval = {
      approverId,
      status: 'approved',
      comment: 'Auto-approved',
      timestamp: new Date().toISOString()
    };

    stage.approvals.push(approval);
    stage.status = 'approved';

    // Move to next stage or complete
    if (stageIndex < workflow.stages.length - 1) {
      workflow.currentStage = stageIndex + 1;
      workflow.stages[stageIndex + 1].status = 'in_progress';
    } else {
      workflow.status = 'approved';
      workflow.completedAt = new Date().toISOString();
      await this.versionManager.updateVersionStatus(versionId, 'approved');
    }

    await this.updateVersionWorkflow(versionId, workflow);
  }

  private async updateVersionWorkflow(versionId: string, workflow: ApprovalWorkflow): Promise<void> {
    await this.dynamoClient.send(new UpdateCommand({
      TableName: this.versionsTable,
      Key: { id: versionId },
      UpdateExpression: 'SET approvalWorkflow = :workflow',
      ExpressionAttributeValues: {
        ':workflow': workflow
      }
    }));
  }
}