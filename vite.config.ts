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
            res.statusCode = result.valid ? 200 : 400;
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
