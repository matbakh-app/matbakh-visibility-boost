#!/usr/bin/env tsx
/**
 * Kiro VC (Visibility Component) Test System
 *
 * Testing system for restaurant visibility components
 */
import { promises as fs } from "fs";
import path from "path";

interface VCTestScenario {
  name: string;
  description: string;
  restaurant: {
    name: string;
    address: string;
    cuisine: string;
    priceRange: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  testCriteria: {
    googlePresence: boolean;
    socialMediaPresence: boolean;
    reviewPlatforms: boolean;
    websiteOptimization: boolean;
    localSEO: boolean;
  };
}

interface VCTestResult {
  scenario: string;
  timestamp: string;
  restaurant: VCTestScenario["restaurant"];
  results: {
    googleMyBusiness: {
      found: boolean;
      verified: boolean;
      completeness: number;
      reviewCount: number;
      averageRating: number;
    };
    socialMedia: {
      facebook: { found: boolean; followers: number; engagement: number };
      instagram: { found: boolean; followers: number; engagement: number };
      twitter: { found: boolean; followers: number; engagement: number };
    };
    reviewPlatforms: {
      yelp: { found: boolean; reviewCount: number; rating: number };
      tripadvisor: { found: boolean; reviewCount: number; rating: number };
      opentable: { found: boolean; reviewCount: number; rating: number };
    };
    website: {
      hasWebsite: boolean;
      mobileOptimized: boolean;
      loadSpeed: number;
      seoScore: number;
    };
    localSEO: {
      localKeywordRanking: number;
      citationConsistency: number;
      localDirectoryPresence: number;
    };
  };
  overallScore: number;
  recommendations: string[];
  metrics: {
    visibilityScore: number;
    competitivenessScore: number;
    digitalPresenceScore: number;
    customerEngagementScore: number;
  };
}

class KiroVCTestSystem {
  private scenariosPath: string;
  private resultsPath: string;

  constructor() {
    this.scenariosPath = path.join(
      process.cwd(),
      ".kiro",
      "vc-test",
      "scenarios.json"
    );
    this.resultsPath = path.join(process.cwd(), ".kiro", "vc-test", "results");
  }

  async initialize(): Promise<void> {
    await fs.mkdir(path.dirname(this.scenariosPath), { recursive: true });
    await fs.mkdir(this.resultsPath, { recursive: true });

    // Initialize default scenarios if they don't exist
    try {
      await fs.access(this.scenariosPath);
    } catch (error) {
      await this.initializeDefaultScenarios();
    }
  }

  async runTest(
    scenarioName: string,
    options: {
      sandbox?: boolean;
      collectMetrics?: boolean;
      verbose?: boolean;
    } = {}
  ): Promise<VCTestResult> {
    const {
      sandbox = false,
      collectMetrics = false,
      verbose = false,
    } = options;

    if (verbose) {
      console.log(`🧪 Running VC test: ${scenarioName}`);
      console.log(`📊 Sandbox mode: ${sandbox ? "enabled" : "disabled"}`);
      console.log(
        `📈 Collect metrics: ${collectMetrics ? "enabled" : "disabled"}`
      );
    }

    // Load scenario
    const scenario = await this.loadScenario(scenarioName);
    if (!scenario) {
      throw new Error(`Scenario not found: ${scenarioName}`);
    }

    if (verbose) {
      console.log(`🏪 Testing restaurant: ${scenario.restaurant.name}`);
      console.log(`📍 Location: ${scenario.restaurant.address}`);
    }

    // Run the test
    const result = await this.executeTest(scenario, {
      sandbox,
      collectMetrics,
      verbose,
    });

    // Save results
    await this.saveResult(result);

    if (verbose) {
      console.log(
        `✅ Test completed with overall score: ${result.overallScore}/100`
      );
    }

    return result;
  }

  async listScenarios(): Promise<void> {
    console.log("🧪 Available VC Test Scenarios:");
    console.log("==============================");

    const scenarios = await this.loadAllScenarios();
    scenarios.forEach((scenario) => {
      console.log(`\n🏪 ${scenario.name}`);
      console.log(`   Description: ${scenario.description}`);
      console.log(`   Restaurant: ${scenario.restaurant.name}`);
      console.log(`   Cuisine: ${scenario.restaurant.cuisine}`);
      console.log(`   Price Range: ${scenario.restaurant.priceRange}`);
      console.log(`   Address: ${scenario.restaurant.address}`);
    });
  }

