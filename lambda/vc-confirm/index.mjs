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

export const handler = async (event) => {
  const origin = event.headers?.origin || event.headers?.Origin || '';
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors(origin) };
  }

  try {
    const token = event.queryStringParameters?.token || '';
    // TODO: validate token (hash+TTL) and mark confirmed in DB

    const base = process.env.RESULT_URL || 'https://matbakh.app/vc/result';
    const location = `${base}?t=${encodeURIComponent(token)}`;
    return { statusCode: 302, headers: { Location: location, ...cors(origin) }, body: '' };
  } catch (e) {
    console.error('vc-confirm error', e);
    return { statusCode: 500, headers: { 'Content-Type':'application/json', ...cors(origin) },
      body: JSON.stringify({ ok:false, error: String(e?.message || e) }) };
  }
};
