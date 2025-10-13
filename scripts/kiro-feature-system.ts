#!/usr/bin/env tsx
/**
 * Kiro Feature Flag System
 *
 * Feature flag management system for Bedrock
 */
import { promises as fs } from "fs";
import path from "path";

interface FeatureFlag {
  name: string;
  enabled: boolean;
  description?: string;
  environment?: string;
  rolloutPercentage?: number;
  conditions?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

interface FeatureFlagRegistry {
  flags: Record<string, FeatureFlag>;
  version: string;
  lastUpdated: string;
}

class KiroFeatureSystem {
  private registryPath: string;
  private registry: FeatureFlagRegistry;

  constructor() {
    this.registryPath = path.join(
      process.cwd(),
      ".kiro",
      "features",
      "flags.json"
    );
    this.registry = {
      flags: {},
      version: "1.0.0",
      lastUpdated: new Date().toISOString(),
    };
  }

  async initialize(): Promise<void> {
    await fs.mkdir(path.dirname(this.registryPath), { recursive: true });
    try {
      const registryData = await fs.readFile(this.registryPath, "utf-8");
      this.registry = JSON.parse(registryData);
    } catch (error) {
      // Registry doesn't exist, create new one with default flags
      await this.initializeDefaultFlags();
      await this.saveRegistry();
    }
  }

  async enableFeature(
    name: string,
    options: {
      description?: string;
      environment?: string;
      rolloutPercentage?: number;
    } = {}
  ): Promise<void> {
    console.log(`🚀 Enabling feature: ${name}`);

    const now = new Date().toISOString();

    if (this.registry.flags[name]) {
      // Update existing flag
      this.registry.flags[name].enabled = true;
      this.registry.flags[name].updatedAt = now;
      if (options.description)
        this.registry.flags[name].description = options.description;
      if (options.environment)
        this.registry.flags[name].environment = options.environment;
      if (options.rolloutPercentage)
        this.registry.flags[name].rolloutPercentage = options.rolloutPercentage;
    } else {
      // Create new flag
      this.registry.flags[name] = {
        name,
        enabled: true,
        description: options.description || `Feature flag: ${name}`,
        environment: options.environment || "all",
        rolloutPercentage: options.rolloutPercentage || 100,
        createdAt: now,
        updatedAt: now,
        createdBy: "kiro-system",
      };
    }

    this.registry.lastUpdated = now;
    await this.saveRegistry();

    console.log(`✅ Feature '${name}' enabled successfully`);
    if (options.rolloutPercentage && options.rolloutPercentage < 100) {
      console.log(`📊 Rollout: ${options.rolloutPercentage}%`);
    }
  }

  async disableFeature(name: string): Promise<void> {
    console.log(`❌ Disabling feature: ${name}`);

    if (!this.registry.flags[name]) {
      throw new Error(`Feature flag not found: ${name}`);
    }

    this.registry.flags[name].enabled = false;
    this.registry.flags[name].updatedAt = new Date().toISOString();
    this.registry.lastUpdated = new Date().toISOString();
    await this.saveRegistry();

    console.log(`❌ Feature '${name}' disabled successfully`);
  }

  async isFeatureEnabled(
    name: string,
    context?: Record<string, any>
  ): Promise<boolean> {
    const flag = this.registry.flags[name];
    if (!flag) {
      return false;
    }

    if (!flag.enabled) {
      return false;
    }

    // Check rollout percentage
    if (flag.rolloutPercentage && flag.rolloutPercentage < 100) {
      const hash = this.hashString(name + (context?.userId || "anonymous"));
      const percentage = hash % 100;
      if (percentage >= flag.rolloutPercentage) {
        return false;
      }
    }

    // Check environment
    if (flag.environment && flag.environment !== "all") {
      const currentEnv = process.env.NODE_ENV || "development";
      if (flag.environment !== currentEnv) {
        return false;
      }
    }

    // Check conditions (if any)
    if (flag.conditions && context) {
      for (const [key, value] of Object.entries(flag.conditions)) {
        if (context[key] !== value) {
          return false;
        }
      }
    }

    return true;
  }

  async listFeatures(): Promise<void> {
    console.log("🏁 Feature Flags:");
    console.log("=================");

    const flags = Object.values(this.registry.flags);
    if (flags.length === 0) {
      console.log("No feature flags configured");
      return;
    }

    flags.forEach((flag) => {
      const status = flag.enabled ? "✅ Enabled" : "❌ Disabled";
      const rollout =
        flag.rolloutPercentage !== 100 ? ` (${flag.rolloutPercentage}%)` : "";
      const env = flag.environment !== "all" ? ` [${flag.environment}]` : "";

      console.log(`\n🏁 ${flag.name}`);
      console.log(`   Status: ${status}${rollout}${env}`);
      console.log(`   Description: ${flag.description}`);
      console.log(`   Created: ${new Date(flag.createdAt).toLocaleString()}`);
      console.log(`   Updated: ${new Date(flag.updatedAt).toLocaleString()}`);
      if (flag.conditions) {
        console.log(`   Conditions: ${JSON.stringify(flag.conditions)}`);
      }
    });
  }

