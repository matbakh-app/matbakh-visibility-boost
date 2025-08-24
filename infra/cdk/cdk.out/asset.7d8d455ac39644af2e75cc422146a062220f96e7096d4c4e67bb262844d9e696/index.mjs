import crypto from 'node:crypto';

/* ---------------- CORS: inkl. Wildcards (z. B. https://*.vercel.app) ---------------- */
function parseAllowed() {
  const raw = process.env.CORS_ORIGINS || '';
  const list = raw.split(',').map(s => s.trim()).filter(Boolean);
  return list.length ? list : ['*'];
}
const ALLOWED = parseAllowed();

function matchOrigin(origin, pattern) {
  if (!origin || !pattern) return false;
  if (pattern === '*') return true;
  try {
    const u = new URL(origin);
    if (!pattern.includes('*')) return origin === pattern;
    const proto = pattern.split('://')[0] + '://';
    const suffix = pattern.split('://')[1].replace(/^\*\./, '');
    if (!origin.startsWith(proto)) return false;
    return u.hostname === suffix || u.hostname.endsWith('.' + suffix);
  } catch {
    return false;
  }
}
function originAllowed(origin) {
  for (const a of ALLOWED) if (matchOrigin(origin, a)) return true;
  return false;
}
function cors(origin) {
  const allow = originAllowed(origin) ? origin : (ALLOWED[0] || '*');
  return {
    'Access-Control-Allow-Origin': allow,
    'Vary': 'Origin',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'content-type,authorization',
    'Access-Control-Max-Age': '86400',
  };
}

/* ---------------- AWS SDKs lazy laden ---------------- */
let DynamoDBClient, GetItemCommand, UpdateItemCommand;
try { ({ DynamoDBClient, GetItemCommand, UpdateItemCommand } = await import('@aws-sdk/client-dynamodb')); }
catch { console.warn('DynamoDB SDK not available in runtime; cannot validate tokens.'); }

let SESv2Client, SendEmailCommand;
try { ({ SESv2Client, SendEmailCommand } = await import('@aws-sdk/client-sesv2')); }
catch { console.warn('SESv2 SDK not available; welcome email will be skipped.'); }

/* ---------------- optional: Willkommens-Mail ---------------- */
async function sendWelcomeEmail(to) {
  // nur wenn ausdrücklich aktiviert
  if (String(process.env.SEND_WELCOME || '0') !== '1') return { skipped: true, reason: 'disabled' };
  if (!SESv2Client || !SendEmailCommand) return { skipped: true, reason: 'no-ses' };

  const from = process.env.DOI_FROM || 'mail@matbakh.app';
  const configSet = process.env.SES_CONFIGURATION_SET || 'matbakh-default';

  const client = new SESv2Client({});
  const subject = 'Welcome to Matbakh – you’re confirmed';
  const text = `You’re all set!\n\nThanks for confirming your email. You can now continue with the visibility check.\n\n— Matbakh`;
  const html = `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.5">
    <h2 style="margin:0 0 8px">You’re all set 🎉</h2>
    <p style="margin:0 0 12px">Thanks for confirming your email. You can now continue with the visibility check.</p>
    <p style="margin:0;color:#6b7280">— Matbakh</p>
  </div>`.trim();

  const cmd = new SendEmailCommand({
    FromEmailAddress: from,
    Destination: { ToAddresses: [to] },
    Content: {
      Simple: {
        Subject: { Data: subject },
        Body: { Text: { Data: text }, Html: { Data: html } },
      }
    },
    ConfigurationSetName: configSet,
  });

  const out = await client.send(cmd);
  console.log('welcome mail sent', out?.MessageId || out);
  return { skipped: false, messageId: out?.MessageId || null };
}

/* ---------------- Lambda-Handler ---------------- */
export const handler = async (event) => {
  const origin = event.headers?.origin || event.headers?.Origin || '';
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors(origin) };

  try {
    const token = event.queryStringParameters?.token || '';
    if (!token) {
      return { statusCode: 400, headers: { 'Content-Type': 'application/json', ...cors(origin) },
        body: JSON.stringify({ ok:false, error:'missing token' }) };
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const table = process.env.DDB_TABLE;
    if (!table || !DynamoDBClient || !GetItemCommand) {
      return { statusCode: 500, headers: { 'Content-Type':'application/json', ...cors(origin) },
        body: JSON.stringify({ ok:false, error:'server not ready: ddb client/table missing' }) };
    }

    const client = new DynamoDBClient({});
    // 1) Token lesen (um Email zu bekommen & nicer error)
    const res = await client.send(new GetItemCommand({
      TableName: table,
      Key: { token_hash: { S: tokenHash } },
      ProjectionExpression: 'email, #st, #ttl',
      ExpressionAttributeNames: { '#st':'status', '#ttl':'ttl' },
    }));
    const item = res.Item;
    const now = Math.floor(Date.now() / 1000);

    if (!item) {
      return { statusCode: 400, headers: { 'Content-Type':'application/json', ...cors(origin) },
        body: JSON.stringify({ ok:false, error:'invalid or expired token' }) };
    }

    const email = item.email?.S;

    // 2) Bestätigen (nur wenn noch gültig)
    try {
      await client.send(new UpdateItemCommand({
        TableName: table,
        Key: { token_hash: { S: tokenHash } },
        UpdateExpression: 'SET #st = :confirmed, confirmed_at = :ts',
        ConditionExpression: '#ttl > :now',
        ExpressionAttributeNames: { '#st':'status', '#ttl':'ttl' },
        ExpressionAttributeValues: {
          ':confirmed': { S: 'confirmed' },
          ':ts': { S: new Date().toISOString() },
          ':now': { N: String(now) },
        },
      }));
    } catch (err) {
      console.error('confirm update failed', err);
      return { statusCode: 400, headers: { 'Content-Type':'application/json', ...cors(origin) },
        body: JSON.stringify({ ok:false, error:'invalid or expired token' }) };
    }

    // 3) Optional: Welcome-Mail (nur wenn aktiviert)
    if (email) {
      try { await sendWelcomeEmail(email); } catch (e) { console.warn('welcome mail failed', e); }
    }

    // 4) Redirect zur Result-Seite
    const base = process.env.RESULT_URL || 'https://matbakh.app/vc/result';
    const location = `${base}?t=${encodeURIComponent(token)}`;
    return { statusCode: 302, headers: { Location: location, ...cors(origin) }, body: '' };

  } catch (e) {
    console.error('vc-confirm error', e);
    return { statusCode: 500, headers: { 'Content-Type':'application/json', ...cors(origin) },
      body: JSON.stringify({ ok:false, error:String(e?.message || e) }) };
  }
};
