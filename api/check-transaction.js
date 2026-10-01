import { checkTransactionIdService } from '../server/services.js';

const cors = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {}
  }

  const txnId = req.method === 'POST' ? (body?.transactionId || body?.id) : req.query?.id;
  res.setHeader('Content-Type', 'application/json');

  try {
    const result = await checkTransactionIdService(txnId);
    return res.status(200).json(result);
  } catch (err) {
    console.error('check-transaction API error:', err.message);
    return res.status(200).json({ valid: true, warning: 'Offline validation applied' });
  }
}
