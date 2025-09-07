// VcConfirmFn - Production Visibility Check Confirm Handler
const { executeQuery } = require('/opt/nodejs/pgClient');
const crypto = require('crypto');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

// Initialize AWS clients
const secretsClient = new SecretsManagerClient({ region: process.env.AWS_REGION || 'eu-central-1' });

exports.handler = async (event, context) => {
    console.log('VcConfirmFn - Production handler started');
    console.log('Event:', JSON.stringify(event, null, 2));
    
    try {
        // Extract token from query parameters
        let token;
        
        if (event.queryStringParameters && event.queryStringParameters.t) {
            token = event.queryStringParameters.t;
        } else if (event.t) {
            token = event.t; // Direct invocation
        }
        
        if (!token) {
            console.log('No token provided, redirecting to invalid');
            const resultUrl = await getResultPageUrl();
            return {
                statusCode: 302,
                headers: {
                    'Location': `${resultUrl}?e=invalid`
                }
            };
        }
        
        console.log('Token received:', token.substring(0, 8) + '...');
        
        // Hash the token to match database
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        console.log('Token hash:', tokenHash.substring(0, 8) + '...');
        
        // Verify token against database
        const verifyQuery = `
            SELECT id, email, business_name, confirm_expires_at, email_confirmed
            FROM visibility_check_leads 
            WHERE confirm_token_hash = $1
        `;
        
        console.log('Verifying token in database...');
        const verifyResult = await executeQuery(verifyQuery, [tokenHash]);
        
        if (verifyResult.rows.length === 0) {
            console.log('Token not found in database');
            const resultUrl = await getResultPageUrl();
            return {
                statusCode: 302,
                headers: {
                    'Location': `${resultUrl}?e=invalid`
                }
            };
        }
        
        const lead = verifyResult.rows[0];
        console.log('Lead found:', { id: lead.id, email: lead.email, confirmed: lead.email_confirmed });
        
        // Check if token has expired
        const now = new Date();
        const expiresAt = new Date(lead.confirm_expires_at);
        
        if (now > expiresAt) {
            console.log('Token has expired:', { now: now.toISOString(), expiresAt: expiresAt.toISOString() });
            const resultUrl = await getResultPageUrl();
            return {
                statusCode: 302,
                headers: {
                    'Location': `${resultUrl}?e=expired`
                }
            };
        }
        
        // Check if already confirmed
        if (lead.email_confirmed) {
            console.log('Email already confirmed, redirecting to result');
            const resultUrl = await getResultPageUrl();
            return {
                statusCode: 302,
                headers: {
                    'Location': `${resultUrl}?t=${token}`
                }
            };
        }
        
        // Mark email as confirmed
        const confirmQuery = `
            UPDATE visibility_check_leads 
            SET 
                email_confirmed = true,
                double_optin_confirmed_at = NOW(),
                status = 'confirmed'
            WHERE confirm_token_hash = $1
        `;
        
        console.log('Marking email as confirmed...');
        await executeQuery(confirmQuery, [tokenHash]);
        
        console.log('Email confirmed successfully for lead:', lead.id);
        
        // Redirect to result page with original token
        const resultUrl = await getResultPageUrl();
        const redirectUrl = `${resultUrl}?t=${token}`;
        console.log('Redirecting to:', redirectUrl);
        
        return {
            statusCode: 302,
            headers: {
                'Location': redirectUrl
            }
        };
        
    } catch (error) {
        console.error('VcConfirmFn - Error:', error);
        console.error('Error stack:', error.stack);
        
        // On error, redirect to invalid page
        try {
            const resultUrl = await getResultPageUrl();
            return {
                statusCode: 302,
                headers: {
                    'Location': `${resultUrl}?e=invalid`
                }
            };
        } catch (secretError) {
            // Fallback to hardcoded URL if secrets fail
            return {
                statusCode: 302,
                headers: {
                    'Location': 'https://matbakh.app/vc/result?e=invalid'
                }
            };
        }
    }
};

// Helper function to get result page URL from secrets
async function getResultPageUrl() {
    try {
        const getSecretCommand = new GetSecretValueCommand({
            SecretId: 'matbakh-email-config'
        });
        
        const secretResponse = await secretsClient.send(getSecretCommand);
        const emailConfig = JSON.parse(secretResponse.SecretString);
        
        return emailConfig.RESULT_PAGE_URL || 'https://matbakh.app/vc/result';
    } catch (error) {
        console.error('Failed to get result page URL from secrets:', error);
        return 'https://matbakh.app/vc/result'; // Fallback
    }
}