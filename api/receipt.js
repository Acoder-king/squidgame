import { getReceiptService } from '../server/services.js';

const cors = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { tag, txn, slug, format } = req.query || {};
    const receipt = await getReceiptService({ tag, txn, slug });

    if (!receipt || !receipt.proof_data) {
      if (format === 'json') {
        return res.status(404).json({ error: 'Receipt not found' });
      }
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(404).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Receipt Not Found — INTELLETTO-26</title>
          <style>
            body { background: #07090e; color: #e2e8f0; font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1rem; }
            .card { background: #0f141c; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 2rem; max-width: 420px; text-align: center; }
            h1 { color: #f43f5e; font-size: 1.25rem; margin-top: 0; }
            p { font-size: 0.875rem; color: #94a3b8; line-height: 1.5; }
            .tag { font-family: monospace; background: rgba(255,255,255,0.06); padding: 2px 6px; border-radius: 4px; color: #fff; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Payment Screenshot Not Found</h1>
            <p>No receipt image found for Player Tag: <span class="tag">${tag || txn || 'N/A'}</span>.</p>
            <p>Please contact your event coordinator with your 12-digit UTR reference.</p>
          </div>
        </body>
        </html>
      `);
    }

    if (format === 'json') {
      return res.status(200).json(receipt);
    }

    // Parse Data URL to binary image buffer
    const match = receipt.proof_data.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      const mime = match[1] || 'image/jpeg';
      const buffer = Buffer.from(match[2], 'base64');
      res.setHeader('Content-Type', mime);
      res.setHeader('Content-Length', buffer.length);
      res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
      return res.status(200).end(buffer);
    }

    // Direct image URL fallback
    if (receipt.proof_data.startsWith('http')) {
      return res.redirect(302, receipt.proof_data);
    }

    return res.status(200).send(receipt.proof_data);
  } catch (err) {
    console.error('receipt API error:', err.message);
    return res.status(500).json({ error: 'Failed to retrieve payment receipt.' });
  }
}
