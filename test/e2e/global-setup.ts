/**
 * Global E2E Test Setup
 * Part of System Optimization Enhancement - Task 4
 */

import { chromium, FullConfig } from "@playwright/test";
import fs from "fs";
import path from "path";

async function globalSetup(config: FullConfig) {
  console.log("🚀 Starting global E2E test setup...");

  // Create test results directories
  const testResultsDir = path.join(process.cwd(), "test-results");
  const dirs = [
    "e2e-report",
    "e2e-artifacts",
    "visual-report",
    "visual-artifacts",
    "cross-browser-report",
    "cross-browser-artifacts",
    "lighthouse",
  ];

  for (const dir of dirs) {
    const fullPath = path.join(testResultsDir, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`📁 Created directory: ${fullPath}`);
    }
  }

  // Setup authentication state if needed
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to the app and perform any necessary setup
    const baseURL =
      config?.projects?.[0]?.use?.baseURL ?? "http://localhost:5173";
    console.log(`🌐 Navigating to ${baseURL}`);

    await page.goto(baseURL, { waitUntil: "domcontentloaded", timeout: 30000 });

    // Wait for the app to be ready
    await page.waitForSelector("body", { timeout: 30000 });

    // Check if the app is responsive
    const title = await page.title();
    console.log(`📄 App title: ${title}`);

    // Save authentication state if login is required
    // This is a placeholder - implement actual login if needed
    const storageState = await context.storageState();
    const authFile = path.join(testResultsDir, "auth-state.json");
    fs.writeFileSync(authFile, JSON.stringify(storageState, null, 2));
    console.log(`🔐 Saved auth state to: ${authFile}`);
  } catch (error) {
    const baseURL =
      config?.projects?.[0]?.use?.baseURL ?? "http://localhost:5173";
    console.error(`❌ Could not reach app at ${baseURL}`);
    console.error("❌ Global setup failed:", error);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }

  console.log("✅ Global E2E test setup completed");
}

export default globalSetup;
