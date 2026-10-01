import { getDbPool } from './db.js';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const EVENT_WHATSAPP_HANDLERS = {
  'quest-of-mind': { event: 'Quest of Mind', phone: '916383567945', displayPhone: '6383567945' },
  'free-fire': { event: 'E-Sports (Free Fire)', phone: '919566685417', displayPhone: '9566685417' },
  'filmography-photography': { event: 'Filmography / Photography', phone: '918678903307', displayPhone: '8678903307' },
  'paper-presentation': { event: 'Paper Presentation / Poster', phone: '917010298642', displayPhone: '7010298642' },
  'ai-web-design': { event: 'AI – Web Design', phone: '918778477488', displayPhone: '8778477488' },
  'technical-quiz': { event: 'Technical Quiz', phone: '919489619915', displayPhone: '9489619915' },
  'squid-game': { event: 'Squid Game', phone: '916380559119', displayPhone: '6380559119' },
  'prompt-clash': { event: 'Prompt Clash', phone: '918807685732', displayPhone: '8807685732' },
};

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    let payload = {};
    if (event.body) {
      payload = JSON.parse(event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body);
    }

    const {
      full_name, email, phone, college, department, year_of_study,
      city, state, alternate_phone, emergency_contact, team_name, team_size, teammates,
      event_slugs = [], payment_details = []
    } = payload;

    const player_tag = 'IN26-' + Array.from({ length: 4 }, () => 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');
    const pool = getDbPool();

    const initialStatus = payment_details.length > 0 ? 'pending_verification' : 'confirmed';

    await pool.query(
      `INSERT INTO registrations 
       (player_tag, full_name, email, phone, college, department, year_of_study, city, state, alternate_phone, emergency_contact, team_name, team_size, teammates, payment_details, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        player_tag,
        full_name || 'Participant',
        email || 'participant@symposium.in',
        phone || '9999999999',
        college || 'College',
        department || 'Department',
        year_of_study || 'Year',
        city || null,
        state || null,
        alternate_phone || null,
        emergency_contact || null,
        team_name || null,
        team_size || null,
        JSON.stringify(teammates || []),
        payment_details.length ? JSON.stringify(payment_details) : null,
        initialStatus,
      ]
    );

    const coordinators = event_slugs
      .map((slug) => EVENT_WHATSAPP_HANDLERS[slug])
      .filter(Boolean);

    return {
      statusCode: 201,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ok: true,
        player_tag,
        full_name,
        event_slugs,
        payment_details,
        coordinators,
      }),
    };
  } catch (err) {
    console.error('Registration handler error:', err.message);
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message || 'Registration failed' }),
    };
  }
};
