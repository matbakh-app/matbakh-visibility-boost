import crypto from 'node:crypto';

// --- CORS (mit Wildcard-Support: z.B. https://*.vercel.app) ---
function parseAllowed() {
  const raw = process.env.CORS_ORIGINS || '';
  const list = raw.split(',').map(s => s.trim()).filter(Boolean);
  return list.length ? list : ['*'];
}
const ALLOWED = parseAllowed();

function pickAllowedOrigin(origin) {
  if (!origin) return ALLOWED[0] || '*';
  for (const a of ALLOWED) {
    if (a === '*' || a === origin) return origin;
    if (a.includes('*')) {
      // Erzeuge Regex aus Muster mit * (alles andere escapen)
      const re = new RegExp('^' + a.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');
      if (re.test(origin)) return origin;
    }
  }
  return ALLOWED[0] || '*';
}
function cors(origin) {
  const allow = pickAllowedOrigin(origin);
  return {
    'Access-Control-Allow-Origin': allow,
    'Vary': 'Origin',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'content-type,authorization',
    'Access-Control-Max-Age': '86400',
  };
}

// --- DynamoDB dynamisch laden (Edge-freundlich) ---
let DynamoDBClient, GetItemCommand, UpdateItemCommand;
try {
  ({ DynamoDBClient, GetItemCommand, UpdateItemCommand } = await import('@aws-sdk/client-dynamodb'));
} catch {
  console.warn('DynamoDB SDK not available in runtime; cannot validate tokens.');
}

export const handler = async (event) => {
  const origin = event.headers?.origin || event.headers?.Origin || '';
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors(origin) };
  }

  try {
    const token = event.queryStringParameters?.token || '';
    if (!token) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', ...cors(origin) },
        body: JSON.stringify({ ok: false, error: 'missing token' })
      };
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // --- Token in DynamoDB nachschlagen ---
    const table = process.env.DDB_TABLE;
    if (!table || !DynamoDBClient || !GetItemCommand) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json', ...cors(origin) },
        body: JSON.stringify({ ok: false, error: 'token store unavailable' })
      };
    }

    const client = new DynamoDBClient({});
    const res = await client.send(new GetItemCommand({
      TableName: table,
      Key: { token_hash: { S: tokenHash } }
    }));

    const item = res.Item;
    let valid = false;
    if (item) {
      const now = Math.floor(Date.now() / 1000);
      const ttl = item.ttl?.N ? parseInt(item.ttl.N, 10) : now - 1;
      if (ttl > now) {
        valid = true;
        // Nach Bestätigung: Status setzen + TTL auf +30 Tage verlängern
        if (UpdateItemCommand) {
          const newTtl = now + 60 * 60 * 24 * 30; // 30 Tage
          await client.send(new UpdateItemCommand({
            TableName: table,
            Key: { token_hash: { S: tokenHash } },
            UpdateExpression: 'SET #s = :s, confirmed_at = :c, ttl = :ttl',
            ExpressionAttributeNames: { '#s': 'status' },
            ExpressionAttributeValues: {
              ':s': { S: 'confirmed' },
              ':c': { S: new Date().toISOString() },
              ':ttl': { N: String(newTtl) }
            }
          }));
        }
      }
    }

    if (!valid) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', ...cors(origin) },
        body: JSON.stringify({ ok: false, error: 'invalid or expired token' })
      };
    }

    const base = process.env.RESULT_URL || 'https://matbakh.app/vc/result';
    const location = `${base}?t=${encodeURIComponent(token)}`;
    return { statusCode: 302, headers: { Location: location, ...cors(origin) }, body: '' };
  } catch (e) {
    console.error('vc-confirm error', e);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', ...cors(origin) },
      body: JSON.stringify({ ok: false, error: String(e?.message || e) })
    };
  }
};
