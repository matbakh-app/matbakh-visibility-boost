import crypto from 'node:crypto';

// ---- CORS helpers ----
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

// ---- DynamoDB (lazy import) ----
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

    const table = process.env.DDB_TABLE;
    if (!table || !DynamoDBClient || !GetItemCommand) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json', ...cors(origin) },
        body: JSON.stringify({ ok: false, error: 'server not ready: ddb client/table missing' })
      };
    }

    const client = new DynamoDBClient({});
    // 1) Lesen (optional – für freundliche Fehlermeldung/Logging)
    const res = await client.send(new GetItemCommand({
      TableName: table,
      Key: { token_hash: { S: tokenHash } }
    }));

    const item = res.Item;
    const now = Math.floor(Date.now() / 1000);
    if (!item) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', ...cors(origin) },
        body: JSON.stringify({ ok: false, error: 'invalid or expired token' })
      };
    }

    // 2) Bestätigen – ACHTUNG: reserved word 'ttl' via Platzhalter #ttl referenzieren
    //    Zusätzlich ConditionExpression: Token darf nicht abgelaufen sein.
    if (UpdateItemCommand) {
      try {
        await client.send(new UpdateItemCommand({
          TableName: table,
          Key: { token_hash: { S: tokenHash } },
          UpdateExpression: 'SET #st = :confirmed, #c = :ts',
          ConditionExpression: '#ttl > :now',
          ExpressionAttributeNames: {
            '#st': 'status',
            '#c': 'confirmed_at',
            '#ttl': 'ttl'
          },
          ExpressionAttributeValues: {
            ':confirmed': { S: 'confirmed' },
            ':ts': { S: new Date().toISOString() },
            ':now': { N: String(now) }
          }
        }));
      } catch (err) {
        // z. B. ConditionalCheckFailed wenn abgelaufen
        console.error('confirm update failed', err);
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json', ...cors(origin) },
          body: JSON.stringify({ ok: false, error: 'invalid or expired token' })
        };
      }
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
