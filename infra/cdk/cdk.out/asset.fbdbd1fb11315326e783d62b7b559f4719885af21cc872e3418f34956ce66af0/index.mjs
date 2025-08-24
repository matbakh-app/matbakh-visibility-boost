import crypto from 'node:crypto';

// --- CORS helpers ---
function parseAllowed() {
  const raw = process.env.CORS_ORIGINS || '';
  const list = raw.split(',').map(s => s.trim()).filter(Boolean);
  return list.length ? list : ['*'];
}
const ALLOWED = parseAllowed();

function cors(origin) {
  const allow = origin && ALLOWED.includes(origin) ? origin : (ALLOWED[0] || '*');
  return {
    'Access-Control-Allow-Origin': allow,
    'Vary': 'Origin',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'content-type,authorization',
    'Access-Control-Max-Age': '86400',
  };
}

// Try to load SES v2 at runtime (works if available; otherwise we just log)
let SESv2Client, SendEmailCommand;
try {
  ({ SESv2Client, SendEmailCommand } = await import('@aws-sdk/client-sesv2'));
} catch (_) {
  // Module not present in runtime -> we just skip sending, no crash.
  console.warn('SESv2 SDK not available in runtime; skipping actual email send.');
}

async function sendDoiEmail(to, token, event) {
  const from = process.env.DOI_FROM || 'mail@matbakh.app';

  // Build confirm link from the API Gateway context (no circular envs)
  const domain = event.requestContext?.domainName;
  const stage  = event.requestContext?.stage;
  const base   = domain && stage
    ? `https://${domain}/${stage}`
    : (process.env.CONFIRM_BASE || 'https://matbakh.app'); // Fallback

  const link = `${base}/vc/confirm?token=${encodeURIComponent(token)}`;

  // If SDK is not available, log what we would send and return.
  if (!SESv2Client || !SendEmailCommand) {
    console.log('DOI (dry-run):', { from, to, link });
    return { dryRun: true };
  }

  const client = new SESv2Client({});
  const cmd = new SendEmailCommand({
    FromEmailAddress: from,
    Destination: { ToAddresses: [to] },
    Content: {
      Simple: {
        Subject: { Data: 'Confirm your email – Matbakh' },
        Body: {
          Text: { Data: `Hi!\nPlease confirm your email to start the visibility check:\n\n${link}\n\nIf you didn’t request this, you can ignore this email.` }
        }
      }
    }
  });

  const resp = await client.send(cmd);
  console.log('SES send ok', resp?.MessageId || resp);
  return { messageId: resp?.MessageId || null };
}

export const handler = async (event) => {
  const origin = event.headers?.origin || event.headers?.Origin || '';
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors(origin) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { email, name, venue } = body;

    if (!email) {
      return { statusCode: 400, headers: { 'Content-Type':'application/json', ...cors(origin) },
        body: JSON.stringify({ ok:false, error:'email required' }) };
    }

    // generate token + hash (store hash server-side later)
    const token = crypto.randomBytes(16).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // TODO: Persist {email,name,venue,tokenHash,createdAt, status:'pending'} in DB with TTL
    console.log('vc-start lead', { email, name, venue, tokenHash });

    // Send DOI email (real send if SDK present; otherwise just logs)
    await sendDoiEmail(email, token, event);

    // Return 200 for client flow; token is included for now to simplify local testing
    return {
      statusCode: 200,
      headers: { 'Content-Type':'application/json', ...cors(origin) },
      body: JSON.stringify({ ok:true, token })
    };
  } catch (e) {
    console.error('vc-start error', e);
    return { statusCode: 500, headers: { 'Content-Type':'application/json', ...cors(origin) },
      body: JSON.stringify({ ok:false, error: String(e?.message || e) }) };
  }
};
