import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(async ({ mode }) => {
  const devApiPlugin = {
    name: 'dev-api-middleware',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (!req.url?.startsWith('/api/')) return next();
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          return res.end();
        }

        const url = new URL(req.url, 'http://localhost');
        const pathname = url.pathname;

        let body: any = {};
        if (req.method === 'POST') {
          try {
            const chunks: Buffer[] = [];
            for await (const chunk of req) {
              chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
            }
            const raw = Buffer.concat(chunks).toString('utf8');
            if (raw) body = JSON.parse(raw);
          } catch (e) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: 'Invalid JSON body' }));
          }
        }

        try {
          const srv = await server.ssrLoadModule('/server/services.js');
          const tidb = await server.ssrLoadModule('/server/tidb-client.js');

          if (pathname === '/api/health') {
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({
              status: 'online',
              database: {
                type: 'TiDB Cloud (MySQL Protocol)',
                configured: tidb.isTiDBConfigured(),
              },
              timestamp: new Date().toISOString(),
            }));
          }

          if (pathname === '/api/events') {
            const slug = url.searchParams.get('slug') || undefined;
            const category = url.searchParams.get('category') || undefined;
            const data = await srv.getEventsService({ slug, category });
            if (slug && !data.length) {
              res.statusCode = 404;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ error: 'Event not found' }));
            }
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify(slug ? data[0] : data));
          }

          if (pathname === '/api/register' && req.method === 'POST') {
            const result = await srv.registerPlayerService(body);
            res.statusCode = 201;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify(result));
          }

          if (pathname === '/api/check-transaction' && (req.method === 'POST' || req.method === 'GET')) {
            const txnId = req.method === 'POST' ? body?.transactionId : url.searchParams.get('id');
            const result = await srv.checkTransactionIdService(txnId);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify(result));
          }

          if (pathname === '/api/contact' && req.method === 'POST') {
            const result = await srv.submitContactService(body);
            res.statusCode = 201;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify(result));
          }

          if (pathname === '/api/faqs') {
            const data = await srv.getFaqsService();
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify(data));
          }

          if (pathname === '/api/gallery') {
            const data = await srv.getGalleryService();
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify(data));
          }

          if (pathname === '/api/schedule') {
            const data = await srv.getScheduleService();
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify(data));
          }

          if (pathname === '/api/registrations') {
            const list = await srv.getRegistrationsService();
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ total: list.length, registrations: list }));
          }

          if (pathname === '/api/receipt') {
            const tag = url.searchParams.get('tag');
            const txn = url.searchParams.get('txn');
            const slug = url.searchParams.get('slug');
            const format = url.searchParams.get('format');
            const receipt = await srv.getReceiptService({ tag, txn, slug });

            if (!receipt || !receipt.proof_data) {
              if (format === 'json') {
                res.statusCode = 404;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ error: 'Receipt not found' }));
              }
              res.statusCode = 404;
              res.setHeader('Content-Type', 'text/html; charset=utf-8');
              return res.end(`
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

            if (format === 'json') {
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify(receipt));
            }

            const match = receipt.proof_data.match(/^data:([^;]+);base64,(.+)$/);
            if (match) {
              const mime = match[1] || 'image/jpeg';
              const buffer = Buffer.from(match[2], 'base64');
              res.setHeader('Content-Type', mime);
              res.setHeader('Cache-Control', 'public, max-age=86400');
              return res.end(buffer);
            }

            if (receipt.proof_data.startsWith('http')) {
              res.statusCode = 302;
              res.setHeader('Location', receipt.proof_data);
              return res.end();
            }

            res.setHeader('Content-Type', 'text/plain');
            return res.end(receipt.proof_data);
          }

          next();
        } catch (err: any) {
          console.error('API middleware error:', err);
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message || 'Internal Server Error' }));
        }
      });
    },
  };

  const plugins = [react(), tailwindcss(), devApiPlugin];
  try {
    // @ts-ignore
    const m = await import('./.vite-source-tags.js');
    plugins.push(m.sourceTags());
  } catch { }

  const env = loadEnv(mode, process.cwd(), ['VITE_', 'NEXT_PUBLIC_', 'TIDB_', 'DATABASE_']);
  const processEnvDefines: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    process.env[key] = value;
    processEnvDefines[`process.env.${key}`] = JSON.stringify(value);
  }

  return {
    server: {
      host: true,
      port: 5173,
    },
    plugins,
    envPrefix: ['VITE_', 'NEXT_PUBLIC_', 'TIDB_', 'DATABASE_'],
    define: processEnvDefines,
  };
})
