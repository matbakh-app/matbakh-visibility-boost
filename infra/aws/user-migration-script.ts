
import { CognitoIdentityServiceProvider } from 'aws-sdk';
import { Client } from 'pg';
import * as fs from 'fs';
import * as csv from 'csv-parser';

interface SupabaseUser {
    id: string;
    email: string;
    encrypted_password: string;
    email_confirmed_at: string | null;
    created_at: string;
    updated_at: string;
    raw_user_meta_data: any;
    raw_app_meta_data: any;
}

interface UserProfile {
    id: string;
    email: string;
    role: string;
    display_name: string | null;
    avatar_url: string | null;
}

interface PrivateProfile {
    user_id: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    preferences: any;
}

interface MigrationUser {
    supabaseId: string;
    email: string;
    emailVerified: boolean;
    givenName: string | null;
    familyName: string | null;
    phone: string | null;
    role: string;
    locale: string;
    profileComplete: boolean;
    onboardingStep: number;
    businessId: string | null;
    displayName: string | null;
    createdAt: string;
}

class UserMigrationService {
    private cognito: CognitoIdentityServiceProvider;
    private supabaseClient: Client;
    private userPoolId: string;

    constructor(userPoolId: string) {
        this.cognito = new CognitoIdentityServiceProvider({ region: 'eu-central-1' });
        this.userPoolId = userPoolId;

        // Supabase connection
        this.supabaseClient = new Client({
            host: 'db.uheksobnyedarrpgxhju.supabase.co',
            database: 'postgres',
            user: 'postgres',
            password: process.env.SUPABASE_PASSWORD || '',
            port: 5432,
            ssl: { rejectUnauthorized: false }
        });
    }

    /**
     * Main migration function
     */
    async migrateUsers(): Promise<void> {
        console.log('🚀 Starting user migration from Supabase to Cognito...');

        try {
            await this.supabaseClient.connect();
            console.log('✅ Connected to Supabase');

            // Get all users from Supabase
            const users = await this.fetchSupabaseUsers();
            console.log(`📊 Found ${users.length} users to migrate`);

            // Create CSV for bulk import
            await this.createImportCSV(users);

            // Generate migration report
            await this.generateMigrationReport(users);

            console.log('✅ Migration preparation completed');
            console.log('📁 Files generated:');
            console.log('  - cognito-user-import.csv (for bulk import)');
            console.log('  - migration-report.json (detailed analysis)');
            console.log('  - migration-preview.json (sample users)');

        } catch (error) {
            console.error('❌ Migration failed:', error);
            throw error;
        } finally {
            await this.supabaseClient.end();
        }
    }

    /**
     * Fetch all users from Supabase with their profiles
     */
    private async fetchSupabaseUsers(): Promise<MigrationUser[]> {
        const query = `
            SELECT 
                u.id,
                u.email,
                u.encrypted_password,
                u.email_confirmed_at,
                u.created_at,
                u.updated_at,
                u.raw_user_meta_data,
                u.raw_app_meta_data,
                p.role,
                p.display_name,
                p.avatar_url,
                pp.first_name,
                pp.last_name,
                pp.phone,
                pp.preferences,
                bp.id as business_id
            FROM auth.users u
            LEFT JOIN public.profiles p ON u.id = p.id
            LEFT JOIN public.private_profiles pp ON u.id = pp.user_id
            LEFT JOIN public.business_partners bp ON u.id = bp.user_id
            WHERE u.deleted_at IS NULL
            ORDER BY u.created_at ASC
        `;

        const result = await this.supabaseClient.query(query);

        return result.rows.map(row => ({
            supabaseId: row.id,
            email: row.email,
            emailVerified: !!row.email_confirmed_at,
            givenName: row.first_name || this.extractFirstName(row.display_name),
            familyName: row.last_name || this.extractLastName(row.display_name),
            phone: row.phone,
            role: row.role || 'owner',
            locale: row.preferences?.locale || 'de',
            profileComplete: this.isProfileComplete(row),
            onboardingStep: row.preferences?.onboarding_step || 0,
            businessId: row.business_id,
            displayName: row.display_name,
            createdAt: row.created_at
        }));
    }

    /**
     * Create CSV file for Cognito bulk import
     */
    private async createImportCSV(users: MigrationUser[]): Promise<void> {
        const headers = [
            'cognito:username',
            'cognito:mfa_enabled',
            'email_verified',
            'email',
            'given_name',
            'family_name',
            'phone_number',
            'custom:user_role',
            'custom:locale',
            'custom:profile_complete',
            'custom:onboarding_step',
            'custom:business_id',
            'custom:supabase_id'
        ];

        const csvContent = [
            headers.join(','),
            ...users.map(user => [
                user.email,
                'FALSE',
                user.emailVerified ? 'TRUE' : 'FALSE',
                user.email,
                this.escapeCsvValue(user.givenName || ''),
                this.escapeCsvValue(user.familyName || ''),
                user.phone || '',
                user.role,
                user.locale,
                user.profileComplete ? 'true' : 'false',
                user.onboardingStep.toString(),
                user.businessId || '',
                user.supabaseId
            ].join(','))
        ].join('\n');

        fs.writeFileSync('cognito-user-import.csv', csvContent);
        console.log(`✅ Created import CSV with ${users.length} users`);
    }

