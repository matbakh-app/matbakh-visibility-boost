#!/usr/bin/env tsx
/**
 * Sync to Slot Script - Deploy artifact to S3 Blue-Green slot
 * Uses AWS SDK v3 for reliable S3 operations with proper cache headers
 */

import { execSync } from 'child_process';
import { existsSync, readFile, readFileSync } from 'fs';
import { Upload } from 'lucide-react';
import { join } from 'path';
import { promisify } from 'util';

const readFileAsync = promisify(readFile);

interface SyncOptions {
    environment: 'development' | 'staging' | 'production';
    slot: 'blue' | 'green';
    artifactPath: string;
    dryRun?: boolean;
    skipValidation?: boolean;
    useMock?: boolean;
}

interface EnvironmentConfig {
    bucketName: string;
    region: string;
    distributionId: string;
    domain: string;
}

class SlotSyncer {
    private environments: Record<string, EnvironmentConfig> = {
        development: {
            bucketName: 'matbakhvcstack-webbucket12880f5b-svct6cxfbip5',
            region: 'eu-central-1',
            distributionId: 'E2W4JULEW8BXSD',
            domain: 'matbakh.app'
        },
        staging: {
            bucketName: 'matbakhvcstack-webbucket12880f5b-svct6cxfbip5',
            region: 'eu-central-1',
            distributionId: 'E2W4JULEW8BXSD',
            domain: 'matbakh.app'
        },
        production: {
            bucketName: 'matbakhvcstack-webbucket12880f5b-svct6cxfbip5',
            region: 'eu-central-1',
            distributionId: 'E2W4JULEW8BXSD',
            domain: 'matbakh.app'
        }
    };

    /**
     * Sync artifact to S3 slot
     */
    async syncToSlot(options: SyncOptions): Promise<void> {
        console.log(`🚀 Syncing to ${options.environment} ${options.slot} slot...`);

        const config = this.environments[options.environment];
        if (!config) {
            throw new Error(`Unknown environment: ${options.environment}`);
        }

        // Validate artifact
        if (!options.skipValidation) {
            await this.validateArtifact(options.artifactPath);
        }

        // Extract artifact
        const extractDir = await this.extractArtifact(options.artifactPath);

        try {
            // Sync to S3 slot
            await this.performS3Sync(config, options.slot, extractDir, options.dryRun, options.useMock);

            // Verify sync
            if (!options.dryRun) {
                await this.verifySyncSuccess(config, options.slot);
            }

            console.log('✅ Sync completed successfully');

        } finally {
            // Cleanup extracted files
            this.cleanup(extractDir);
        }
    }

    /**
     * Validate artifact before sync
     */
    private async validateArtifact(artifactPath: string): Promise<void> {
        console.log('🔍 Validating artifact...');

        if (!existsSync(artifactPath)) {
            throw new Error(`Artifact not found: ${artifactPath}`);
        }

        // Extract and validate manifest
        const tempDir = `/tmp/artifact-validate-${Date.now()}`;

        try {
            execSync(`mkdir -p "${tempDir}"`);
            execSync(`unzip -j "${artifactPath}" "deployment-manifest.json" -d "${tempDir}"`);

            const manifestPath = join(tempDir, 'deployment-manifest.json');
            if (!existsSync(manifestPath)) {
                throw new Error('Artifact missing deployment manifest');
            }

            const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

            if (!manifest.gitSha) {
                throw new Error('Manifest missing git SHA');
            }

            if (!manifest.files || manifest.files.length === 0) {
                throw new Error('Manifest missing file list');
            }

            console.log(`   ✅ Git SHA: ${manifest.gitSha}`);
            console.log(`   ✅ Files: ${manifest.files.length}`);
            console.log(`   ✅ Build time: ${manifest.buildTime}`);

        } finally {
            execSync(`rm -rf "${tempDir}"`);
        }
    }

