#!/usr/bin/env npx tsx

/**
 * QA Server API
 * Node.js server for running QA analysis (separates browser from Node-only code)
 */

import express from 'express';
import cors from 'cors';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { qaOrchestrator, QAConfig } from '../src/lib/quality-assurance';

const app = express();
const PORT = process.env.QA_SERVER_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Ensure reports directory exists
const reportsDir = join(process.cwd(), 'qa-reports');
if (!existsSync(reportsDir)) {
  mkdirSync(reportsDir, { recursive: true });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Full QA analysis endpoint
app.post('/api/qa/analyze', async (req, res) => {
  try {
    const { files = [], urls = [], config } = req.body;
    
    console.log(`🔍 Starting QA analysis for ${files.length} files and ${urls.length} URLs`);
    
    const result = await qaOrchestrator.runFullQAAnalysis(files, urls, config);
    
    // Save report to disk
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = join(reportsDir, `qa-report-${timestamp}.json`);
    writeFileSync(reportPath, JSON.stringify(result, null, 2));
    
    console.log(`✅ QA analysis completed - Status: ${result.overallStatus}`);
    
    res.json({
      success: true,
      result,
      reportPath: `qa-reports/qa-report-${timestamp}.json`,
    });
  } catch (error) {
    console.error('❌ QA analysis failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'QA analysis failed',
    });
  }
});

// Quick scan endpoint
app.post('/api/qa/quick-scan', async (req, res) => {
  try {
    const { files = [] } = req.body;
    
    console.log(`⚡ Starting quick scan for ${files.length} files`);
    
    const result = await qaOrchestrator.runQuickScan(files);
    
    res.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('❌ Quick scan failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Quick scan failed',
    });
  }
});

// Code review only endpoint
app.post('/api/qa/code-review', async (req, res) => {
  try {
    const { files = [] } = req.body;
    
    console.log(`🤖 Starting code review for ${files.length} files`);
    
    const result = await qaOrchestrator.runCodeReviewOnly(files);
    
    res.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('❌ Code review failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Code review failed',
    });
  }
});

// Security scan only endpoint
app.post('/api/qa/security-scan', async (req, res) => {
  try {
    const { files = [] } = req.body;
    
    console.log(`🔒 Starting security scan for ${files.length} files`);
    
    const result = await qaOrchestrator.runSecurityOnlyScan(files);
    
    res.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('❌ Security scan failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Security scan failed',
    });
  }
});

// Accessibility test only endpoint
app.post('/api/qa/accessibility-test', async (req, res) => {
  try {
    const { urls = [] } = req.body;
    
    console.log(`♿ Starting accessibility test for ${urls.length} URLs`);
    
    const result = await qaOrchestrator.runAccessibilityOnlyScan(urls);
    
    res.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('❌ Accessibility test failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Accessibility test failed',
    });
  }
});

// Quality gates only endpoint
app.post('/api/qa/quality-gates', async (req, res) => {
  try {
    const { config } = req.body;
    
    console.log('📊 Starting quality gates analysis');
    
    const result = await qaOrchestrator.runQualityGatesOnly(config);
    
    res.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('❌ Quality gates failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Quality gates failed',
    });
  }
});

// List available reports
app.get('/api/qa/reports', (req, res) => {
  try {
    const fs = require('fs');
    const reports = fs.readdirSync(reportsDir)
      .filter((file: string) => file.endsWith('.json'))
      .map((file: string) => ({
        name: file,
        path: `qa-reports/${file}`,
        created: fs.statSync(join(reportsDir, file)).mtime,
      }))
      .sort((a: any, b: any) => new Date(b.created).getTime() - new Date(a.created).getTime());
    
    res.json({
      success: true,
      reports,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to list reports',
    });
  }
});

// Get specific report
app.get('/api/qa/reports/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const reportPath = join(reportsDir, filename);
    
    if (!existsSync(reportPath)) {
      return res.status(404).json({
        success: false,
        error: 'Report not found',
      });
    }
    
    const fs = require('fs');
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
    
    res.json({
      success: true,
      report,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to read report',
    });
  }
});

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

// Start server (only if not in test mode)
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 QA Server running on http://localhost:${PORT}`);
    console.log(`📊 Reports directory: ${reportsDir}`);
    console.log(`🔍 Available endpoints:`);
    console.log(`   POST /api/qa/analyze - Full QA analysis`);
    console.log(`   POST /api/qa/quick-scan - Quick scan`);
    console.log(`   POST /api/qa/code-review - Code review only`);
    console.log(`   POST /api/qa/security-scan - Security scan only`);
    console.log(`   POST /api/qa/accessibility-test - Accessibility test only`);
    console.log(`   POST /api/qa/quality-gates - Quality gates only`);
    console.log(`   GET /api/qa/reports - List reports`);
    console.log(`   GET /health - Health check`);
  });
}

export default app;