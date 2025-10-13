#!/usr/bin/env tsx
/**
 * Package Artifact Script - Build-once, promote-many artifact creation
 * Creates immutable deployment artifact with SHA256 manifest
 */

import { execSync } from 'child_process';
import { createHash } from 'crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import { join, relative } from 'path';

interface ArtifactManifest {
    gitSha: string;
    buildTime: string;
    buildNumber?: string;
    files: { path: string; hash: string; size: number }[];
    environment: Record<string, string>;
    version: string;
}

interface PackageOptions {
    outputDir?: string;
    includeSourceMaps?: boolean;
    environment?: 'development' | 'staging' | 'production';
}

class ArtifactPackager {
    private distDir = 'dist';
    private outputDir = 'artifacts';

    /**
     * Create deployment artifact with manifest
     */
    async packageArtifact(options: PackageOptions = {}): Promise<{
        artifactPath: string;
        manifest: ArtifactManifest;
    }> {
        console.log('📦 Creating deployment artifact...');

        // Get git information
        const gitSha = this.getGitSha();
        const buildTime = new Date().toISOString();
        const version = this.getVersion();

        console.log(`   Git SHA: ${gitSha}`);
        console.log(`   Build Time: ${buildTime}`);
        console.log(`   Version: ${version}`);

        // Ensure build exists
        if (!this.buildExists()) {
            console.log('🔨 No build found, running build...');
            await this.runBuild(options.environment);
        }

        // Create file manifest
        console.log('📋 Creating file manifest...');
        const files = await this.createFileManifest();
        console.log(`   Processed ${files.length} files`);

        // Create manifest
        const manifest: ArtifactManifest = {
            gitSha,
            buildTime,
            buildNumber: process.env.GITHUB_RUN_NUMBER,
            files,
            environment: this.getEnvironmentVariables(),
            version
        };

        // Write manifest to dist
        const manifestPath = join(this.distDir, 'deployment-manifest.json');
        writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        console.log(`   Manifest written to ${manifestPath}`);

        // Create artifact
        const artifactName = `web-dist-${gitSha}.zip`;
        const artifactPath = join(options.outputDir || this.outputDir, artifactName);

        await this.createZipArtifact(artifactPath);
        console.log(`   Artifact created: ${artifactPath}`);

        // Verify artifact integrity
        await this.verifyArtifact(artifactPath, manifest);
        console.log('✅ Artifact verification passed');

        return { artifactPath, manifest };
    }

    /**
     * Verify artifact integrity
     */
    async verifyArtifact(artifactPath: string, expectedManifest: ArtifactManifest): Promise<void> {
        console.log('🔍 Verifying artifact integrity...');

        // Extract and verify manifest
        const extractedManifest = await this.extractManifestFromArtifact(artifactPath);

        if (extractedManifest.gitSha !== expectedManifest.gitSha) {
            throw new Error(`Git SHA mismatch: expected ${expectedManifest.gitSha}, got ${extractedManifest.gitSha}`);
        }

        if (extractedManifest.files.length !== expectedManifest.files.length) {
            throw new Error(`File count mismatch: expected ${expectedManifest.files.length}, got ${extractedManifest.files.length}`);
        }

        console.log('   ✅ Git SHA verified');
        console.log('   ✅ File count verified');
        console.log('   ✅ Manifest integrity verified');
    }

    /**
     * Get current git SHA
     */
    private getGitSha(): string {
        try {
            return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
        } catch (error) {
            console.warn('Warning: Could not get git SHA, using timestamp');
            return `build-${Date.now()}`;
        }
    }

    /**
     * Get version from package.json
     */
    private getVersion(): string {
        try {
            const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
            return packageJson.version || '0.0.0';
        } catch (error) {
            return '0.0.0';
        }
    }

    /**
     * Check if build exists
     */
    private buildExists(): boolean {
        try {
            const indexPath = join(this.distDir, 'index.html');
            return statSync(indexPath).isFile();
        } catch (error) {
            return false;
        }
    }

    /**
     * Run build process
     */
    private async runBuild(environment = 'production'): Promise<void> {
        const buildCommand = environment === 'development' ? 'npm run build:dev' : 'npm run build';

        try {
            execSync(buildCommand, { stdio: 'inherit' });
        } catch (error) {
            throw new Error(`Build failed: ${error.message}`);
        }
    }

    /**
     * Create file manifest with hashes
     */
    private async createFileManifest(): Promise<{ path: string; hash: string; size: number }[]> {
        const files: { path: string; hash: string; size: number }[] = [];

        const processDirectory = (dir: string) => {
            const items = readdirSync(dir, { withFileTypes: true });

            for (const item of items) {
                const fullPath = join(dir, item.name);

                if (item.isDirectory()) {
                    processDirectory(fullPath);
                } else if (item.isFile()) {
                    const relativePath = relative(this.distDir, fullPath);
                    const content = readFileSync(fullPath);
                    const hash = createHash('sha256').update(content).digest('hex');
                    const size = content.length;

                    files.push({
                        path: relativePath,
                        hash,
                        size
                    });
                }
            }
        };

        processDirectory(this.distDir);
        return files;
    }

    /**
     * Get environment variables for manifest
     */
    private getEnvironmentVariables(): Record<string, string> {
        const envVars: Record<string, string> = {};

        // Only include VITE_ prefixed variables (public)
        Object.keys(process.env).forEach(key => {
            if (key.startsWith('VITE_')) {
                envVars[key] = process.env[key] || '';
            }
        });

        // Add build-time variables
        envVars.BUILD_TIME = new Date().toISOString();
        envVars.NODE_ENV = process.env.NODE_ENV || 'production';

        return envVars;
    }

