/**
 * AI Communication Governance Manager
 *
 * Manages activation and governance of AI communication channels.
 * Ensures compliance with GDPR, EU AI Act, and internal policies.
 *
 * @module ai-communication-governance-manager
 */

import * as fs from "fs";
import * as yaml from "js-yaml";
import * as path from "path";

/**
 * Communication channel types
 */
export type CommunicationChannel =
  | "text_chat"
  | "voice_assistant"
  | "ai_recommendations"
  | "external_apis"
  | "content_generation"
  | "customer_communication";

/**
 * Channel status types
 */
export type ChannelStatus =
  | "inactive"
  | "pending_approval"
  | "active"
  | "suspended";

/**
 * Risk level types
 */
export type RiskLevel = "low" | "medium" | "high" | "critical";

/**
 * Communication channel configuration
 */
export interface ChannelConfig {
  name: CommunicationChannel;
  description: string;
  autoEnable: boolean;
  requireConsent: boolean;
  requireApproval: boolean;
  approvers?: string[];
  compliance: string[];
  restrictions: string[];
  status: ChannelStatus;
}

/**
 * Channel activation proposal
 */
export interface ChannelActivationProposal {
  id: string;
  channelName: CommunicationChannel;
  purpose: string;
  complianceSummary: string;
  riskAssessment: RiskLevel;
  dataProcessingDescription: string;
  userConsentMechanism: string;
  timestamp: Date;
  status: "pending" | "approved" | "rejected";
  approvals: ApprovalRecord[];
}

/**
 * Approval record
 */
export interface ApprovalRecord {
  approver: string;
  timestamp: Date;
  comments?: string;
}

/**
 * Governance configuration
 */
export interface GovernanceConfig {
  enableCommunicationGovernance: boolean;
  communicationPolicyPath: string;
  proposalStorage: string;
  approvedStorage: string;
  rejectedStorage: string;
  defaultState: "inactive" | "active";
}

/**
 * Default governance configuration
 */
const DEFAULT_CONFIG: GovernanceConfig = {
  enableCommunicationGovernance: true,
  communicationPolicyPath:
    ".kiro/policies/ki-communication-activation-policy.yaml",
  proposalStorage: ".approvals/pending",
  approvedStorage: ".approvals/approved",
  rejectedStorage: ".approvals/rejected",
  defaultState: "inactive",
};

/**
 * AI Communication Governance Manager
 *
 * Manages activation and governance of AI communication channels.
 */
export class AICommunicationGovernanceManager {
  private config: GovernanceConfig;
  private policy: any;
  private channels: Map<CommunicationChannel, ChannelConfig>;

  constructor(config?: Partial<GovernanceConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.policy = null;
    this.channels = new Map();
  }

  /**
   * Initialize the governance manager
   */
  public async initialize(): Promise<void> {
    if (!this.config.enableCommunicationGovernance) {
      console.log(
        "[AICommunicationGovernanceManager] Communication governance disabled"
      );
      return;
    }

    try {
      // Load policy from YAML file
      const policyPath = path.resolve(
        process.cwd(),
        this.config.communicationPolicyPath
      );

      if (!fs.existsSync(policyPath)) {
        throw new Error(`Communication policy file not found: ${policyPath}`);
      }

      const policyContent = fs.readFileSync(policyPath, "utf8");
      this.policy = yaml.load(policyContent);

      console.log(
        "[AICommunicationGovernanceManager] Communication policy loaded successfully"
      );

      // Initialize channels from policy
      this.initializeChannels();

      // Ensure storage directories exist
      this.ensureStorageDirectories();
    } catch (error) {
      console.error(
        "[AICommunicationGovernanceManager] Failed to initialize:",
        error
      );
      throw error;
    }
  }

