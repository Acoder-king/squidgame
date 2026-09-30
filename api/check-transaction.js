import { checkTransactionIdService } from '../server/services.js';

const cors = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const txnId = req.method === 'POST' ? req.body?.transactionId : req.query?.id;
  try {
    const result = await checkTransactionIdService(txnId);
    return res.status(result.valid ? 200 : 400).json(result);
  } catch (err) {
    console.error('check-transaction API error:', err.message);
    return res.status(500).json({ valid: false, error: err.message || 'Internal Server Error' });
  }
}