  async getResults(scenarioName?: string, limit: number = 10): Promise<void> {
    console.log("📊 VC Test Results:");
    console.log("==================");

    const resultFiles = await fs.readdir(this.resultsPath);
    const jsonFiles = resultFiles.filter((file) => file.endsWith(".json"));

    // Sort by timestamp (newest first)
    jsonFiles.sort((a, b) => b.localeCompare(a));

    const filesToShow = jsonFiles.slice(0, limit);

    for (const file of filesToShow) {
      const resultPath = path.join(this.resultsPath, file);
      const resultData = await fs.readFile(resultPath, "utf-8");
      const result: VCTestResult = JSON.parse(resultData);

      if (scenarioName && result.scenario !== scenarioName) {
        continue;
      }

      console.log(`\n📅 ${new Date(result.timestamp).toLocaleString()}`);
      console.log(`🏪 ${result.restaurant.name} (${result.scenario})`);
      console.log(`📊 Overall Score: ${result.overallScore}/100`);
      console.log(`📈 Visibility: ${result.metrics.visibilityScore}/100`);
      console.log(
        `🏆 Competitiveness: ${result.metrics.competitivenessScore}/100`
      );
      console.log(
        `💻 Digital Presence: ${result.metrics.digitalPresenceScore}/100`
      );
      console.log(
        `👥 Customer Engagement: ${result.metrics.customerEngagementScore}/100`
      );

      if (result.recommendations.length > 0) {
        console.log(`💡 Top Recommendations:`);
        result.recommendations.slice(0, 3).forEach((rec) => {
          console.log(`   • ${rec}`);
        });
      }
    }
  }

  private async loadScenario(name: string): Promise<VCTestScenario | null> {
    const scenarios = await this.loadAllScenarios();
    return scenarios.find((s) => s.name === name) || null;
  }

  private async loadAllScenarios(): Promise<VCTestScenario[]> {
    try {
      const scenariosData = await fs.readFile(this.scenariosPath, "utf-8");
      return JSON.parse(scenariosData);
    } catch (error) {
      return [];
    }
  }

  private async executeTest(
    scenario: VCTestScenario,
    options: {
      sandbox: boolean;
      collectMetrics: boolean;
      verbose: boolean;
    }
  ): Promise<VCTestResult> {
    const { sandbox, collectMetrics, verbose } = options;

    if (verbose) {
      console.log(`🔍 Analyzing ${scenario.restaurant.name}...`);
    }

    // Simulate test execution with mock data
    const result: VCTestResult = {
      scenario: scenario.name,
      timestamp: new Date().toISOString(),
      restaurant: scenario.restaurant,
      results: {
        googleMyBusiness: {
          found: Math.random() > 0.2,
          verified: Math.random() > 0.3,
          completeness: Math.floor(Math.random() * 40) + 60, // 60-100%
          reviewCount: Math.floor(Math.random() * 200) + 10,
          averageRating: Math.round((Math.random() * 2 + 3) * 10) / 10, // 3.0-5.0
        },
        socialMedia: {
          facebook: {
            found: Math.random() > 0.4,
            followers: Math.floor(Math.random() * 5000) + 100,
            engagement: Math.round(Math.random() * 10 * 10) / 10, // 0-10%
          },
          instagram: {
            found: Math.random() > 0.3,
            followers: Math.floor(Math.random() * 3000) + 50,
            engagement: Math.round(Math.random() * 15 * 10) / 10, // 0-15%
          },
          twitter: {
            found: Math.random() > 0.7,
            followers: Math.floor(Math.random() * 1000) + 20,
            engagement: Math.round(Math.random() * 5 * 10) / 10, // 0-5%
          },
        },
        reviewPlatforms: {
          yelp: {
            found: Math.random() > 0.3,
            reviewCount: Math.floor(Math.random() * 150) + 5,
            rating: Math.round((Math.random() * 2 + 3) * 10) / 10,
          },
          tripadvisor: {
            found: Math.random() > 0.5,
            reviewCount: Math.floor(Math.random() * 100) + 3,
            rating: Math.round((Math.random() * 2 + 3) * 10) / 10,
          },
          opentable: {
            found: Math.random() > 0.6,
            reviewCount: Math.floor(Math.random() * 80) + 2,
            rating: Math.round((Math.random() * 2 + 3) * 10) / 10,
          },
        },
        website: {
          hasWebsite: Math.random() > 0.2,
          mobileOptimized: Math.random() > 0.4,
          loadSpeed: Math.round((Math.random() * 3 + 1) * 100) / 100, // 1-4 seconds
          seoScore: Math.floor(Math.random() * 40) + 50, // 50-90
        },
        localSEO: {
          localKeywordRanking: Math.floor(Math.random() * 20) + 1, // 1-20
          citationConsistency: Math.floor(Math.random() * 30) + 70, // 70-100%
          localDirectoryPresence: Math.floor(Math.random() * 40) + 60, // 60-100%
        },
      },
      overallScore: 0,
      recommendations: [],
      metrics: {
        visibilityScore: 0,
        competitivenessScore: 0,
        digitalPresenceScore: 0,
        customerEngagementScore: 0,
      },
    };

    // Calculate scores
    result.metrics = this.calculateMetrics(result);
    result.overallScore = Math.round(
      (result.metrics.visibilityScore +
        result.metrics.competitivenessScore +
        result.metrics.digitalPresenceScore +
        result.metrics.customerEngagementScore) /
        4
    );

    // Generate recommendations
    result.recommendations = this.generateRecommendations(result);

    if (verbose) {
      console.log(`📊 Analysis complete - Score: ${result.overallScore}/100`);
    }

    return result;
  }

