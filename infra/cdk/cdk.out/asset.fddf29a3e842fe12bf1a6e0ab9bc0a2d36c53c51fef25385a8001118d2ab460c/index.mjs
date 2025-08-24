import crypto from 'node:crypto';

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

    // generate token + hash (store hash server-side)
    const token = crypto.randomBytes(16).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // TODO: Write lead + tokenHash to DB (Aurora/Supabase) with TTL
    // TODO: Send DOI email via SES with confirm link: {apiBase}/vc/confirm?token=...

    console.log('vc-start lead', { email, name, venue, tokenHash });

    // For manual testing we return the token (REMOVE in prod)
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