  async setRollout(name: string, percentage: number): Promise<void> {
    if (!this.registry.flags[name]) {
      throw new Error(`Feature flag not found: ${name}`);
    }

    if (percentage < 0 || percentage > 100) {
      throw new Error("Rollout percentage must be between 0 and 100");
    }

    this.registry.flags[name].rolloutPercentage = percentage;
    this.registry.flags[name].updatedAt = new Date().toISOString();
    this.registry.lastUpdated = new Date().toISOString();
    await this.saveRegistry();

    console.log(`📊 Feature '${name}' rollout set to ${percentage}%`);
  }

  async removeFeature(name: string): Promise<void> {
    if (!this.registry.flags[name]) {
      throw new Error(`Feature flag not found: ${name}`);
    }

    delete this.registry.flags[name];
    this.registry.lastUpdated = new Date().toISOString();
    await this.saveRegistry();

    console.log(`🗑️ Feature '${name}' removed`);
  }

  private async initializeDefaultFlags(): Promise<void> {
    const now = new Date().toISOString();

    // Initialize with common feature flags
    this.registry.flags = {
      BEDROCK_DAILY_LOGBOOK_ENABLED: {
        name: "BEDROCK_DAILY_LOGBOOK_ENABLED",
        enabled: false,
        description: "Enable daily logbook generation",
        environment: "all",
        rolloutPercentage: 100,
        createdAt: now,
        updatedAt: now,
        createdBy: "system",
      },
      VC_TEST_ENABLED: {
        name: "VC_TEST_ENABLED",
        enabled: false,
        description: "Enable visibility component testing",
        environment: "all",
        rolloutPercentage: 100,
        createdAt: now,
        updatedAt: now,
        createdBy: "system",
      },
      AUTOPILOT_ENABLED: {
        name: "AUTOPILOT_ENABLED",
        enabled: false,
        description: "Enable autopilot mode for content creation",
        environment: "all",
        rolloutPercentage: 0, // Start with 0% rollout
        createdAt: now,
        updatedAt: now,
        createdBy: "system",
      },
    };
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private async saveRegistry(): Promise<void> {
    await fs.writeFile(
      this.registryPath,
      JSON.stringify(this.registry, null, 2)
    );
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log(`
Kiro Feature Flag System
Usage: tsx kiro-feature-system.ts <command> [options]

Commands:
  enable <name>                     Enable a feature flag
  disable <name>                    Disable a feature flag
  list                              List all feature flags
  check <name>                      Check if a feature is enabled
  rollout <name> <percentage>       Set rollout percentage
  remove <name>                     Remove a feature flag

Examples:
  tsx kiro-feature-system.ts enable BEDROCK_DAILY_LOGBOOK_ENABLED
  tsx kiro-feature-system.ts disable VC_TEST_ENABLED
  tsx kiro-feature-system.ts rollout AUTOPILOT_ENABLED 25
  tsx kiro-feature-system.ts list
    `);
    process.exit(0);
  }

  const featureSystem = new KiroFeatureSystem();
  await featureSystem.initialize();

  try {
    switch (command) {
      case "enable": {
        const name = args[1];
        if (!name) {
          throw new Error("Feature name is required");
        }
        await featureSystem.enableFeature(name);
        break;
      }
      case "disable": {
        const name = args[1];
        if (!name) {
          throw new Error("Feature name is required");
        }
        await featureSystem.disableFeature(name);
        break;
      }
      case "list":
        await featureSystem.listFeatures();
        break;
      case "check": {
        const name = args[1];
        if (!name) {
          throw new Error("Feature name is required");
        }
        const enabled = await featureSystem.isFeatureEnabled(name);
        console.log(
          `🏁 Feature '${name}' is ${enabled ? "✅ enabled" : "❌ disabled"}`
        );
        break;
      }
      case "rollout": {
        const name = args[1];
        const percentage = parseInt(args[2]);
        if (!name || isNaN(percentage)) {
          throw new Error("Feature name and percentage are required");
        }
        await featureSystem.setRollout(name, percentage);
        break;
      }
      case "remove": {
        const name = args[1];
        if (!name) {
          throw new Error("Feature name is required");
        }
        await featureSystem.removeFeature(name);
        break;
      }
      default:
        throw new Error(`Unknown command: ${command}`);
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { FeatureFlag, FeatureFlagRegistry, KiroFeatureSystem };
