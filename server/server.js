import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getEventsService,
  registerPlayerService,
  submitContactService,
  getFaqsService,
  getGalleryService,
  getScheduleService,
  getRegistrationsService,
  checkTransactionIdService,
  getReceiptService,
} from './services.js';
import { isTiDBConfigured } from './tidb-client.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Health & Diagnostic Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    symposium: 'INTELLETTO-26',
    database: {
      type: 'TiDB Cloud (MySQL Protocol)',
      configured: isTiDBConfigured(),
      host: process.env.TIDB_HOST ? process.env.TIDB_HOST.split('.')[0] + '...' : null,
      database: process.env.TIDB_DATABASE || 'test',
    },
    timestamp: new Date().toISOString(),
  });
});

// 1. Events API
app.get('/api/events', async (req, res) => {
  try {
    const { slug, category } = req.query;
    const events = await getEventsService({ slug, category });
    if (slug && !events.length) {
      return res.status(404).json({ error: 'Event not found' });
    }
    return res.json(slug ? events[0] : events);
  } catch (err) {
    console.error('API /events error:', err.message);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// 2. Player Registration API
app.post('/api/register', async (req, res) => {
  try {
    const result = await registerPlayerService(req.body);
    return res.status(201).json(result);
  } catch (err) {
    console.error('API /register error:', err.message);
    res.status(400).json({ error: err.message || 'Registration failed' });
  }
});

// 2b. UPI Transaction Validation & Duplicate Check API
app.all('/api/check-transaction', async (req, res) => {
  try {
    const txnId = req.method === 'POST' ? req.body?.transactionId : req.query?.id;
    const result = await checkTransactionIdService(txnId);
    return res.status(result.valid ? 200 : 400).json(result);
  } catch (err) {
    console.error('API /check-transaction error:', err.message);
    res.status(500).json({ valid: false, error: err.message || 'Validation error' });
  }
});

// 3. Contact Inquiries API
app.post('/api/contact', async (req, res) => {
  try {
    const result = await submitContactService(req.body);
    return res.status(201).json(result);
  } catch (err) {
    console.error('API /contact error:', err.message);
    res.status(400).json({ error: err.message || 'Failed to submit contact message' });
  }
});

// 4. FAQ API
app.get('/api/faqs', async (req, res) => {
  try {
    const faqs = await getFaqsService();
    res.json(faqs);
  } catch (err) {
    console.error('API /faqs error:', err.message);
    res.status(500).json({ error: 'Failed to load FAQs' });
  }
});

// 5. Gallery API
app.get('/api/gallery', async (req, res) => {
  try {
    const gallery = await getGalleryService();
    res.json(gallery);
  } catch (err) {
    console.error('API /gallery error:', err.message);
    res.status(500).json({ error: 'Failed to load gallery' });
  }
});

// 6. Schedule API
app.get('/api/schedule', async (req, res) => {
  try {
    const schedule = await getScheduleService();
    res.json(schedule);
  } catch (err) {
    console.error('API /schedule error:', err.message);
    res.status(500).json({ error: 'Failed to load schedule' });
  }
});

// 7. Registrations Admin & Export API
app.get('/api/registrations', async (req, res) => {
  try {
    const list = await getRegistrationsService();
    res.json({
      total: list.length,
      registrations: list,
    });
  } catch (err) {
    console.error('API /registrations error:', err.message);
    res.status(500).json({ error: 'Failed to fetch registrations' });
  }
// 8. Payment Receipt Image Endpoint
app.get('/api/receipt', async (req, res) => {
  try {
    const { tag, txn, slug, format } = req.query;
    const receipt = await getReceiptService({ tag, txn, slug });

    if (!receipt || !receipt.proof_data) {
      if (format === 'json') return res.status(404).json({ error: 'Receipt not found' });
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head><title>Receipt Not Found</title><meta name="viewport" content="width=device-width, initial-scale=1"></head>
        <body style="background:#07090e;color:#e2e8f0;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;">
          <div style="background:#0f141c;border:1px solid #333;border-radius:8px;padding:2rem;max-width:400px;text-align:center;">
            <h2 style="color:#f43f5e;margin-top:0;">Payment Screenshot Not Found</h2>
            <p style="color:#94a3b8;font-size:14px;">No receipt image found for: <code>${tag || txn || 'N/A'}</code></p>
          </div>
        </body>
        </html>
      `);
    }

    if (format === 'json') return res.json(receipt);

    const match = receipt.proof_data.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      const mime = match[1] || 'image/jpeg';
      const buffer = Buffer.from(match[2], 'base64');
      res.setHeader('Content-Type', mime);
      res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
      return res.end(buffer);
    }

    if (receipt.proof_data.startsWith('http')) return res.redirect(302, receipt.proof_data);
    return res.send(receipt.proof_data);
  } catch (err) {
    console.error('API /receipt error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve receipt' });
  }
});


if (process.env.NODE_ENV !== 'test' && !process.env.NETLIFY && !process.env.AWS_LAMBDA_FUNCTION_NAME && !process.env.LAMBDA_TASK_ROOT) {
  app.listen(PORT, () => {
    console.log(`\n==================================================`);
    console.log(`🚀 INTELLETTO-26 Backend Server running on port ${PORT}`);
    console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`📊 TiDB Cloud configured: ${isTiDBConfigured()}`);
    console.log(`==================================================\n`);
  });
}

export default app;
