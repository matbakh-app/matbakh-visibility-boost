/**
 * Bedrock Approval Policy Manager
 *
 * Manages approval workflow for Bedrock-initiated actions.
 * Ensures human oversight for architectural, code, and infrastructure changes.
 *
 * @module bedrock-approval-policy-manager
 */

import * as fs from "fs";
import * as yaml from "js-yaml";
import * as path from "path";

/**
 * Approval policy configuration
 */
export interface ApprovalPolicyConfig {
  enableApprovalPolicy: boolean;
  approvalPolicyPath: string;
  proposalStorage: string;
  approvedStorage: string;
  rejectedStorage: string;
  requireTwoApprovals: boolean;
  autoApprovalForDocs: boolean;
}

/**
 * Action category types
 */
export type ActionCategory =
  | "architecture"
  | "infrastructure"
  | "code"
  | "documentation";

/**
 * Risk level types
 */
export type RiskLevel = "low" | "medium" | "high" | "critical";

/**
 * Approval status types
 */
export type ApprovalStatus = "pending" | "approved" | "rejected" | "executed";

/**
 * Bedrock proposal interface
 */
export interface BedrockProposal {
  id: string;
  type: ActionCategory;
  rationale: string;
  affectedComponents: string[];
  riskLevel: RiskLevel;
  rollbackPlan: string;
  reviewer: string;
  timestamp: Date;
  status: ApprovalStatus;
  approvals: ApprovalRecord[];
  changes?: {
    files: string[];
    diff?: string;
    description: string;
  };
}

/**
 * Approval record interface
 */
export interface ApprovalRecord {
  approver: string;
  timestamp: Date;
  signature?: string;
  comments?: string;
}

/**
 * Policy validation result
 */
export interface PolicyValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Default approval policy configuration
 */
const DEFAULT_CONFIG: ApprovalPolicyConfig = {
  enableApprovalPolicy: true,
  approvalPolicyPath: ".kiro/policies/bedrock-approval-policy.yaml",
  proposalStorage: ".approvals/pending",
  approvedStorage: ".approvals/approved",
  rejectedStorage: ".approvals/rejected",
  requireTwoApprovals: true,
  autoApprovalForDocs: true,
};

/**
 * Bedrock Approval Policy Manager
 *
 * Manages the approval workflow for Bedrock-initiated actions.
 */
export class BedrockApprovalPolicyManager {
  private config: ApprovalPolicyConfig;
  private policy: any;

  constructor(config?: Partial<ApprovalPolicyConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.policy = null;
  }

  /**
   * Initialize the approval policy manager
   */
  public async initialize(): Promise<void> {
    if (!this.config.enableApprovalPolicy) {
      console.log("[BedrockApprovalPolicyManager] Approval policy disabled");
      return;
    }

    try {
      // Load policy from YAML file
      const policyPath = path.resolve(
        process.cwd(),
        this.config.approvalPolicyPath
      );

      if (!fs.existsSync(policyPath)) {
        throw new Error(`Approval policy file not found: ${policyPath}`);
      }

      const policyContent = fs.readFileSync(policyPath, "utf8");
      this.policy = yaml.load(policyContent);

      console.log(
        "[BedrockApprovalPolicyManager] Approval policy loaded successfully"
      );

      // Ensure storage directories exist
      this.ensureStorageDirectories();
    } catch (error) {
      console.error(
        "[BedrockApprovalPolicyManager] Failed to initialize:",
        error
      );
      throw error;
    }
  }