  /**
   * Initialize channels from policy
   */
  private initializeChannels(): void {
    if (!this.policy || !this.policy.channels) {
      return;
    }

    for (const channelDef of this.policy.channels) {
      const channel: ChannelConfig = {
        name: channelDef.name,
        description: channelDef.description,
        autoEnable: channelDef.auto_enable || false,
        requireConsent: channelDef.require_consent || false,
        requireApproval: channelDef.require_approval !== false,
        approvers: channelDef.approvers || [],
        compliance: channelDef.compliance || [],
        restrictions: channelDef.restrictions || [],
        status: channelDef.auto_enable ? "active" : "inactive",
      };

      this.channels.set(channel.name, channel);
      console.log(
        `[AICommunicationGovernanceManager] Channel initialized: ${channel.name} (${channel.status})`
      );
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
        console.log(
          `[AICommunicationGovernanceManager] Created directory: ${dir}`
        );
      }
    }
  }

  /**
   * Request channel activation
   */
  public async requestChannelActivation(
    channelName: CommunicationChannel,
    purpose: string,
    complianceSummary: string,
    riskAssessment: RiskLevel,
    dataProcessingDescription: string,
    userConsentMechanism: string
  ): Promise<string> {
    if (!this.config.enableCommunicationGovernance) {
      throw new Error("Communication governance is disabled");
    }

    const channel = this.channels.get(channelName);
    if (!channel) {
      throw new Error(`Unknown channel: ${channelName}`);
    }

    // Check if auto-enable is allowed
    if (channel.autoEnable && !channel.requireApproval) {
      console.log(
        `[AICommunicationGovernanceManager] Auto-enabling channel: ${channelName}`
      );
      channel.status = "active";
      return "auto-approved";
    }

    // Create activation proposal
    const proposalId = this.generateProposalId(channelName);
    const proposal: ChannelActivationProposal = {
      id: proposalId,
      channelName,
      purpose,
      complianceSummary,
      riskAssessment,
      dataProcessingDescription,
      userConsentMechanism,
      timestamp: new Date(),
      status: "pending",
      approvals: [],
    };

    // Save proposal
    await this.saveProposal(proposal, "pending");

    // Update channel status
    channel.status = "pending_approval";

    console.log(
      `[AICommunicationGovernanceManager] Activation proposal created: ${proposalId}`
    );
    console.log(
      `[AICommunicationGovernanceManager] Awaiting approval: npx kiro approve-communication ${this.config.proposalStorage}/${proposalId}.yaml`
    );

    return proposalId;
  }

  /**
   * Generate proposal ID
   */
  private generateProposalId(channelName: CommunicationChannel): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    return `${timestamp}_ki-communication-${channelName}`;
  }

  /**
   * Save proposal to storage
   */
  private async saveProposal(
    proposal: ChannelActivationProposal,
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
    console.log(
      `[AICommunicationGovernanceManager] Proposal saved: ${filePath}`
    );
  }

  /**
   * Load proposal from storage
   */
  public async loadProposal(
    proposalId: string
  ): Promise<ChannelActivationProposal | null> {
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
        return yaml.load(content) as ChannelActivationProposal;
      }
    }

    return null;
  }

  /**
   * Approve channel activation
   */
  public async approveChannelActivation(
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

    // Get channel config
    const channel = this.channels.get(proposal.channelName);
    if (!channel) {
      throw new Error(`Channel not found: ${proposal.channelName}`);
    }

    // Check if enough approvals
    const requiredApprovals = channel.approvers?.length || 1;

    if (proposal.approvals.length >= requiredApprovals) {
      proposal.status = "approved";

      // Activate channel
      channel.status = "active";

      // Move to approved storage
      await this.moveProposal(proposal, "pending", "approved");

      console.log(
        `[AICommunicationGovernanceManager] Channel activated: ${proposal.channelName}`
      );
      console.log(
        `[AICommunicationGovernanceManager] Proposal approved: ${proposalId}`
      );
    } else {
      // Save updated proposal
      await this.saveProposal(proposal, "pending");

      console.log(
        `[AICommunicationGovernanceManager] Approval recorded: ${proposalId}`
      );
      console.log(
        `[AICommunicationGovernanceManager] Awaiting ${
          requiredApprovals - proposal.approvals.length
        } more approval(s)`
      );
    }
  }

  /**
   * Reject channel activation
   */
  public async rejectChannelActivation(
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

    // Update channel status
    const channel = this.channels.get(proposal.channelName);
    if (channel) {
      channel.status = "inactive";
    }

    // Move to rejected storage
    await this.moveProposal(proposal, "pending", "rejected");

    console.log(
      `[AICommunicationGovernanceManager] Channel activation rejected: ${proposalId}`
    );
    console.log(`[AICommunicationGovernanceManager] Reason: ${reason}`);
  }

  /**
   * Move proposal between storages
   */
  private async moveProposal(
    proposal: ChannelActivationProposal,
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
   * Check if channel is active
   */
  public isChannelActive(channelName: CommunicationChannel): boolean {
    const channel = this.channels.get(channelName);
    return channel?.status === "active";
  }

  /**
   * Get channel status
   */
  public getChannelStatus(
    channelName: CommunicationChannel
  ): ChannelStatus | null {
    const channel = this.channels.get(channelName);
    return channel?.status || null;
  }

  /**
   * Get all channels
   */
  public getAllChannels(): Map<CommunicationChannel, ChannelConfig> {
    return new Map(this.channels);
  }

  /**
   * List pending proposals
   */
  public async listPendingProposals(): Promise<ChannelActivationProposal[]> {
    const pendingDir = path.resolve(process.cwd(), this.config.proposalStorage);

    if (!fs.existsSync(pendingDir)) {
      return [];
    }

    const files = fs.readdirSync(pendingDir).filter((f) => f.endsWith(".yaml"));
    const proposals: ChannelActivationProposal[] = [];

    for (const file of files) {
      const filePath = path.join(pendingDir, file);
      const content = fs.readFileSync(filePath, "utf8");
      const proposal = yaml.load(content) as ChannelActivationProposal;
      proposals.push(proposal);
    }

    return proposals;
  }

  /**
   * Suspend channel
   */
  public suspendChannel(
    channelName: CommunicationChannel,
    reason: string
  ): void {
    const channel = this.channels.get(channelName);

    if (!channel) {
      throw new Error(`Channel not found: ${channelName}`);
    }

    channel.status = "suspended";
    console.log(
      `[AICommunicationGovernanceManager] Channel suspended: ${channelName}`
    );
    console.log(`[AICommunicationGovernanceManager] Reason: ${reason}`);
  }

  /**
   * Reactivate channel
   */
  public reactivateChannel(channelName: CommunicationChannel): void {
    const channel = this.channels.get(channelName);

    if (!channel) {
      throw new Error(`Channel not found: ${channelName}`);
    }

    if (channel.status !== "suspended") {
      throw new Error(`Channel is not suspended: ${channel.status}`);
    }

    channel.status = "active";
    console.log(
      `[AICommunicationGovernanceManager] Channel reactivated: ${channelName}`
    );
  }

  /**
   * Get governance configuration
   */
  public getConfig(): GovernanceConfig {
    return { ...this.config };
  }
}

/**
 * Example usage for requesting channel activation
 */
export async function requestCommunicationChannelActivation(
  channelName: CommunicationChannel,
  purpose: string,
  complianceSummary: string,
  riskAssessment: RiskLevel,
  dataProcessingDescription: string,
  userConsentMechanism: string
): Promise<string> {
  const manager = new AICommunicationGovernanceManager();
  await manager.initialize();

  return manager.requestChannelActivation(
    channelName,
    purpose,
    complianceSummary,
    riskAssessment,
    dataProcessingDescription,
    userConsentMechanism
  );
}