  private calculateMetrics(result: VCTestResult): VCTestResult["metrics"] {
    // Visibility Score (Google presence, local SEO)
    const visibilityScore = Math.round(
      (result.results.googleMyBusiness.found ? 30 : 0) +
        (result.results.googleMyBusiness.verified ? 20 : 0) +
        result.results.googleMyBusiness.completeness * 0.3 +
        result.results.localSEO.localDirectoryPresence * 0.2
    );

    // Competitiveness Score (rankings, ratings)
    const competitivenessScore = Math.round(
      result.results.googleMyBusiness.averageRating * 15 +
        Math.max(0, 21 - result.results.localSEO.localKeywordRanking) * 2 +
        result.results.reviewPlatforms.yelp.rating * 10 +
        result.results.reviewPlatforms.tripadvisor.rating * 5
    );

    // Digital Presence Score (website, social media)
    const digitalPresenceScore = Math.round(
      (result.results.website.hasWebsite ? 25 : 0) +
        (result.results.website.mobileOptimized ? 15 : 0) +
        result.results.website.seoScore * 0.3 +
        (result.results.socialMedia.facebook.found ? 10 : 0) +
        (result.results.socialMedia.instagram.found ? 15 : 0) +
        (result.results.socialMedia.twitter.found ? 5 : 0)
    );

    // Customer Engagement Score (reviews, social engagement)
    const customerEngagementScore = Math.round(
      Math.min(result.results.googleMyBusiness.reviewCount, 100) * 0.3 +
        result.results.socialMedia.facebook.engagement * 5 +
        result.results.socialMedia.instagram.engagement * 3 +
        Math.min(result.results.reviewPlatforms.yelp.reviewCount, 50) * 0.4 +
        Math.min(result.results.reviewPlatforms.tripadvisor.reviewCount, 30) *
          0.3
    );

    return {
      visibilityScore: Math.min(100, visibilityScore),
      competitivenessScore: Math.min(100, competitivenessScore),
      digitalPresenceScore: Math.min(100, digitalPresenceScore),
      customerEngagementScore: Math.min(100, customerEngagementScore),
    };
  }

  private generateRecommendations(result: VCTestResult): string[] {
    const recommendations: string[] = [];

    // Google My Business recommendations
    if (!result.results.googleMyBusiness.found) {
      recommendations.push(
        "🎯 Create and claim your Google My Business profile"
      );
    } else if (!result.results.googleMyBusiness.verified) {
      recommendations.push("✅ Verify your Google My Business profile");
    } else if (result.results.googleMyBusiness.completeness < 80) {
      recommendations.push(
        "📝 Complete your Google My Business profile (add photos, hours, description)"
      );
    }

    // Website recommendations
    if (!result.results.website.hasWebsite) {
      recommendations.push(
        "🌐 Create a professional website for your restaurant"
      );
    } else if (!result.results.website.mobileOptimized) {
      recommendations.push("📱 Optimize your website for mobile devices");
    } else if (result.results.website.loadSpeed > 3) {
      recommendations.push(
        "⚡ Improve website loading speed (currently " +
          result.results.website.loadSpeed +
          "s)"
      );
    }

    // Social Media recommendations
    if (!result.results.socialMedia.instagram.found) {
      recommendations.push(
        "📸 Create an Instagram account to showcase your food"
      );
    }
    if (!result.results.socialMedia.facebook.found) {
      recommendations.push("👥 Set up a Facebook page for customer engagement");
    }

    // Review platform recommendations
    if (result.results.googleMyBusiness.reviewCount < 20) {
      recommendations.push("⭐ Encourage customers to leave Google reviews");
    }
    if (!result.results.reviewPlatforms.yelp.found) {
      recommendations.push("🍽️ Claim your Yelp business profile");
    }

    // Local SEO recommendations
    if (result.results.localSEO.localKeywordRanking > 10) {
      recommendations.push(
        "🔍 Improve local SEO to rank higher for local searches"
      );
    }
    if (result.results.localSEO.citationConsistency < 85) {
      recommendations.push(
        "📋 Ensure consistent business information across all directories"
      );
    }

    return recommendations.slice(0, 8); // Limit to top 8 recommendations
  }

