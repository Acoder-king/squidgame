import { getDbPool } from './db.js';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  const pool = getDbPool();

  // POST: Sync/Upload payment receipt from client to cloud
  if (event.httpMethod === 'POST') {
    try {
      let body = {};
      if (event.body) {
        body = JSON.parse(event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body);
      }
      const { player_tag, full_name, event_slug, event_name, transaction_id, proof_name, proof_data, college, department } = body;

      if (!player_tag || !proof_data) {
        return {
          statusCode: 400,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'player_tag and proof_data are required' }),
        };
      }

      // Check if registration already exists in TiDB
      const [existing] = await pool.query(
        'SELECT id, payment_details FROM registrations WHERE player_tag = ? LIMIT 1',
        [player_tag]
      );

      const newPaymentItem = {
        event_slug: event_slug || 'prompt-clash',
        event_name: event_name || 'Arena Event',
        transaction_id: transaction_id || '',
        proof_name: proof_name || 'receipt.jpg',
        proof_data,
        verified: false,
        submitted_at: new Date().toISOString(),
      };

      if (existing.length > 0) {
        let currentDetails = [];
        try {
          currentDetails = typeof existing[0].payment_details === 'string'
            ? JSON.parse(existing[0].payment_details)
            : existing[0].payment_details || [];
        } catch {}

        // Replace or append
        const filtered = Array.isArray(currentDetails)
          ? currentDetails.filter((p) => p.event_slug !== newPaymentItem.event_slug)
          : [];
        filtered.push(newPaymentItem);

        await pool.query(
          'UPDATE registrations SET payment_details = ? WHERE id = ?',
          [JSON.stringify(filtered), existing[0].id]
        );
      } else {
        await pool.query(
          `INSERT INTO registrations 
           (player_tag, full_name, email, phone, college, department, year_of_study, payment_details, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            player_tag,
            full_name || 'Arena Participant',
            'participant@symposium.in',
            '9999999999',
            college || 'College',
            department || 'Department',
            'Year',
            JSON.stringify([newPaymentItem]),
            'pending_verification',
          ]
        );
      }

      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: true, synced: true, player_tag }),
      };
    } catch (err) {
      console.error('Receipt sync error:', err.message);
      return {
        statusCode: 500,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: err.message }),
      };
    }
  }

  // GET: Fetch payment receipt
  if (event.httpMethod === 'GET') {
    try {
      const q = event.queryStringParameters || {};
      const tag = (q.tag || '').trim();
      const txn = (q.txn || q.id || '').trim();
      const slug = (q.slug || '').trim();
      const format = q.format || '';

      if (!tag && !txn) {
        return {
          statusCode: 400,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Player Tag or Transaction Reference required.' }),
        };
      }

      let reg = null;

      if (tag) {
        const [rows] = await pool.query(
          'SELECT player_tag, full_name, college, department, payment_details FROM registrations WHERE player_tag = ? LIMIT 1',
          [tag]
        );
        if (rows.length > 0) reg = rows[0];
      }

      if (!reg && txn) {
        const [rows] = await pool.query(
          'SELECT player_tag, full_name, college, department, payment_details FROM registrations WHERE payment_details LIKE ? LIMIT 1',
          [`%${txn}%`]
        );
        if (rows.length > 0) reg = rows[0];
      }

      if (!reg || !reg.payment_details) {
        return {
          statusCode: 404,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Receipt not found' }),
        };
      }

      let details = [];
      try {
        details = typeof reg.payment_details === 'string'
          ? JSON.parse(reg.payment_details)
          : reg.payment_details;
      } catch {}

      if (!Array.isArray(details) || !details.length) {
        return {
          statusCode: 404,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'No payment proof on file' }),
        };
      }

      const match = slug
        ? details.find((p) => p.event_slug === slug) || details[0]
        : details[0];

      if (!match || !match.proof_data) {
        return {
          statusCode: 404,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Screenshot not found' }),
        };
      }

      const payload = {
        player_tag: reg.player_tag,
        full_name: reg.full_name,
        college: reg.college,
        department: reg.department,
        event_slug: match.event_slug,
        event_name: match.event_name,
        transaction_id: match.transaction_id,
        proof_name: match.proof_name,
        proof_data: match.proof_data,
        submitted_at: match.submitted_at,
      };

      if (format === 'json') {
        return {
          statusCode: 200,
          headers: {
            ...headers,
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=3600',
          },
          body: JSON.stringify(payload),
        };
      }

      // Return image directly if requested as an image
      const dataMatch = match.proof_data.match(/^data:([^;]+);base64,(.+)$/);
      if (dataMatch) {
        return {
          statusCode: 200,
          headers: {
            ...headers,
            'Content-Type': dataMatch[1] || 'image/jpeg',
            'Cache-Control': 'public, max-age=86400',
          },
          body: dataMatch[2],
          isBase64Encoded: true,
        };
      }

      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      };
    } catch (err) {
      console.error('API receipt error:', err.message);
      return {
        statusCode: 500,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Failed to retrieve receipt' }),
      };
    }
  }

  return { statusCode: 405, headers, body: 'Method Not Allowed' };
};