  /**
   * Ensure storage directories exist
   */
  private ensureStorageDirectories(): void {
    const directories = [
      this.config.proposalStorage,
      this.config.approvedStorage,
      this.config.rejectedStorage,
    ];

    for (const dir of directories) {
      const dirPath = path.resolve(process.cwd(), dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`[BedrockApprovalPolicyManager] Created directory: ${dir}`);
      }
    }
  }

  /**
   * Create a new proposal
   */
  public async createProposal(
    proposal: Omit<BedrockProposal, "id" | "timestamp" | "status" | "approvals">
  ): Promise<string> {
    if (!this.config.enableApprovalPolicy) {
      throw new Error("Approval policy is disabled");
    }

    // Validate proposal
    const validation = this.validateProposal(proposal);
    if (!validation.valid) {
      throw new Error(`Invalid proposal: ${validation.errors.join(", ")}`);
    }

    // Check if auto-approval is allowed
    if (proposal.type === "documentation" && this.config.autoApprovalForDocs) {
      console.log(
        "[BedrockApprovalPolicyManager] Auto-approving documentation change"
      );
      return "auto-approved";
    }

    // Generate proposal ID
    const proposalId = this.generateProposalId(proposal.type);

    // Create full proposal
    const fullProposal: BedrockProposal = {
      ...proposal,
      id: proposalId,
      timestamp: new Date(),
      status: "pending",
      approvals: [],
    };

    // Save proposal to pending storage
    await this.saveProposal(fullProposal, "pending");

    console.log(
      `[BedrockApprovalPolicyManager] Proposal created: ${proposalId}`
    );
    console.log(
      `[BedrockApprovalPolicyManager] Awaiting approval: npx kiro approve ${this.config.proposalStorage}/${proposalId}.yaml`
    );

    return proposalId;
  }

  /**
   * Validate a proposal
   */
  private validateProposal(
    proposal: Partial<BedrockProposal>
  ): PolicyValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!proposal.type) errors.push("Missing type");
    if (!proposal.rationale) errors.push("Missing rationale");
    if (
      !proposal.affectedComponents ||
      proposal.affectedComponents.length === 0
    ) {
      errors.push("Missing affected components");
    }
    if (!proposal.riskLevel) errors.push("Missing risk level");
    if (!proposal.rollbackPlan) errors.push("Missing rollback plan");
    if (!proposal.reviewer) errors.push("Missing reviewer");

    // Risk level validation
    if (proposal.riskLevel === "critical" && !proposal.rollbackPlan) {
      errors.push("Critical risk level requires detailed rollback plan");
    }

    // Warnings
    if (proposal.riskLevel === "high" || proposal.riskLevel === "critical") {
      warnings.push("High/critical risk level requires CTO approval");
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Generate proposal ID
   */
  private generateProposalId(type: ActionCategory): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    return `${timestamp}_bedrock-${type}-proposal`;
  }

  /**
   * Save proposal to storage
   */
  private async saveProposal(
    proposal: BedrockProposal,
    storage: "pending" | "approved" | "rejected"
  ): Promise<void> {
    const storageDir =
      storage === "pending"
        ? this.config.proposalStorage
        : storage === "approved"
        ? this.config.approvedStorage
        : this.config.rejectedStorage;

    const filePath = path.resolve(
      process.cwd(),
      storageDir,
      `${proposal.id}.yaml`
    );
    const yamlContent = yaml.dump(proposal);

    fs.writeFileSync(filePath, yamlContent, "utf8");
    console.log(`[BedrockApprovalPolicyManager] Proposal saved: ${filePath}`);
  }

  /**
   * Load proposal from storage
   */
  public async loadProposal(
    proposalId: string
  ): Promise<BedrockProposal | null> {
    const storages = [
      this.config.proposalStorage,
      this.config.approvedStorage,
      this.config.rejectedStorage,
    ];

    for (const storage of storages) {
      const filePath = path.resolve(
        process.cwd(),
        storage,
        `${proposalId}.yaml`
      );

      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf8");
        return yaml.load(content) as BedrockProposal;
      }
    }

    return null;
  }

  /**
   * Approve a proposal
   */
  public async approveProposal(
    proposalId: string,
    approver: string,
    comments?: string
  ): Promise<void> {
    const proposal = await this.loadProposal(proposalId);

    if (!proposal) {
      throw new Error(`Proposal not found: ${proposalId}`);
    }

    if (proposal.status !== "pending") {
      throw new Error(`Proposal is not pending: ${proposal.status}`);
    }

    // Add approval record
    const approval: ApprovalRecord = {
      approver,
      timestamp: new Date(),
      comments,
    };

    proposal.approvals.push(approval);

    // Check if enough approvals
    const requiredApprovals = this.config.requireTwoApprovals ? 2 : 1;

    if (proposal.approvals.length >= requiredApprovals) {
      proposal.status = "approved";

      // Move to approved storage
      await this.moveProposal(proposal, "pending", "approved");

      console.log(
        `[BedrockApprovalPolicyManager] Proposal approved: ${proposalId}`
      );
      console.log(`[BedrockApprovalPolicyManager] Ready for execution`);
    } else {
      // Save updated proposal
      await this.saveProposal(proposal, "pending");

      console.log(
        `[BedrockApprovalPolicyManager] Approval recorded: ${proposalId}`
      );
      console.log(
        `[BedrockApprovalPolicyManager] Awaiting ${
          requiredApprovals - proposal.approvals.length
        } more approval(s)`
      );
    }
  }

  /**
   * Reject a proposal
   */
  public async rejectProposal(
    proposalId: string,
    reviewer: string,
    reason: string
  ): Promise<void> {
    const proposal = await this.loadProposal(proposalId);

    if (!proposal) {
      throw new Error(`Proposal not found: ${proposalId}`);
    }

    if (proposal.status !== "pending") {
      throw new Error(`Proposal is not pending: ${proposal.status}`);
    }

    proposal.status = "rejected";

    // Add rejection record
    const rejection: ApprovalRecord = {
      approver: reviewer,
      timestamp: new Date(),
      comments: `Rejected: ${reason}`,
    };

    proposal.approvals.push(rejection);

    // Move to rejected storage
    await this.moveProposal(proposal, "pending", "rejected");

    console.log(
      `[BedrockApprovalPolicyManager] Proposal rejected: ${proposalId}`
    );
    console.log(`[BedrockApprovalPolicyManager] Reason: ${reason}`);
  }

  /**
   * Move proposal between storages
   */
  private async moveProposal(
    proposal: BedrockProposal,
    from: "pending" | "approved" | "rejected",
    to: "pending" | "approved" | "rejected"
  ): Promise<void> {
    // Save to new location
    await this.saveProposal(proposal, to);

    // Delete from old location
    const fromDir =
      from === "pending"
        ? this.config.proposalStorage
        : from === "approved"
        ? this.config.approvedStorage
        : this.config.rejectedStorage;

    const oldPath = path.resolve(process.cwd(), fromDir, `${proposal.id}.yaml`);

    if (fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath);
    }
  }

  /**
   * List pending proposals
   */
  public async listPendingProposals(): Promise<BedrockProposal[]> {
    const pendingDir = path.resolve(process.cwd(), this.config.proposalStorage);

    if (!fs.existsSync(pendingDir)) {
      return [];
    }

    const files = fs.readdirSync(pendingDir).filter((f) => f.endsWith(".yaml"));
    const proposals: BedrockProposal[] = [];

    for (const file of files) {
      const filePath = path.join(pendingDir, file);
      const content = fs.readFileSync(filePath, "utf8");
      const proposal = yaml.load(content) as BedrockProposal;
      proposals.push(proposal);
    }

    return proposals;
  }

  /**
   * Get approval policy configuration
   */
  public getConfig(): ApprovalPolicyConfig {
    return { ...this.config };
  }

  /**
   * Check if approval is required for action type
   */
  public requiresApproval(actionType: ActionCategory): boolean {
    if (!this.config.enableApprovalPolicy) {
      return false;
    }

    if (actionType === "documentation" && this.config.autoApprovalForDocs) {
      return false;
    }

    return true;
  }
}

/**
 * Example usage for creating a proposal
 */
export async function createBedrockProposal(
  type: ActionCategory,
  rationale: string,
  affectedComponents: string[],
  riskLevel: RiskLevel,
  rollbackPlan: string,
  reviewer: string,
  changes?: {
    files: string[];
    diff?: string;
    description: string;
  }
): Promise<string> {
  const manager = new BedrockApprovalPolicyManager();
  await manager.initialize();

  return manager.createProposal({
    type,
    rationale,
    affectedComponents,
    riskLevel,
    rollbackPlan,
    reviewer,
    changes,
  });
}