    /**
     * Extract artifact to temporary directory
     */
    private async extractArtifact(artifactPath: string): Promise<string> {
        console.log('📦 Extracting artifact...');

        const extractDir = `/tmp/deploy-extract-${Date.now()}`;
        execSync(`mkdir -p "${extractDir}"`);
        execSync(`unzip -q "${artifactPath}" -d "${extractDir}"`);

        // Verify essential files exist
        const essentialFiles = ['index.html'];
        for (const file of essentialFiles) {
            const filePath = join(extractDir, file);
            if (!existsSync(filePath)) {
                throw new Error(`Essential file missing from artifact: ${file}`);
            }
        }

        console.log(`   ✅ Extracted to ${extractDir}`);
        return extractDir;
    }

    /**
     * Perform S3 sync with AWS SDK v3 and proper cache headers
     */
    private async performS3Sync(
        config: EnvironmentConfig,
        slot: 'blue' | 'green',
        sourceDir: string,
        dryRun = false,
        useMock = false
    ): Promise<void> {
        if (useMock) {
            console.log(`   ⚠️  Mock mode: Would sync to s3://${config.bucketName}/${slot}/`);
            return;
        }

        console.log(`📡 Syncing to s3://${config.bucketName}/${slot}/ using AWS SDK...`);

        if (dryRun) {
            console.log('   🔍 Dry run mode - listing files that would be uploaded:');
            await this.listFilesToUpload(sourceDir);
            return;
        }

        // Initialize S3 client
        const s3Client = new S3Client({
            region: config.region
        });

        try {
            // Upload all files with appropriate cache headers
            await this.uploadDirectoryToS3(s3Client, sourceDir, config.bucketName, slot);
            console.log(`   🎯 Sync completed to ${slot} slot using AWS SDK`);
        } catch (error) {
            throw new Error(`S3 SDK sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Upload directory to S3 using AWS SDK with proper cache headers
     */
    private async uploadDirectoryToS3(
        s3Client: S3Client,
        sourceDir: string,
        bucketName: string,
        slot: string
    ): Promise<void> {
        const files = await this.walkDirectory(sourceDir);
        let uploadCount = 0;

        for (const filePath of files) {
            const relativePath = relative(sourceDir, filePath).replace(/\\/g, '/');
            const s3Key = `${slot}/${relativePath}`;
            const cacheControl = this.getCacheControlForFile(relativePath);
            const contentType = this.getContentTypeForFile(relativePath);

            try {
                const fileContent = await readFileAsync(filePath);

                const upload = new Upload({
                    client: s3Client,
                    params: {
                        Bucket: bucketName,
                        Key: s3Key,
                        Body: fileContent,
                        CacheControl: cacheControl,
                        ContentType: contentType
                    }
                });

                await upload.done();
                console.log(`   ↑ ${s3Key} (${cacheControl})`);
                uploadCount++;
            } catch (error) {
                throw new Error(`Failed to upload ${s3Key}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }

        console.log(`   ✅ Uploaded ${uploadCount} files to S3`);
    }

    /**
     * Walk directory recursively to get all files
     */
    private async walkDirectory(dir: string): Promise<string[]> {
        const files: string[] = [];

        const walk = (currentDir: string) => {
            const entries = readdirSync(currentDir);

            for (const entry of entries) {
                const fullPath = join(currentDir, entry);
                const stat = statSync(fullPath);

                if (stat.isDirectory()) {
                    walk(fullPath);
                } else {
                    files.push(fullPath);
                }
            }
        };

        walk(dir);
        return files;
    }

    /**
     * Get appropriate cache control header for file
     */
    private getCacheControlForFile(filePath: string): string {
        // No cache for HTML files and manifests
        if (filePath.endsWith('index.html') ||
            filePath.endsWith('manifest.json') ||
            filePath.endsWith('service-worker.js') ||
            filePath.endsWith('deployment-manifest.json')) {
            return 'no-cache,no-store,must-revalidate';
        }

        // Long cache for hashed assets (contains hash in filename)
        if (/\.[0-9a-f]{8,}\./i.test(filePath)) {
            return 'public,max-age=31536000,immutable';
        }

        // Medium cache for other static assets
        return 'public,max-age=3600';
    }

    /**
     * Get appropriate content type for file
     */
    private getContentTypeForFile(filePath: string): string {
        const ext = extname(filePath).toLowerCase();

        const contentTypes: Record<string, string> = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.ico': 'image/x-icon',
            '.woff': 'font/woff',
            '.woff2': 'font/woff2',
            '.ttf': 'font/ttf',
            '.eot': 'application/vnd.ms-fontobject'
        };

        return contentTypes[ext] || 'application/octet-stream';
    }