  private async saveResult(result: VCTestResult): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `${result.scenario}-${timestamp}.json`;
    const resultPath = path.join(this.resultsPath, filename);

    await fs.writeFile(resultPath, JSON.stringify(result, null, 2));
  }

  private async initializeDefaultScenarios(): Promise<void> {
    const defaultScenarios: VCTestScenario[] = [
      {
        name: "single-location-starter",
        description:
          "Basic test for a single-location restaurant starting their digital presence",
        restaurant: {
          name: "Bella Vista Trattoria",
          address: "Maximilianstraße 15, 80539 München",
          cuisine: "Italian",
          priceRange: "€€",
        },
        testCriteria: {
          googlePresence: true,
          socialMediaPresence: true,
          reviewPlatforms: true,
          websiteOptimization: true,
          localSEO: true,
        },
      },
      {
        name: "established-restaurant",
        description:
          "Test for an established restaurant with existing online presence",
        restaurant: {
          name: "Gasthaus Zum Löwen",
          address: "Marienplatz 8, 80331 München",
          cuisine: "German",
          priceRange: "€€€",
        },
        testCriteria: {
          googlePresence: true,
          socialMediaPresence: true,
          reviewPlatforms: true,
          websiteOptimization: true,
          localSEO: true,
        },
      },
      {
        name: "fast-casual-chain",
        description: "Test for a fast-casual restaurant chain location",
        restaurant: {
          name: "Fresh Bowl Express",
          address: "Leopoldstraße 42, 80802 München",
          cuisine: "Healthy Fast Food",
          priceRange: "€",
        },
        testCriteria: {
          googlePresence: true,
          socialMediaPresence: true,
          reviewPlatforms: true,
          websiteOptimization: true,
          localSEO: true,
        },
      },
    ];

    await fs.writeFile(
      this.scenariosPath,
      JSON.stringify(defaultScenarios, null, 2)
    );
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log(`
Kiro VC Test System
Usage: tsx kiro-vc-test.ts <command> [options]

Commands:
  test <scenario>                   Run a VC test for a scenario
  list                              List available test scenarios
  results [scenario] [limit]        Show test results

Options:
  --sandbox                         Run in sandbox mode (no real API calls)
  --collect-metrics                 Collect detailed metrics
  --verbose                         Enable verbose output

Examples:
  tsx kiro-vc-test.ts test single-location-starter --sandbox --collect-metrics --verbose
  tsx kiro-vc-test.ts list
  tsx kiro-vc-test.ts results single-location-starter 5
    `);
    process.exit(0);
  }

  const vcTest = new KiroVCTestSystem();
  await vcTest.initialize();

  try {
    switch (command) {
      case "test": {
        const scenario = args[1];
        if (!scenario) {
          throw new Error("Scenario name is required");
        }

        const options = {
          sandbox: args.includes("--sandbox"),
          collectMetrics: args.includes("--collect-metrics"),
          verbose: args.includes("--verbose"),
        };

        const result = await vcTest.runTest(scenario, options);

        console.log(`\n🎉 Test Results for ${result.restaurant.name}`);
        console.log(`📊 Overall Score: ${result.overallScore}/100`);
        console.log(`📈 Visibility: ${result.metrics.visibilityScore}/100`);
        console.log(
          `🏆 Competitiveness: ${result.metrics.competitivenessScore}/100`
        );
        console.log(
          `💻 Digital Presence: ${result.metrics.digitalPresenceScore}/100`
        );
        console.log(
          `👥 Customer Engagement: ${result.metrics.customerEngagementScore}/100`
        );

        if (result.recommendations.length > 0) {
          console.log(`\n💡 Key Recommendations:`);
          result.recommendations.slice(0, 5).forEach((rec, index) => {
            console.log(`   ${index + 1}. ${rec}`);
          });
        }
        break;
      }
      case "list":
        await vcTest.listScenarios();
        break;
      case "results": {
        const scenario = args[1];
        const limit = args[2] ? parseInt(args[2]) : 10;
        await vcTest.getResults(scenario, limit);
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

export { KiroVCTestSystem, VCTestResult, VCTestScenario };
