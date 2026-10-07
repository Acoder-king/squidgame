import dotenv from 'dotenv';

dotenv.config();

export const GOOGLE_SHEET_ID = '1YNq_7hz2QUfI0XkadtZlS_nWfR3_ThKgeJBW2Ohl72U';
export const GOOGLE_SHEET_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/edit`;

const EVENT_NAME_MAP = {
  'quest-of-mind': 'Quest of Mind',
  'free-fire': 'E-Sports (Free Fire)',
  'filmography-photography': 'Filmography / Photography',
  'paper-presentation': 'Paper Presentation / Poster',
  'ai-web-design': 'AI – Web Design',
  'technical-quiz': 'Technical Quiz',
  'squid-game': 'Squid Game',
  'prompt-clash': 'Prompt Clash',
};

/**
 * Format registration payload into a clean row object for Google Sheets
 */
export function formatRegistrationForSheet(data) {
  const eventNames = Array.isArray(data.event_slugs)
    ? data.event_slugs.map((slug) => EVENT_NAME_MAP[slug] || slug).join(', ')
    : '';

  const teammatesStr = Array.isArray(data.teammates)
    ? data.teammates.map((t) => (typeof t === 'string' ? t : t?.name || '')).filter(Boolean).join(', ')
    : '';

  const payments = Array.isArray(data.payment_details) ? data.payment_details : [];
  const txnIds = payments.map((p) => p.transaction_id).filter(Boolean).join(', ');
  const upiIds = payments.map((p) => p.upi_id).filter(Boolean).join(', ');
  const proofNames = payments.map((p) => p.proof_name).filter(Boolean).join(', ');

  const now = new Date();
  const timestamp = now.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'medium',
  });

  return {
    sheetId: GOOGLE_SHEET_ID,
    timestamp,
    player_tag: data.player_tag || '',
    full_name: data.full_name || '',
    email: data.email || '',
    phone: data.phone || '',
    alternate_phone: data.alternate_phone || '',
    college: data.college || '',
    department: data.department || '',
    year_of_study: data.year_of_study || '',
    city: data.city || '',
    state: data.state || '',
    emergency_contact: data.emergency_contact || '',
    events: eventNames,
    event_slugs: Array.isArray(data.event_slugs) ? data.event_slugs : [],
    team_name: data.team_name || '',
    team_size: data.team_size || '',
    teammates: teammatesStr,
    status: data.status || 'confirmed',
    transaction_ids: txnIds,
    upi_ids: upiIds,
    proof_names: proofNames,
  };
}

/**
export const DEFAULT_WEBHOOK_URL =
  'https://script.google.com/macros/s/AKfycbxgivsw14Cii1Ydd_38ImDn4zp5_M-pB1O4O53EOSsY0EunrDt5Xgm71p87Y7LffU9q/exec';

/**
 * Send registration record to Google Sheet
 * @param {object} registrationData
 */
export async function sendRegistrationToGoogleSheet(registrationData) {
  dotenv.config({ override: true });
  const rowData = formatRegistrationForSheet(registrationData);
  const webhookUrl =
    process.env.GOOGLE_SHEETS_WEBHOOK_URL ||
    process.env.GOOGLE_SHEET_WEBHOOK_URL ||
    process.env.SHEETS_WEBHOOK_URL ||
    DEFAULT_WEBHOOK_URL;

  if (!webhookUrl) {
    console.log(
      `\n[Google Sheets] 📋 Registration logged for Sheet ID: ${GOOGLE_SHEET_ID}\n` +
      `Player Tag: ${rowData.player_tag} | Name: ${rowData.full_name} | Events: ${rowData.events}\n` +
      `💡 To automatically stream rows into your Google Sheet, set GOOGLE_SHEETS_WEBHOOK_URL in .env\n`
    );
    return { ok: false, reason: 'no_webhook_url', data: rowData };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(rowData),
      redirect: 'follow',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[Google Sheets] Webhook responded with status: ${response.status}`);
      return { ok: false, status: response.status };
    }

    const resText = await response.text();
    console.log(`[Google Sheets] ✅ Successfully sent ${rowData.player_tag} to Google Sheet! Response:`, resText.slice(0, 100));
    return { ok: true, data: rowData };
  } catch (err) {
    console.error(`[Google Sheets] ⚠️ Error sending to Google Sheet:`, err.message);
    return { ok: false, error: err.message };
  }
}

export default {
  GOOGLE_SHEET_ID,
  GOOGLE_SHEET_URL,
  formatRegistrationForSheet,
  sendRegistrationToGoogleSheet,
};
