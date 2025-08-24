function parseAllowed() {
  const raw = process.env.CORS_ORIGINS || '';
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}
const ALLOWED = parseAllowed();

function matchesWildcard(origin, pattern) {
  if (pattern === '*') return true;
  if (!origin || !pattern) return false;
  if (pattern.includes('*')) {
    const m = /^([^:]+):\/\/\*\.(.+)$/.exec(pattern);
    if (!m) return false;
    const scheme = m[1];
    const base = m[2];
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
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
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
    const token = event.queryStringParameters?.token || '';
    // TODO: Look up tokenHash in DB, validate TTL -> mark confirmed

    const base = process.env.RESULT_URL || 'https://matbakh.app/vc/result';
    const location = `${base}?t=${encodeURIComponent(token)}`;
    return { statusCode: 302, headers: { Location: location, ...cors(origin) }, body: '' };
  } catch (e) {
    console.error('vc-confirm error', e);
    return { statusCode: 500, headers: { 'Content-Type':'application/json', ...cors(origin) },
      body: JSON.stringify({ ok:false, error: String(e?.message || e) }) };
  }
};
