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

  try {
    let txnId = '';
    if (event.httpMethod === 'POST' && event.body) {
      const body = JSON.parse(event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body);
      txnId = body.transactionId || body.id;
    } else if (event.queryStringParameters) {
      txnId = event.queryStringParameters.id;
    }

    if (!txnId) {
      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ valid: true }),
      };
    }

    const pool = getDbPool();
    const [rows] = await pool.query(
      'SELECT player_tag FROM registrations WHERE payment_details LIKE ? LIMIT 1',
      [`%${txnId}%`]
    );

    if (rows.length > 0) {
      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          valid: false,
          message: `This UPI Reference / UTR has already been claimed by Player ${rows[0].player_tag}.`,
        }),
      };
    }

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ valid: true, message: 'Valid and unique transaction reference.' }),
    };
  } catch (err) {
    console.error('check-transaction Netlify error:', err.message);
    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ valid: true, warning: 'Offline fallback applied' }),
    };
  }
};
