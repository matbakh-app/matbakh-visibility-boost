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
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'content-type,authorization',
    'Access-Control-Max-Age': '86400',
  };
}

// DynamoDB dyn. laden
let DynamoDBClient, GetItemCommand, UpdateItemCommand;
try { ({ DynamoDBClient, GetItemCommand, UpdateItemCommand } = await import('@aws-sdk/client-dynamodb')); }
catch { console.warn('DynamoDB SDK not available in runtime; cannot validate tokens.'); }

export const handler = async (event) => {
  const origin = event.headers?.origin || event.headers?.Origin || '';
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors(origin) };

  try {
    const token = event.queryStringParameters?.token || '';
    if (!token) {
      return { statusCode: 400, headers: { 'Content-Type':'application/json', ...cors(origin) },
        body: JSON.stringify({ ok:false, error:'missing token' }) };
    }

    // Hash berechnen
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Prüfen in DDB
    let valid = false;
    const table = process.env.DDB_TABLE;
    if (table && DynamoDBClient && GetItemCommand) {
      const client = new DynamoDBClient({});
      const res = await client.send(new GetItemCommand({
        TableName: table,
        Key: { token_hash: { S: tokenHash } }
      }));
      const item = res.Item;
      if (item) {
        const now = Math.floor(Date.now()/1000);
        const ttl = item.ttl?.N ? parseInt(item.ttl.N, 10) : now + 1;
        if (ttl > now) {
          valid = true;
          if (UpdateItemCommand) {
            await client.send(new UpdateItemCommand({
              TableName: table,
              Key: { token_hash: { S: tokenHash } },
              UpdateExpression: 'SET #s = :s, confirmed_at = :c',
              ExpressionAttributeNames: { '#s': 'status' },
              ExpressionAttributeValues: { ':s': { S:'confirmed' }, ':c': { S: new Date().toISOString() } }
            }));
          }
        }
      }
    }

    if (!valid) {
      return { statusCode: 400, headers: { 'Content-Type':'application/json', ...cors(origin) },
        body: JSON.stringify({ ok:false, error:'invalid or expired token' }) };
    }

    const base = process.env.RESULT_URL || 'https://matbakh.app/vc/result';
    const location = `${base}?t=${encodeURIComponent(token)}`;
    return { statusCode: 302, headers: { Location: location, ...cors(origin) }, body: '' };
  } catch (e) {
    console.error('vc-confirm error', e);
    return { statusCode: 500, headers: { 'Content-Type':'application/json', ...cors(origin) },
      body: JSON.stringify({ ok:false, error: String(e?.message || e) }) };
  }
};
