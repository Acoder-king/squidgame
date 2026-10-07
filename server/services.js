import { query, transaction, isTiDBConfigured } from './tidb-client.js';
import { sendRegistrationToGoogleSheet } from './google-sheets.js';

// Fallback seed data in case database is still connecting or initializing
const FALLBACK_FAQS = [
  { id: 1, question: 'What is INTELLETTO-26?', answer: 'INTELLETTO-26 is a national level technical symposium hosted by the Department of Artificial Intelligence & Machine Learning, featuring 8 competitive arenas.', sort_order: 1 },
  { id: 2, question: 'Who can participate?', answer: 'The symposium is open to undergraduate and postgraduate students from Engineering, Technology, Polytechnic, and Arts & Science colleges across India.', sort_order: 2 },
  { id: 3, question: 'How do I register?', answer: 'Use the Player Registration page on this portal: pick your arenas, provide your academic & contact details, and receive your unique Player Tag.', sort_order: 3 },
  { id: 4, question: 'Can I register for multiple events?', answer: 'Yes! You can choose multiple technical and non-technical arenas during registration.', sort_order: 4 },
];

const FALLBACK_SCHEDULE = [
  { id: 1, day_label: 'DAY 01', start_time: '09:00 AM', end_time: '10:00 AM', title: 'Inaugural Protocol & Keynote Address', description: 'Assembly at the Main Auditorium with department dignitaries and keynote remarks.', venue_hint: 'Main Seminar Hall', sort_order: 1 },
  { id: 2, day_label: 'DAY 01', start_time: '10:15 AM', end_time: '01:00 PM', title: 'Arena Combat: Round 1 Prelims', description: 'Simultaneous deployment across Technical Quiz, AI Web Design, Paper Presentation, and Prompt Clash.', venue_hint: 'Department Labs', sort_order: 2 },
  { id: 3, day_label: 'DAY 01', start_time: '01:00 PM', end_time: '02:00 PM', title: 'Lunch & Tactical Debrief', description: 'Midday recharge and coordinator briefings for qualified stage finalists.', venue_hint: 'Dining Pavilion', sort_order: 3 },
  { id: 4, day_label: 'DAY 01', start_time: '02:00 PM', end_time: '04:30 PM', title: 'Non-Technical Arenas & Finals Showdown', description: 'Free Fire, Quest of Mind, Squid Game, and Photo Showcase evaluation.', venue_hint: 'Amphitheatre', sort_order: 4 },
  { day_label: 'DAY 01', start_time: '04:45 PM', end_time: '05:45 PM', title: 'Grand Valedictory & Prize Distribution', description: 'Trophy presentations, cash awards, and coordinator recognition.', venue_hint: 'Main Stage', sort_order: 5 },
];

const FALLBACK_GALLERY = [
  { id: 1, src: '/media/ev26-7.jpg', title: "Engineer's Vision 2026 Inaugural", caption: 'Auditorium Conclave & Symposium Assembly', sort_order: 1 },
  { id: 2, src: '/media/ev26-1.jpg', title: 'AI Autonomous Rescue Robot', caption: 'Podium Defence · Robotics Innovation', sort_order: 2 },
  { id: 3, src: '/media/ev26-2.jpg', title: 'Faculty Keynote & Mentorship', caption: 'Department Dignitaries & Organizers Address', sort_order: 3 },
  { id: 4, src: '/media/ev26-3.jpg', title: 'Project OPTIK AI', caption: 'Rural Communities Computer Vision', sort_order: 4 },
  { id: 5, src: '/media/ev26-4.jpg', title: 'ReVive Earth Clean Energy', caption: 'Sustainable Tech & Green Innovations', sort_order: 5 },
  { id: 6, src: '/media/ev26-5.jpg', title: 'MediCura AI Healthcare', caption: 'Intelligent Medical Diagnostic Architecture', sort_order: 6 },
];

// -------------------------------------------------------------
// In-memory stores when DB credentials are not yet set
// -------------------------------------------------------------
const memRegistrations = [];
const memRegistrationEvents = [];
const memContactMessages = [];