    /**
     * List files that would be uploaded (for dry run)
     */
    private async listFilesToUpload(sourceDir: string): Promise<void> {
        const files = await this.walkDirectory(sourceDir);

        console.log(`   Files to upload (${files.length} total):`);
        for (const filePath of files) {
            const relativePath = relative(sourceDir, filePath).replace(/\\/g, '/');
            const cacheControl = this.getCacheControlForFile(relativePath);
            console.log(`     ${relativePath} (${cacheControl})`);
        }
    }

    /**
     * Verify sync success by checking key files
     */
    private async verifySyncSuccess(config: EnvironmentConfig, slot: 'blue' | 'green'): Promise<void> {
        console.log('🔍 Verifying sync success...');

        const keyFiles = ['index.html'];

        for (const file of keyFiles) {
            const s3Path = `s3://${config.bucketName}/${slot}/${file}`;

            try {
                const lsCommand = `aws s3 ls "${s3Path}" --region "${config.region}"`;
                execSync(lsCommand, { stdio: 'pipe' });
                console.log(`   ✅ ${file} verified`);
            } catch (error) {
                throw new Error(`Verification failed: ${file} not found in S3`);
            }
        }

        console.log('   ✅ All key files verified');
    }

    /**
     * Get current active slot by checking CloudFront origin
     */
    async getCurrentActiveSlot(environment: string): Promise<'blue' | 'green' | null> {
        const config = this.environments[environment];
        if (!config) {
            throw new Error(`Unknown environment: ${environment}`);
        }

        try {
            console.log('🔍 Checking current active slot...');

            // Get CloudFront distribution config
            const getConfigCommand = `
        aws cloudfront get-distribution-config \\
          --id "${config.distributionId}" \\
          --region "${config.region}" \\
          --query "DistributionConfig.Origins.Items[0].OriginPath" \\
          --output text
      `.replace(/\s+/g, ' ').trim();

            const originPath = execSync(getConfigCommand, { encoding: 'utf8' }).trim();

            if (originPath === '/blue') {
                console.log('   🔵 Current active slot: blue');
                return 'blue';
            } else if (originPath === '/green') {
                console.log('   🟢 Current active slot: green');
                return 'green';
            } else {
                console.log(`   ❓ Unknown origin path: ${originPath}`);
                return null;
            }
        } catch (error) {
            console.warn(`   ⚠️  Could not determine active slot: ${error.message}`);
            return null;
        }
    }

    /**
     * Get inactive slot (opposite of active)
     */
    async getInactiveSlot(environment: string): Promise<'blue' | 'green'> {
        const activeSlot = await this.getCurrentActiveSlot(environment);

        if (activeSlot === 'blue') {
            return 'green';
        } else if (activeSlot === 'green') {
            return 'blue';
        } else {
            // Default to green if unable to determine
            console.log('   🟢 Defaulting to green slot');
            return 'green';
        }
    }

    /**
     * List files in slot
     */
    async listSlotFiles(environment: string, slot: 'blue' | 'green'): Promise<void> {
        const config = this.environments[environment];
        if (!config) {
            throw new Error(`Unknown environment: ${environment}`);
        }

        const bucketPath = `s3://${config.bucketName}/${slot}/`;

        try {
            console.log(`📁 Files in ${environment} ${slot} slot:`);

            const lsCommand = `aws s3 ls "${bucketPath}" --recursive --human-readable --region "${config.region}"`;
            execSync(lsCommand, { stdio: 'inherit' });
        } catch (error) {
            console.error(`Failed to list files: ${error.message}`);
        }
    }