    /**
     * Generate detailed migration report
     */
    private async generateMigrationReport(users: MigrationUser[]): Promise<void> {
        const report = {
            summary: {
                totalUsers: users.length,
                emailVerified: users.filter(u => u.emailVerified).length,
                emailUnverified: users.filter(u => !u.emailVerified).length,
                withBusinessId: users.filter(u => u.businessId).length,
                profileComplete: users.filter(u => u.profileComplete).length
            },
            roleDistribution: this.getRoleDistribution(users),
            localeDistribution: this.getLocaleDistribution(users),
            onboardingStepDistribution: this.getOnboardingStepDistribution(users),
            sampleUsers: users.slice(0, 10), // First 10 users as preview
            migrationDate: new Date().toISOString(),
            estimatedMigrationTime: `${Math.ceil(users.length / 25)} minutes` // 25 users per minute
        };

        fs.writeFileSync('migration-report.json', JSON.stringify(report, null, 2));
        console.log('✅ Generated migration report');

        // Create preview file with sample users
        const preview = {
            sampleUsers: users.slice(0, 5).map(user => ({
                email: user.email,
                role: user.role,
                emailVerified: user.emailVerified,
                profileComplete: user.profileComplete,
                hasBusinessId: !!user.businessId,
                locale: user.locale
            })),
            totalCount: users.length
        };

        fs.writeFileSync('migration-preview.json', JSON.stringify(preview, null, 2));
        console.log('✅ Generated migration preview');
    }

    /**
     * Test migration with a single user
     */
    async testMigration(testEmail: string): Promise<void> {
        console.log(`🧪 Testing migration for user: ${testEmail}`);

        try {
            await this.supabaseClient.connect();

            // Get test user from Supabase
            const result = await this.supabaseClient.query(`
                SELECT 
                    u.id, u.email, u.email_confirmed_at,
                    p.role, p.display_name,
                    pp.first_name, pp.last_name, pp.phone, pp.preferences
                FROM auth.users u
                LEFT JOIN public.profiles p ON u.id = p.id
                LEFT JOIN public.private_profiles pp ON u.id = pp.user_id
                WHERE u.email = $1
            `, [testEmail]);

            if (result.rows.length === 0) {
                throw new Error(`User ${testEmail} not found in Supabase`);
            }

            const user = result.rows[0];

            // Create user in Cognito
            const params = {
                UserPoolId: this.userPoolId,
                Username: user.email,
                UserAttributes: [
                    { Name: 'email', Value: user.email },
                    { Name: 'email_verified', Value: user.email_confirmed_at ? 'true' : 'false' },
                    { Name: 'given_name', Value: user.first_name || '' },
                    { Name: 'family_name', Value: user.last_name || '' },
                    { Name: 'custom:user_role', Value: user.role || 'owner' },
                    { Name: 'custom:locale', Value: user.preferences?.locale || 'de' },
                    { Name: 'custom:profile_complete', Value: 'false' },
                    { Name: 'custom:onboarding_step', Value: '0' },
                    { Name: 'custom:supabase_id', Value: user.id }
                ],
                MessageAction: 'SUPPRESS',
                TemporaryPassword: 'TempPass123!'
            };

            const cognitoUser = await this.cognito.adminCreateUser(params).promise();
            console.log('✅ Test user created in Cognito:', cognitoUser.User?.Username);

            // Test JWT token generation
            const authResult = await this.cognito.adminInitiateAuth({
                UserPoolId: this.userPoolId,
                ClientId: process.env.USER_POOL_CLIENT_ID || '',
                AuthFlow: 'ADMIN_NO_SRP_AUTH',
                AuthParameters: {
                    USERNAME: user.email,
                    PASSWORD: 'TempPass123!'
                }
            }).promise();

            if (authResult.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
                console.log('✅ Test user requires password change (expected)');
            }

            console.log('✅ Test migration completed successfully');

        } catch (error) {
            console.error('❌ Test migration failed:', error);
            throw error;
        } finally {
            await this.supabaseClient.end();
        }
    }

    // Helper methods
    private extractFirstName(displayName: string | null): string | null {
        if (!displayName) return null;
        return displayName.split(' ')[0] || null;
    }

    private extractLastName(displayName: string | null): string | null {
        if (!displayName) return null;
        const parts = displayName.split(' ');
        return parts.length > 1 ? parts.slice(1).join(' ') : null;
    }

    private isProfileComplete(row: any): boolean {
        return !!(row.first_name && row.last_name && row.phone);
    }

    private escapeCsvValue(value: string): string {
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
    }

    private getRoleDistribution(users: MigrationUser[]): Record<string, number> {
        return users.reduce((acc, user) => {
            acc[user.role] = (acc[user.role] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }

    private getLocaleDistribution(users: MigrationUser[]): Record<string, number> {
        return users.reduce((acc, user) => {
            acc[user.locale] = (acc[user.locale] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }

    private getOnboardingStepDistribution(users: MigrationUser[]): Record<string, number> {
        return users.reduce((acc, user) => {
            const step = user.onboardingStep.toString();
            acc[step] = (acc[step] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }
}

// CLI usage
async function main() {
    const userPoolId = process.env.USER_POOL_ID;
    if (!userPoolId) {
        console.error('❌ USER_POOL_ID environment variable required');
        process.exit(1);
    }

    const migrationService = new UserMigrationService(userPoolId);

    const command = process.argv[2];

    switch (command) {
        case 'migrate':
            await migrationService.migrateUsers();
            break;
        case 'test':
            const testEmail = process.argv[3];
            if (!testEmail) {
                console.error('❌ Test email required: npm run migrate test user@example.com');
                process.exit(1);
            }
            await migrationService.testMigration(testEmail);
            break;
        default:
            console.log('Usage:');
            console.log('  npm run migrate migrate  - Generate migration files');
            console.log('  npm run migrate test <email>  - Test migration for specific user');
    }
}

if (require.main === module) {
    main().catch(console.error);
}

export { UserMigrationService };