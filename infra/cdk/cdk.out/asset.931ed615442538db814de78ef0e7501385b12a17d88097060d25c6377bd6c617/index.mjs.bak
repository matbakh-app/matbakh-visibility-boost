import crypto from 'node:crypto';
import AWS from 'aws-sdk'; // v2 SDK ist in Lambda Node.js 20 vorinstalliert
const ses = new AWS.SES({ region: process.env.AWS_REGION || 'eu-central-1' });

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

    // Token + Hash
    const token = crypto.randomBytes(16).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Confirm-Link aus API Gateway Event ableiten (kein CDK-Env nötig)
    const host =
      event.headers?.['x-forwarded-host'] ||
      event.headers?.['X-Forwarded-Host'] ||
      event.headers?.host ||
      event.requestContext?.domainName;

    const stage = event.requestContext?.stage || 'prod';
    const base = `https://${host}/${stage}`;
    const confirmLink = `${base}/vc/confirm?token=${encodeURIComponent(token)}`;

    console.log('vc-start lead', { email, name, venue, tokenHash, confirmLink });

    // DOI-Mail senden
    const from = process.env.DOI_FROM || 'mail@matbakh.app';
    await ses.sendEmail({
      Source: from,
      ReplyToAddresses: [from],
      Destination: { ToAddresses: [email] },
      Message: {
        Subject: { Data: 'Confirm your email – Matbakh' },
        Body: {
          Text: {
            Data:
`Hi${name ? ' ' + name : ''},

please confirm your email for the Matbakh Visibility Check:
${confirmLink}

If you did not request this, you can ignore this email.`
          }
        }
      }
    }).promise();

    // TODO: tokenHash + TTL in DB schreiben (Supabase/Aurora). Kommt im nächsten Schritt.

    // Für Tests geben wir das Token zurück (in Prod entfernen)
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