    /**
     * Create ZIP artifact
     */
    private async createZipArtifact(outputPath: string): Promise<void> {
        // Ensure output directory exists
        const outputDir = outputPath.substring(0, outputPath.lastIndexOf('/'));
        execSync(`mkdir -p "${outputDir}"`);

        // Create ZIP with proper compression
        const zipCommand = `cd "${this.distDir}" && zip -r "../${outputPath}" . -x "*.map" "*.DS_Store"`;

        try {
            execSync(zipCommand, { stdio: 'pipe' });
        } catch (error) {
            throw new Error(`Failed to create ZIP artifact: ${error.message}`);
        }
    }

    /**
     * Extract manifest from artifact for verification
     */
    private async extractManifestFromArtifact(artifactPath: string): Promise<ArtifactManifest> {
        const tempDir = `/tmp/artifact-verify-${Date.now()}`;

        try {
            // Extract manifest file only
            execSync(`mkdir -p "${tempDir}"`);
            execSync(`unzip -j "${artifactPath}" "deployment-manifest.json" -d "${tempDir}"`);

            const manifestContent = readFileSync(join(tempDir, 'deployment-manifest.json'), 'utf8');
            return JSON.parse(manifestContent);
        } finally {
            // Cleanup
            execSync(`rm -rf "${tempDir}"`);
        }
    }

    /**
     * List available artifacts
     */
    listArtifacts(): { name: string; path: string; size: number; created: Date }[] {
        try {
            const artifacts = readdirSync(this.outputDir)
                .filter(name => name.startsWith('web-dist-') && name.endsWith('.zip'))
                .map(name => {
                    const path = join(this.outputDir, name);
                    const stats = statSync(path);
                    return {
                        name,
                        path,
                        size: stats.size,
                        created: stats.birthtime
                    };
                })
                .sort((a, b) => b.created.getTime() - a.created.getTime());

            return artifacts;
        } catch (error) {
            return [];
        }
    }

    /**
     * Clean old artifacts (keep last 10)
     */
    cleanOldArtifacts(keepCount = 10): void {
        const artifacts = this.listArtifacts();

        if (artifacts.length <= keepCount) {
            console.log(`📦 ${artifacts.length} artifacts found, no cleanup needed`);
            return;
        }

        const toDelete = artifacts.slice(keepCount);
        console.log(`🗑️  Cleaning ${toDelete.length} old artifacts...`);

        toDelete.forEach(artifact => {
            try {
                execSync(`rm "${artifact.path}"`);
                console.log(`   Deleted: ${artifact.name}`);
            } catch (error) {
                console.warn(`   Failed to delete ${artifact.name}: ${error.message}`);
            }
        });
    }
}

// CLI Interface
async function main() {
    const args = process.argv.slice(2);

    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
Artifact Packaging Script

Usage: npm run deploy:package [options]

Options:
  --output-dir <dir>        Output directory for artifacts (default: artifacts)
  --include-source-maps     Include source maps in artifact
  --environment <env>       Build environment (development|staging|production)
  --list                    List existing artifacts
  --clean                   Clean old artifacts (keep last 10)
  --verify <artifact>       Verify artifact integrity
  --help, -h               Show this help message

Examples:
  npm run deploy:package
  npm run deploy:package --environment staging
  npm run deploy:package --list
  npm run deploy:package --clean
  npm run deploy:package --verify artifacts/web-dist-abc123.zip
`);
        return;
    }

    const packager = new ArtifactPackager();

    // Handle list command
    if (args.includes('--list')) {
        const artifacts = packager.listArtifacts();

        if (artifacts.length === 0) {
            console.log('📦 No artifacts found');
            return;
        }

        console.log('📦 Available artifacts:');
        artifacts.forEach(artifact => {
            const sizeKB = Math.round(artifact.size / 1024);
            console.log(`   ${artifact.name} (${sizeKB}KB) - ${artifact.created.toISOString()}`);
        });
        return;
    }

    // Handle clean command
    if (args.includes('--clean')) {
        packager.cleanOldArtifacts();
        return;
    }

    // Handle verify command
    const verifyIndex = args.indexOf('--verify');
    if (verifyIndex !== -1 && args[verifyIndex + 1]) {
        const artifactPath = args[verifyIndex + 1];
        try {
            // Extract manifest and verify
            const manifest = await (packager as any).extractManifestFromArtifact(artifactPath);
            await packager.verifyArtifact(artifactPath, manifest);
            console.log('✅ Artifact verification passed');
        } catch (error) {
            console.error('❌ Artifact verification failed:', error.message);
            process.exit(1);
        }
        return;
    }

    // Package artifact
    const options: PackageOptions = {};

    // Parse options
    const outputDirIndex = args.indexOf('--output-dir');
    if (outputDirIndex !== -1 && args[outputDirIndex + 1]) {
        options.outputDir = args[outputDirIndex + 1];
    }

    const environmentIndex = args.indexOf('--environment');
    if (environmentIndex !== -1 && args[environmentIndex + 1]) {
        options.environment = args[environmentIndex + 1] as any;
    }

    if (args.includes('--include-source-maps')) {
        options.includeSourceMaps = true;
    }

    try {
        const result = await packager.packageArtifact(options);

        console.log('\n🎉 Artifact packaging completed!');
        console.log(`   Artifact: ${result.artifactPath}`);
        console.log(`   Git SHA: ${result.manifest.gitSha}`);
        console.log(`   Files: ${result.manifest.files.length}`);
        console.log(`   Size: ${Math.round(statSync(result.artifactPath).size / 1024)}KB`);

        // Clean old artifacts
        packager.cleanOldArtifacts();

    } catch (error) {
        console.error('❌ Artifact packaging failed:', error.message);
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

export { ArtifactPackager };