    /**
     * Cleanup temporary directory
     */
    private cleanup(dir: string): void {
        try {
            execSync(`rm -rf "${dir}"`);
        } catch (error) {
            console.warn(`Warning: Failed to cleanup ${dir}: ${error.message}`);
        }
    }
}

// CLI Interface
async function main() {
    const args = process.argv.slice(2);

    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
Sync to Slot Script

Usage: npm run deploy:sync [options]

Options:
  --env <environment>       Target environment (development|staging|production)
  --slot <slot>            Target slot (blue|green) - auto-detects inactive if not specified
  --artifact <path>        Path to deployment artifact
  --dry-run               Show what would be synced without actually doing it
  --skip-validation       Skip artifact validation
  --list-files            List files in slot
  --current-slot          Show current active slot
  --help, -h              Show this help message

Examples:
  npm run deploy:sync --env staging --artifact artifacts/web-dist-abc123.zip
  npm run deploy:sync --env production --slot green --artifact artifacts/web-dist-abc123.zip
  npm run deploy:sync --env production --current-slot
  npm run deploy:sync --env staging --slot blue --list-files
  npm run deploy:sync --env production --artifact artifacts/web-dist-abc123.zip --dry-run
`);
        return;
    }

    const syncer = new SlotSyncer();

    // Handle current-slot command
    if (args.includes('--current-slot')) {
        const envIndex = args.indexOf('--env');
        if (envIndex === -1 || !args[envIndex + 1]) {
            console.error('❌ --env is required with --current-slot');
            process.exit(1);
        }

        const environment = args[envIndex + 1];
        await syncer.getCurrentActiveSlot(environment);
        return;
    }

    // Handle list-files command
    if (args.includes('--list-files')) {
        const envIndex = args.indexOf('--env');
        const slotIndex = args.indexOf('--slot');

        if (envIndex === -1 || !args[envIndex + 1]) {
            console.error('❌ --env is required with --list-files');
            process.exit(1);
        }

        if (slotIndex === -1 || !args[slotIndex + 1]) {
            console.error('❌ --slot is required with --list-files');
            process.exit(1);
        }

        const environment = args[envIndex + 1];
        const slot = args[slotIndex + 1] as 'blue' | 'green';

        await syncer.listSlotFiles(environment, slot);
        return;
    }

    // Parse sync options
    const options: Partial<SyncOptions> = {};

    const envIndex = args.indexOf('--env');
    if (envIndex !== -1 && args[envIndex + 1]) {
        options.environment = args[envIndex + 1] as any;
    }

    const slotIndex = args.indexOf('--slot');
    if (slotIndex !== -1 && args[slotIndex + 1]) {
        options.slot = args[slotIndex + 1] as any;
    }

    const artifactIndex = args.indexOf('--artifact');
    if (artifactIndex !== -1 && args[artifactIndex + 1]) {
        options.artifactPath = args[artifactIndex + 1];
    }

    if (args.includes('--dry-run')) {
        options.dryRun = true;
    }

    if (args.includes('--skip-validation')) {
        options.skipValidation = true;
    }

    // Validate required options
    if (!options.environment) {
        console.error('❌ --env is required');
        process.exit(1);
    }

    if (!options.artifactPath) {
        console.error('❌ --artifact is required');
        process.exit(1);
    }

    // Auto-detect inactive slot if not specified
    if (!options.slot) {
        console.log('🔍 Auto-detecting inactive slot...');
        options.slot = await syncer.getInactiveSlot(options.environment);
    }

    try {
        await syncer.syncToSlot(options as SyncOptions);

        console.log('\n🎉 Slot sync completed successfully!');
        console.log(`   Environment: ${options.environment}`);
        console.log(`   Slot: ${options.slot}`);
        console.log(`   Artifact: ${options.artifactPath}`);

    } catch (error) {
        console.error('❌ Slot sync failed:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(error => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    });
}

export { SlotSyncer };
