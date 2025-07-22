import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

// 🔐 Environment Variables
const VERIFY_TOKEN = process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN || '';
const APP_SECRET = process.env.FACEBOOK_APP_SECRET || '';
const DEBUG_MODE = process.env.FACEBOOK_DEBUG_MODE === 'true';

// 📌 Facebook Signature Header
const SIGNATURE_HEADER = 'x-hub-signature';

// 📦 Debug Logging Helper
const log = (...args: any[]) => {
  if (DEBUG_MODE) {
    console.log('[Facebook Webhook]', ...args);
  }
};

// ✅ GET: Webhook Verification (Meta Setup)
function verifyWebhook(req: NextApiRequest, res: NextApiResponse) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    log('Webhook-Verifizierung erfolgreich');
    return res.status(200).send(challenge);
  }

  console.warn('[Facebook Webhook] Ungültiger Verifizierungstoken:', { mode, token });
  return res.status(403).send('Forbidden');
}

// 🔐 Signature Check (POST)
function isValidSignature(req: NextApiRequest, rawBody: Buffer) {
  const signature = req.headers[SIGNATURE_HEADER] as string;
  if (!signature || !APP_SECRET) return false;

  const [algo, receivedHash] = signature.split('=');
  const expectedHash = crypto
    .createHmac(algo, APP_SECRET)
    .update(rawBody)
    .digest('hex');

  return receivedHash === expectedHash;
}

// 📥 POST: Handle Webhook Events
async function handleEvent(req: NextApiRequest, res: NextApiResponse, rawBody: Buffer) {
  if (!isValidSignature(req, rawBody)) {
    console.warn('[Facebook Webhook] Ungültige Signatur – Event abgelehnt');
    return res.status(403).send('Invalid signature');
  }

  const body = JSON.parse(rawBody.toString('utf-8'));

  if (body.object) {
    log('Neuer Event empfangen:', JSON.stringify(body, null, 2));
    // 🔧 Hier kannst du weitere Verarbeitung einbauen
    return res.status(200).send('EVENT_RECEIVED');
  }

  return res.status(404).send('Not Found');
}

// 📡 Raw Body Handling aktivieren
export const config = {
  api: {
    bodyParser: false,
  },
};

// 🧠 Haupt-Handler
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const buffers: Uint8Array[] = [];
  req.on('data', (chunk) => buffers.push(chunk));
  req.on('end', async () => {
    const rawBody = Buffer.concat(buffers);

    if (req.method === 'GET') {
      return verifyWebhook(req, res);
    }

    if (req.method === 'POST') {
      return await handleEvent(req, res, rawBody);
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  });
}
