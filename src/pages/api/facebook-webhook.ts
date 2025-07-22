import type { NextApiRequest, NextApiResponse } from 'next';

// Dein Token aus der Facebook Developer Console (env Variable empfohlen)
const VERIFY_TOKEN = process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN || '408a1cb812ab61f0fabbd69d58a5adcbc54c559a1e239c75b7b8bcded3fda8c5';

// Diese Funktion prüft den Challenge-Request von Facebook
function handleVerification(req: NextApiRequest, res: NextApiResponse) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[Facebook Webhook] Verifizierung erfolgreich');
    res.status(200).send(challenge);
  } else {
    console.warn('[Facebook Webhook] Verifizierung fehlgeschlagen', { mode, token });
    res.status(403).send('Forbidden');
  }
}

// Diese Funktion empfängt echte Webhook-Events
function handleEvents(req: NextApiRequest, res: NextApiResponse) {
  const body = req.body;

  if (body.object) {
    console.log('[Facebook Webhook] Neuer Event empfangen:', JSON.stringify(body, null, 2));
    // TODO: Weiterverarbeitung, z. B. speichern, analysieren, etc.

    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.status(404).send('Not Found');
  }
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return handleVerification(req, res);
  }

  if (req.method === 'POST') {
    return handleEvents(req, res);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}

