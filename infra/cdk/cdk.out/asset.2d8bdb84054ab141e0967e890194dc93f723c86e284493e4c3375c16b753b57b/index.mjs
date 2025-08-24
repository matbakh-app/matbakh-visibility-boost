import crypto from 'node:crypto';

function parseAllowed() {
  const raw = process.env.CORS_ORIGINS || '';
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}
const ALLOWED = parseAllowed();

function matchesWildcard(origin, pattern) {
  if (pattern === '*') return true;
  if (!origin || !pattern) return false;
  if (pattern.includes('*')) {
    // Only support form: https://*.domain.tld
    const m = /^([^:]+):\/\/\*\.(.+)$/.exec(pattern);
    if (!m) return false;
    const scheme = m[1];
    const base = m[2]; // e.g. vercel.app
    try {
      const u = new URL(origin);
      if (u.protocol.replace(':','') !== scheme) return false;
      return u.hostname === base || u.hostname.endsWith('.' + base);
    } catch { return false; }
  }
  return origin === pattern;
}

function pickAllowedOrigin(origin) {
  const ok = ALLOWED.some(p => matchesWildcard(origin, p));
  return ok ? origin : (ALLOWED[0] || '*');
}

function cors(origin) {
  const allow = pickAllowedOrigin(origin);
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