export const clean = (v, max = 255) =>
  typeof v === 'string' ? v.replace(/[<>'"`]/g, '').trim().slice(0, max) : '';

export const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
export const phoneOk = (v) => /^[+]?[\d\s-]{10,16}$/.test(v);
export const genPlayerTag = () =>
  'IN26-' + Array.from({ length: 4 }, () => 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');

export const EVENT_WHATSAPP_HANDLERS = {
  'quest-of-mind': { event: 'Quest of Mind', phone: '916383567945', displayPhone: '6383567945' },
  'free-fire': { event: 'E-Sports (Free Fire)', phone: '919566685417', displayPhone: '9566685417' },
  'filmography-photography': { event: 'Filmography / Photography', phone: '918678903307', displayPhone: '8678903307' },
  'paper-presentation': { event: 'Paper Presentation / Poster', phone: '917010298642', displayPhone: '7010298642' },
  'ai-web-design': { event: 'AI – Web Design', phone: '918778477488', displayPhone: '8778477488' },
  'technical-quiz': { event: 'Technical Quiz', phone: '919489619915', displayPhone: '9489619915' },
  'squid-game': { event: 'Squid Game', phone: '916380559119', displayPhone: '6380559119' },
  'prompt-clash': { event: 'Prompt Clash', phone: '918807685732', displayPhone: '8807685732' },
};

// -------------------------------------------------------------
// UPI Reference / UTR Validation & Duplicate Checking
// -------------------------------------------------------------
export function validateUpiTransactionId(rawId) {
  if (!rawId || typeof rawId !== 'string') {
    return { valid: false, reason: 'empty', message: 'UPI Reference ID is required.' };
  }
  const cleanId = rawId.trim();

  // Real Indian UPI UTR is strictly 12 numeric digits
  if (!/^\d{12}$/.test(cleanId)) {
    return {
      valid: false,
      reason: 'format',
      message: `UPI Reference / UTR must be exactly 12 numeric digits from your payment receipt (e.g., 427012345678). You entered ${cleanId.length} digits.`,
    };
  }

  // Reject dummy repeating digits (e.g. 000000000000, 111111111111)
  if (/^(\d)\1{11}$/.test(cleanId)) {
    return {
      valid: false,
      reason: 'dummy',
      message: 'Invalid reference ID: repeating digits are not allowed. Please enter your real payment UTR.',
    };
  }

  // Reject obvious sequential test sequences
  const dummySequences = [
    '123456789012',
    '012345678901',
    '234567890123',
    '345678901234',
    '987654321098',
    '876543210987',
    '121212121212',
    '123123123123',
  ];
  if (dummySequences.includes(cleanId)) {
    return {
      valid: false,
      reason: 'dummy',
      message: 'Dummy/test transaction ID detected! Enter the genuine 12-digit UTR from your UPI payment app.',
    };
  }

  return { valid: true, cleanId };
}

export async function checkTransactionIdService(transactionId) {
  const val = validateUpiTransactionId(transactionId);
  if (!val.valid) return val;
  const txn = val.cleanId;

  // 1. Check in-memory registrations for duplicate
  for (const reg of memRegistrations) {
    if (Array.isArray(reg.payment_details)) {
      const match = reg.payment_details.find((p) => p && p.transaction_id === txn);
      if (match) {
        return {
          valid: false,
          reason: 'duplicate',
          message: `Duplicate Transaction ID! Reference ID ${txn} has already been registered in the system (Player: ${reg.player_tag}). Duplicate payments are rejected.`,
        };
      }
    }
  }

  // 2. Check TiDB database for duplicate
  if (isTiDBConfigured()) {
    try {
      const rows = await query(
        `SELECT player_tag, created_at, payment_details 
         FROM registrations 
         WHERE payment_details IS NOT NULL AND payment_details LIKE ? 
         LIMIT 1`,
        [`%${txn}%`]
      );
      if (rows && rows.length > 0) {
        return {
          valid: false,
          reason: 'duplicate',
          message: `Duplicate Transaction ID! Reference ID ${txn} was already submitted in a previous registration. Reusing transaction IDs is prohibited.`,
        };
      }
    } catch (err) {
      console.warn('DB check for transaction id warning:', err.message);
    }
  }

  return { valid: true, message: 'Valid UPI Reference ID (Unique)' };
}

// -------------------------------------------------------------
// 1. Events Service
// -------------------------------------------------------------
export async function getEventsService({ slug, category } = {}) {
  if (isTiDBConfigured()) {
    try {
      let sql = 'SELECT * FROM events';
      const params = [];
      const conditions = [];

      if (slug) {
        conditions.push('slug = ?');
        params.push(slug);
      }
      if (category) {
        conditions.push('category = ?');
        params.push(category);
      }
      if (conditions.length) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }
      sql += ' ORDER BY sort_order ASC';

      const rows = await query(sql, params);
      if (rows && rows.length > 0) {
        return rows.map((r) => ({
          ...r,
          rules: typeof r.rules === 'string' ? JSON.parse(r.rules) : r.rules || [],
        }));
      }
    } catch (err) {
      console.warn('TiDB query error in getEventsService (falling back to static data):', err.message);
    }
  }

  // Fallback to static official events definition
  const { OFFICIAL_EVENTS } = await import('../src/data/eventsData.js').catch(async () => {
    return await import('../src/data/eventsData.ts');
  });

  let results = OFFICIAL_EVENTS || [];
  if (slug) results = results.filter((e) => e.slug === slug);
  if (category) results = results.filter((e) => e.category === category);
  return results;
}

// -------------------------------------------------------------
// 2. Registration Service
// -------------------------------------------------------------
export async function registerPlayerService(payload) {
  const event_slugs = Array.isArray(payload.event_slugs)
    ? payload.event_slugs.map((s) => clean(String(s), 60)).filter(Boolean)
    : [];
  const full_name = clean(payload.full_name, 80);
  const email = clean(payload.email, 120).toLowerCase();
  const phone = clean(payload.phone, 20);
  const college = clean(payload.college, 140);
  const department = clean(payload.department, 80);
  const year_of_study = clean(payload.year_of_study, 20);
  const city = clean(payload.city, 60);
  const state = clean(payload.state, 60);
  const alternate_phone = clean(payload.alternate_phone, 20);
  const emergency_contact = clean(payload.emergency_contact, 100);
  const team_name = clean(payload.team_name, 80);
  const team_size = clean(payload.team_size, 10);
  const teammates = Array.isArray(payload.teammates)
    ? payload.teammates.slice(0, 5).map((t) => ({ name: clean(t && t.name, 80) })).filter((t) => t.name.length >= 2)
    : [];

  if (!event_slugs.length) throw new Error('Select at least one arena.');
  if (full_name.length < 3) throw new Error('Full name is required.');
  if (!emailOk(email)) throw new Error('A valid email is required.');
  if (!phoneOk(phone)) throw new Error('A valid phone number is required.');
  if (college.length < 3) throw new Error('College name is required.');
  if (department.length < 2) throw new Error('Department is required.');
  if (!year_of_study) throw new Error('Year of study is required.');
  if (alternate_phone && !phoneOk(alternate_phone)) throw new Error('Alternate phone is invalid.');
  if (payload.agree_rules !== true) throw new Error('You must accept the arena protocol.');

  const player_tag = genPlayerTag();

  // Validate payment details if provided
  const rawPayments = Array.isArray(payload.payment_details) ? payload.payment_details : [];
  const payment_details = [];
  const seenTxns = new Set();

  for (const p of rawPayments) {
    if (!p || !p.transaction_id) continue;
    const val = validateUpiTransactionId(p.transaction_id);
    if (!val.valid) {
      throw new Error(`Invalid payment reference for ${p.event_name || p.event_slug}: ${val.message}`);
    }
    if (seenTxns.has(val.cleanId)) {
      throw new Error(`Duplicate transaction ID detected: ${val.cleanId} is used for multiple events.`);
    }
    seenTxns.add(val.cleanId);

    const dupCheck = await checkTransactionIdService(val.cleanId);
    if (!dupCheck.valid) {
      throw new Error(dupCheck.message || `Transaction ID ${val.cleanId} is duplicate.`);
    }

    payment_details.push({
      event_slug: clean(p.event_slug, 60),
      event_name: clean(p.event_name, 100),
      coordinator: clean(p.coordinator, 80),
      upi_id: clean(p.upi_id, 80),
      transaction_id: val.cleanId,
      proof_name: clean(p.proof_name, 120),
      proof_data: typeof p.proof_data === 'string' ? p.proof_data.slice(0, 1000000) : null,
      verified: false,
      submitted_at: new Date().toISOString(),
    });
  }

  const initialStatus = payment_details.length > 0 ? 'pending_verification' : 'confirmed';

  if (isTiDBConfigured()) {
    return await transaction(async (conn) => {
      let regId;
      try {
        // Try inserting with payment_details
        const [res] = await conn.execute(
          `INSERT INTO registrations 
           (player_tag, full_name, email, phone, college, department, year_of_study, city, state, alternate_phone, emergency_contact, team_name, team_size, teammates, payment_details, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            player_tag, full_name, email, phone, college, department, year_of_study,
            city || null, state || null, alternate_phone || null, emergency_contact || null,
            team_name || null, team_size || null, JSON.stringify(teammates),
            payment_details.length ? JSON.stringify(payment_details) : null,
            initialStatus,
          ]
        );
        regId = res.insertId;
      } catch (insertErr) {
        if (insertErr.message && insertErr.message.includes('Unknown column')) {
          try {
            await conn.execute('ALTER TABLE registrations ADD COLUMN payment_details JSON NULL, ADD COLUMN payment_status VARCHAR(40) DEFAULT "pending_verification"');
            const [res] = await conn.execute(
              `INSERT INTO registrations 
               (player_tag, full_name, email, phone, college, department, year_of_study, city, state, alternate_phone, emergency_contact, team_name, team_size, teammates, payment_details, status)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                player_tag, full_name, email, phone, college, department, year_of_study,
                city || null, state || null, alternate_phone || null, emergency_contact || null,
                team_name || null, team_size || null, JSON.stringify(teammates),
                payment_details.length ? JSON.stringify(payment_details) : null,
                initialStatus,
              ]
            );
            regId = res.insertId;
          } catch (alterErr) {
            const [res] = await conn.execute(
              `INSERT INTO registrations 
               (player_tag, full_name, email, phone, college, department, year_of_study, city, state, alternate_phone, emergency_contact, team_name, team_size, teammates, status)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                player_tag, full_name, email, phone, college, department, year_of_study,
                city || null, state || null, alternate_phone || null, emergency_contact || null,
                team_name || null, team_size || null, JSON.stringify(teammates), initialStatus,
              ]
            );
            regId = res.insertId;
          }
        } else {
          throw insertErr;
        }
      }

      // 2. Insert joined events
      for (const slug of event_slugs) {
        await conn.execute(
          'INSERT INTO registration_events (registration_id, event_slug) VALUES (?, ?)',
          [regId, slug]
        );
      }

      const coordinators = event_slugs
        .map((slug) => EVENT_WHATSAPP_HANDLERS[slug])
        .filter(Boolean);

      const result = {
        ok: true,
        player_tag,
        full_name,
        event_slugs,
        id: regId,
        status: initialStatus,
        payment_details,
        coordinators,
      };

      // Send to Google Sheet in background
      sendRegistrationToGoogleSheet({
        player_tag,
        full_name,
        email,
        phone,
        college,
        department,
        year_of_study,
        city,
        state,
        alternate_phone,
        emergency_contact,
        team_name,
        team_size,
        teammates,
        event_slugs,
        payment_details,
        status: initialStatus,
      }).catch((err) => console.warn('[Google Sheets] Async dispatch warning:', err.message));

      return result;
    });
  }

  // In-memory fallback if TiDB not configured yet
  const regRecord = {
    id: memRegistrations.length + 1,
    player_tag,
    full_name,
    email,
    phone,
    college,
    department,
    year_of_study,
    city,
    state,
    alternate_phone,
    emergency_contact,
    team_name,
    team_size,
    teammates,
    payment_details,
    status: initialStatus,
    created_at: new Date().toISOString(),
  };
  memRegistrations.push(regRecord);
  for (const slug of event_slugs) {
    memRegistrationEvents.push({ registration_id: regRecord.id, event_slug: slug });
  }

  const coordinators = event_slugs
    .map((slug) => EVENT_WHATSAPP_HANDLERS[slug])
    .filter(Boolean);

  const result = {
    ok: true,
    player_tag,
    full_name,
    event_slugs,
    id: regRecord.id,
    status: initialStatus,
    payment_details,
    coordinators,
    persisted: 'memory_fallback',
  };

  // Send to Google Sheet in background
  sendRegistrationToGoogleSheet({ ...regRecord, event_slugs }).catch((err) =>
    console.warn('[Google Sheets] Async dispatch warning:', err.message)
  );

  return result;
}

// -------------------------------------------------------------
// 3. Contact Inquiries Service
// -------------------------------------------------------------
export async function submitContactService(payload) {
  const name = clean(payload.name, 80);
  const email = clean(payload.email, 120).toLowerCase();
  const phone = clean(payload.phone, 20);
  const subject = clean(payload.subject, 140);
  const message = clean(payload.message, 2000);

  if (name.length < 2) throw new Error('Name is required.');
  if (!emailOk(email)) throw new Error('A valid email is required.');
  if (message.length < 5) throw new Error('Message is too short.');

  if (isTiDBConfigured()) {
    await query(
      'INSERT INTO contact_messages (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)',
      [name, email, phone || null, subject || null, message]
    );
    return { ok: true };
  }

  memContactMessages.push({
    id: memContactMessages.length + 1,
    name,
    email,
    phone,
    subject,
    message,
    created_at: new Date().toISOString(),
  });
  return { ok: true, persisted: 'memory_fallback' };
}

// -------------------------------------------------------------
// 4. FAQs Service
// -------------------------------------------------------------
export async function getFaqsService() {
  if (isTiDBConfigured()) {
    try {
      const rows = await query('SELECT * FROM faqs ORDER BY sort_order ASC');
      if (rows && rows.length > 0) return rows;
    } catch (err) {
      console.warn('TiDB query error in getFaqsService:', err.message);
    }
  }
  return FALLBACK_FAQS;
}

// -------------------------------------------------------------
// 5. Gallery Service
// -------------------------------------------------------------
export async function getGalleryService() {
  if (isTiDBConfigured()) {
    try {
      const rows = await query('SELECT * FROM gallery_items ORDER BY sort_order ASC');
      if (rows && rows.length > 0) return rows;
    } catch (err) {
      console.warn('TiDB query error in getGalleryService:', err.message);
    }
  }
  return FALLBACK_GALLERY;
}

// -------------------------------------------------------------
// 6. Schedule Service
// -------------------------------------------------------------
export async function getScheduleService() {
  if (isTiDBConfigured()) {
    try {
      const rows = await query('SELECT * FROM schedule_items ORDER BY sort_order ASC');
      if (rows && rows.length > 0) return rows;
    } catch (err) {
      console.warn('TiDB query error in getScheduleService:', err.message);
    }
  }
  return FALLBACK_SCHEDULE;
}

// -------------------------------------------------------------
// 7. Admin / Registrations List Service
// -------------------------------------------------------------
export async function getRegistrationsService() {
  if (isTiDBConfigured()) {
    const regs = await query('SELECT * FROM registrations ORDER BY created_at DESC');
    const joins = await query('SELECT registration_id, event_slug FROM registration_events');

    const map = new Map();
    for (const j of joins) {
      if (!map.has(j.registration_id)) map.set(j.registration_id, []);
      map.get(j.registration_id).push(j.event_slug);
    }

    return regs.map((r) => ({
      ...r,
      teammates: typeof r.teammates === 'string' ? JSON.parse(r.teammates) : r.teammates || [],
      event_slugs: map.get(r.id) || [],
    }));
  }

  return memRegistrations.map((r) => {
    const slugs = memRegistrationEvents.filter((j) => j.registration_id === r.id).map((j) => j.event_slug);
    return { ...r, event_slugs: slugs };
  });
}

// -------------------------------------------------------------
// 8. Payment Receipt Image Service
// -------------------------------------------------------------
export async function getReceiptService({ tag, txn, slug } = {}) {
  const cleanTag = clean(tag || '', 40);
  const cleanTxn = clean(txn || '', 40);
  const cleanSlug = clean(slug || '', 60);

  if (!cleanTag && !cleanTxn) return null;

  let reg = null;

  if (isTiDBConfigured()) {
    try {
      if (cleanTag) {
        const rows = await query('SELECT player_tag, full_name, payment_details FROM registrations WHERE player_tag = ? LIMIT 1', [cleanTag]);
        if (rows && rows.length > 0) reg = rows[0];
      }
      if (!reg && cleanTxn) {
        const rows = await query('SELECT player_tag, full_name, payment_details FROM registrations WHERE payment_details LIKE ? LIMIT 1', [`%${cleanTxn}%`]);
        if (rows && rows.length > 0) reg = rows[0];
      }
    } catch (err) {
      console.warn('TiDB query error in getReceiptService:', err.message);
    }
  }

  if (!reg) {
    reg = memRegistrations.find((r) =>
      (cleanTag && r.player_tag?.toUpperCase() === cleanTag.toUpperCase()) ||
      (cleanTxn && r.payment_details?.some((p) => p.transaction_id === cleanTxn))
    );
  }

  if (!reg || !reg.payment_details) return null;

  const details = typeof reg.payment_details === 'string'
    ? JSON.parse(reg.payment_details)
    : reg.payment_details;

  if (!Array.isArray(details) || !details.length) return null;

  const match = cleanSlug
    ? details.find((p) => p.event_slug === cleanSlug) || details[0]
    : details[0];

  if (!match || !match.proof_data) return null;

  return {
    player_tag: reg.player_tag,
    full_name: reg.full_name,
    event_slug: match.event_slug,
    event_name: match.event_name,
    transaction_id: match.transaction_id,
    proof_name: match.proof_name,
    proof_data: match.proof_data,
  };
}



