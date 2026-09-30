import { registerPlayerService } from '../server/services.js';

const cors = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const result = await registerPlayerService(req.body);
    return res.status(201).json(result);
  } catch (err) {
    console.error('register API error:', err.message);
    return res.status(400).json({ error: err.message || 'Registration failed.' });
  }
}
