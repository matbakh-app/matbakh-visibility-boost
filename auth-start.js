// AuthStartFn - send magic-link via Resend
const crypto = require('crypto');
const { getPgClient, executeQuery } = require('/opt/nodejs/pgClient');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

const secrets = new SecretsManagerClient({ region: process.env.AWS_REGION || 'eu-central-1' });

async function getEmailConfig() {
  const res = await secrets.send(new GetSecretValueCommand({ SecretId: 'matbakh-email-config' }));
  const cfg = JSON.parse(res.SecretString || '{}');
  if (!cfg.RESEND_API_KEY || !cfg.MAIL_FROM || !cfg.AUTH_CALLBACK_BASE) {
    throw new Error('Email config incomplete (need RESEND_API_KEY, MAIL_FROM, AUTH_CALLBACK_BASE)');
  }
  return cfg;
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders(), body: '' };
  }

  try {
    const body = event.body ? JSON.parse(event.body) : event;
    const email = (body.email || '').trim().toLowerCase();
    const name = (body.name || body.fullname || body.firstName || '').toString().trim() || null;

    console.log('AuthStartFn: incoming', { email, name });

    if (!isValidEmail(email)) {
      return { 
        statusCode: 400, 
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ ok: false, error: 'invalid_email' }) 
      };
    }

    // token & hash
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // store token
    await getPgClient(); // ensure pool
    const ip = (event.requestContext && (event.requestContext.identity?.sourceIp || event.requestContext.http?.sourceIp)) || null;
    const ua = (event.headers && (event.headers['user-agent'] || event.headers['User-Agent'])) || null;

    await executeQuery(
      `INSERT INTO auth_magic_tokens (email, token_hash, expires_at, user_agent, ip)
       VALUES ($1, $2, NOW() + INTERVAL '30 minutes', $3, $4)`,
      [email, tokenHash, ua, ip]
    );

    // send email
    const cfg = await getEmailConfig();
    const link = `${cfg.AUTH_CALLBACK_BASE}?t=${token}`;

    const subject = 'Anmelden bei matbakh';
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #0ea5e9;">Anmelden bei matbakh</h2>
        <p>Hallo${name ? ' ' + name : ''},</p>
        <p>klicke auf den Button, um dich bei <b>matbakh</b> anzumelden.</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${link}" style="display:inline-block;padding:12px 24px;border-radius:8px;background:#0ea5e9;color:#fff;text-decoration:none;font-weight:bold;">
            Jetzt anmelden
          </a>
        </p>
        <p>Falls der Button nicht funktioniert, kopiere den Link:</p>
        <p style="word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 4px;">
          <a href="${link}">${link}</a>
        </p>
        <p>Liebe Grüße<br>Dein matbakh Team</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #666;">
          Diese E-Mail wurde an ${email} gesendet. Der Link ist 30 Minuten gültig.
        </p>
      </div>`;
    
    const text = `Hallo${name ? ' ' + name : ''},

klicke auf den Link, um dich bei matbakh anzumelden:
${link}

Liebe Grüße
Dein matbakh Team

---
Diese E-Mail wurde an ${email} gesendet. Der Link ist 30 Minuten gültig.`;

    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cfg.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `matbakh <${cfg.MAIL_FROM}>`,
        to: [email],
        subject,
        html,
        text,
        headers: {
          'X-Priority': '3',
          'X-MSMail-Priority': 'Normal',
          'X-Mailer': 'matbakh.app',
          'Reply-To': 'support@matbakh.app'
        },
        tags: [
          { name: 'category', value: 'auth-login' },
          { name: 'environment', value: 'production' }
        ]
      })
    });

    if (!resp.ok) {
      const err = await resp.text();
      console.error('Resend error:', resp.status, err);
      // we still return ok to avoid leaking whether an email exists
    } else {
      const json = await resp.json();
      console.log('Resend ok:', json?.id || json);
    }

    return {
      statusCode: 200,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true })
    };
  } catch (e) {
    console.error('AuthStartFn error:', e);
    return {
      statusCode: 500,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'server_error' })
    };
  }
};