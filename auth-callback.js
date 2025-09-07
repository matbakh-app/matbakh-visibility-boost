// AuthCallbackFn - verify token, set cookie, 302 to app
const crypto = require('crypto');
const { getPgClient, executeQuery } = require('/opt/nodejs/pgClient');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

const secrets = new SecretsManagerClient({ region: process.env.AWS_REGION || 'eu-central-1' });

async function getAuthConfig() {
  const res = await secrets.send(new GetSecretValueCommand({ SecretId: 'matbakh-email-config' }));
  const cfg = JSON.parse(res.SecretString || '{}');
  if (!cfg.AUTH_APP_REDIRECT || !cfg.AUTH_JWT_SECRET) {
    throw new Error('Auth config incomplete (need AUTH_APP_REDIRECT, AUTH_JWT_SECRET)');
  }
  return cfg;
}

function base64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/,'');
}

function signJWT(payload, secret, expiresSec = 7*24*60*60) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const iat = Math.floor(Date.now()/1000);
  const exp = iat + expiresSec;
  const data = { ...payload, iat, exp };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(data));
  const toSign = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto.createHmac('sha256', Buffer.from(secret, 'utf8')).update(toSign).digest('base64')
    .replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  return `${toSign}.${signature}`;
}

exports.handler = async (event) => {
  // HEAD/OPTIONS short-circuit (for link checkers / CORS)
  if (event.httpMethod === 'OPTIONS') {
    return { 
      statusCode: 200, 
      headers: {
        'Access-Control-Allow-Origin':'*',
        'Access-Control-Allow-Methods':'GET,OPTIONS',
        'Access-Control-Allow-Headers':'Content-Type'
      }, 
      body: '' 
    };
  }
  
  if (event.httpMethod === 'HEAD') {
    return { statusCode: 200, headers: {}, body: '' };
  }

  try {
    const cfg = await getAuthConfig();
    const redirectBase = cfg.AUTH_APP_REDIRECT;

    const t = event.queryStringParameters && event.queryStringParameters.t;
    if (!t) {
      return { statusCode: 302, headers: { 'Location': `${redirectBase}?e=invalid` } };
    }

    const tokenHash = crypto.createHash('sha256').update(t).digest('hex');
    await getPgClient();

    const rowRes = await executeQuery(
      `SELECT id, email, expires_at, consumed_at
       FROM auth_magic_tokens
       WHERE token_hash = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [tokenHash]
    );

    if (rowRes.rows.length === 0) {
      return { statusCode: 302, headers: { 'Location': `${redirectBase}?e=invalid` } };
    }

    const tok = rowRes.rows[0];
    const now = new Date();
    
    if (tok.consumed_at) {
      // already used -> just go to app (idempotent)
      return { statusCode: 302, headers: { 'Location': `${redirectBase}` } };
    }
    
    if (now > new Date(tok.expires_at)) {
      return { statusCode: 302, headers: { 'Location': `${redirectBase}?e=expired` } };
    }

    // upsert user
    const userRes = await executeQuery(
      `INSERT INTO app_users (email, verified_at)
       VALUES ($1, NOW())
       ON CONFLICT (email) DO UPDATE SET verified_at = COALESCE(app_users.verified_at, NOW())
       RETURNING id, email, name`,
      [tok.email]
    );
    const user = userRes.rows[0];

    // consume token
    await executeQuery(
      `UPDATE auth_magic_tokens SET consumed_at = NOW() WHERE token_hash = $1 AND consumed_at IS NULL`, 
      [tokenHash]
    );

    // sign JWT
    const jwt = signJWT({ sub: user.id, email: user.email, name: user.name }, cfg.AUTH_JWT_SECRET);

    // For now, redirect with JWT in URL fragment since execute-api domain can't set cookies for matbakh.app
    // TODO: Once we have api.matbakh.app custom domain, use proper HttpOnly cookies
    const redirectUrl = `${redirectBase}#sid=${jwt}`;

    return {
      statusCode: 302,
      headers: { 'Location': redirectUrl }
    };
  } catch (e) {
    console.error('AuthCallbackFn error:', e);
    // safe fallback
    try {
      const cfg = await getAuthConfig();
      return { statusCode: 302, headers: { 'Location': `${cfg.AUTH_APP_REDIRECT}?e=server` } };
    } catch {
      return { statusCode: 500, body: 'server_error' };
    }
  }
};