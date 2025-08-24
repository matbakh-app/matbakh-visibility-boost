import crypto from 'node:crypto';

// CORS
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

// SES v2 dyn. laden
let SESv2Client, SendEmailCommand;
try { ({ SESv2Client, SendEmailCommand } = await import('@aws-sdk/client-sesv2')); }
catch { console.warn('SESv2 SDK not available in runtime; skipping actual email send.'); }

// DynamoDB dyn. laden
let DynamoDBClient, PutItemCommand;
try { ({ DynamoDBClient, PutItemCommand } = await import('@aws-sdk/client-dynamodb')); }
catch { console.warn('DynamoDB SDK not available in runtime; token not persisted.'); }

async function persistToken(tokenHash, { email, name, venue }) {
  const table = process.env.DDB_TABLE;
  if (!table || !DynamoDBClient || !PutItemCommand) {
    console.warn('Skipping DB save (no SDK or no table).');
    return;
  }
  const client = new DynamoDBClient({});
  const ttl = Math.floor(Date.now() / 1000) + 60 * 60 * 24; // 24h
  const item = {
    token_hash: { S: tokenHash },
    email: { S: email },
    status: { S: 'pending' },
    created_at: { S: new Date().toISOString() },
    ttl: { N: String(ttl) },
  };
  if (name)  item.name  = { S: String(name) };
  if (venue) item.venue = { S: String(venue) };
  await client.send(new PutItemCommand({
    TableName: table,
    Item: item,
    ConditionExpression: 'attribute_not_exists(token_hash)',
  }));
}

async function sendDoiEmail(to, token, event) {
  const from = process.env.DOI_FROM || 'mail@matbakh.app';
  const domain = event.requestContext?.domainName;
  const stage  = event.requestContext?.stage;
  const base   = domain && stage ? `https://${domain}/${stage}` : (process.env.CONFIRM_BASE || 'https://matbakh.app');
  const link   = `${base}/vc/confirm?token=${encodeURIComponent(token)}`;

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
        Body: { Text: { Data: `Hi!\nPlease confirm your email to start the visibility check:\n\n${link}\n\nIf you didn’t request this, you can ignore this email.` } }
      }
    }
  });
  const resp = await client.send(cmd);
  console.log('SES send ok', resp?.MessageId || resp);
  return { messageId: resp?.MessageId || null };
}

export const handler = async (event) => {
  const origin = event.headers?.origin || event.headers?.Origin || '';
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors(origin) };

  try {
    const body = JSON.parse(event.body || '{}');
    const { email, name, venue } = body;
    if (!email) {
      return { statusCode: 400, headers: { 'Content-Type':'application/json', ...cors(origin) },
        body: JSON.stringify({ ok:false, error:'email required' }) };
    }

    const token = crypto.randomBytes(16).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    await persistToken(tokenHash, { email, name, venue });
    console.log('vc-start lead', { email, name, venue, tokenHash });

    await sendDoiEmail(email, token, event);

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
