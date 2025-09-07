// VcStartFn - Production Visibility Check Start Handler
const { executeQuery } = require('/opt/nodejs/pgClient');
const crypto = require('crypto');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

// Initialize AWS clients
const secretsClient = new SecretsManagerClient({ region: process.env.AWS_REGION || 'eu-central-1' });

exports.handler = async (event, context) => {
    console.log('VcStartFn - Production handler started');
    console.log('Event:', JSON.stringify(event, null, 2));

    try {
        // Parse request body
        let body;
        if (event.body) {
            body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        } else {
            body = event; // Direct invocation
        }

        const { email, name } = body;

        // Validate required fields
        if (!email) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'OPTIONS,POST'
                },
                body: JSON.stringify({ error: 'invalid_email' })
            };
        }

        // Generate secure confirmation token
        const confirmToken = crypto.randomBytes(32).toString('hex');
        const confirmTokenHash = crypto.createHash('sha256').update(confirmToken).digest('hex');
        const confirmExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

        console.log('Generated token hash:', confirmTokenHash.substring(0, 8) + '...');
        console.log('Token expires at:', confirmExpiresAt.toISOString());

        // Insert lead into visibility_check_leads table
        const insertQuery = `
            INSERT INTO visibility_check_leads (
                business_name, 
                email, 
                confirm_token_hash, 
                confirm_expires_at,
                email_confirmed,
                status,
                created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
            RETURNING id
        `;

        const insertParams = [
            name || email.split('@')[0], // Use name or email prefix as business_name
            email,
            confirmTokenHash,
            confirmExpiresAt,
            false,
            'pending'
        ];

        console.log('Inserting lead into database...');
        const result = await executeQuery(insertQuery, insertParams);
        const leadId = result.rows[0].id;

        console.log('Lead created with ID:', leadId);

        // Send DOI confirmation email
        console.log('Sending confirmation email to:', email);

        try {
            await sendConfirmationEmail(email, name, confirmToken);
            console.log('Confirmation email sent successfully');
        } catch (emailError) {
            console.error('Failed to send confirmation email:', emailError);
            // Don't fail the entire request if email fails - just log it
        }

        // Return success response
        const response = {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'OPTIONS,POST'
            },
            body: JSON.stringify({
                ok: true,
                // For testing purposes, include the token (remove in production)
                _debug: {
                    leadId: leadId,
                    confirmToken: confirmToken,
                    confirmLink: `https://guf7ho7bze.execute-api.eu-central-1.amazonaws.com/prod/vc/confirm?t=${confirmToken}`
                }
            })
        };

        console.log('VcStartFn - Success response prepared');
        return response;

    } catch (error) {
        console.error('VcStartFn - Error:', error);
        console.error('Error stack:', error.stack);

        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'OPTIONS,POST'
            },
            body: JSON.stringify({
                error: 'internal_error',
                message: 'Failed to process request'
            })
        };
    }
};

// Email sending function using Resend
async function sendConfirmationEmail(email, name, confirmToken) {
    try {
        // Get email configuration from Secrets Manager
        const getSecretCommand = new GetSecretValueCommand({
            SecretId: 'matbakh-email-config'
        });

        const secretResponse = await secretsClient.send(getSecretCommand);
        const emailConfig = JSON.parse(secretResponse.SecretString);

        const { RESEND_API_KEY, MAIL_FROM, CONFIRM_API_BASE } = emailConfig;

        if (!RESEND_API_KEY || RESEND_API_KEY === 're_placeholder_key_replace_with_actual') {
            throw new Error('Resend API key not configured');
        }

        // Build confirmation link using API Gateway
        const confirmationLink = `${CONFIRM_API_BASE}?t=${confirmToken}`;

        // Prepare spam-optimized email content
        const emailSubject = 'Bitte bestätige deine E-Mail für den Sichtbarkeits-Check';

        const emailText = `Hallo ${name || 'Freund/in'},

bitte bestätige deine E-Mail, um deinen kostenlosen Sichtbarkeits-Check zu starten:
${confirmationLink}

Falls der Button nicht funktioniert, kopiere den Link in deinen Browser.

Liebe Grüße
Dein matbakh Team`;

        const emailHtml = `<p>Hallo ${name || 'Freund/in'},</p>
<p>bitte bestätige deine E-Mail, um deinen kostenlosen Sichtbarkeits-Check zu starten.</p>
<p><a href="${confirmationLink}" style="display:inline-block;padding:12px 18px;border-radius:8px;background:#0ea5e9;color:#fff;text-decoration:none;">Jetzt bestätigen</a></p>
<p>Falls der Button nicht funktioniert, nutze diesen Link:<br><a href="${confirmationLink}">${confirmationLink}</a></p>
<p>Liebe Grüße<br>Dein matbakh Team</p>`;

        // Send email via Resend API with spam-optimized settings
        const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: `matbakh <${MAIL_FROM}>`,
                to: [email],
                subject: emailSubject,
                text: emailText,
                html: emailHtml
            })
        });

        if (!resendResponse.ok) {
            const errorText = await resendResponse.text();
            throw new Error(`Resend API error: ${resendResponse.status} - ${errorText}`);
        }

        const resendResult = await resendResponse.json();
        console.log('Resend email sent successfully:', resendResult.id);

        return resendResult;

    } catch (error) {
        console.error('Error sending confirmation email:', error);
        throw error;
    }
}