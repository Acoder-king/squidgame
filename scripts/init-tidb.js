import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

dotenv.config({ path: path.resolve(rootDir, '.env') });

const SEED_EVENTS = [
  {
    slug: 'technical-quiz',
    name: 'Technical Quiz',
    category: 'technical',
    tagline: 'Test your computing fundamentals, algorithmic speed, and rapid-fire tech instincts.',
    description: 'A multi-tier intellectual battleground testing computer science fundamentals, emerging technologies, algorithms, and rapid-fire tech trivia across 3 competitive rounds.',
    icon: 'BrainCircuit',
    stage_code: 'STAGE // ALPHA',
    team_size: '1 — 2 Players',
    member_limit: 'Solo (1) or Team of 2',
    per_head_fee: '50/-',
    team_fee: '100/-',
    prize: '300/200',
    duration: 'Multi-Round',
    eligibility: 'All Engineering & Tech Students',
    rules: [
      'Phone/Laptop with active internet connection is mandatory for every participant.',
      'Complete each quiz section strictly within the allotted time window.',
      'Anti-Cheating Protocol: Do NOT press the browser back button during the quiz.',
      'Do NOT switch browser tabs or minimize the test window — tab switches are monitored.',
      'Round 1: 20 Questions | 50 Members pool → 25 Eliminated → Top 25 Selected.',
      'Round 2: 15 Questions | 25 Members → 15 Eliminated → Top 10 Selected.',
      'Round 3 (Finals): 10 Questions | 10 Members → 8 Eliminated → Top 2 Winners declared.',
      'Decisions of the quiz coordinators are final and binding.'
    ],
    venue_hint: 'Main Seminar Hall',
    fee: '₹50/- per head · ₹100/- per team',
    sort_order: 1,
  },
  {
    slug: 'ai-web-design',
    name: 'AI – Web Design',
    category: 'technical',
    tagline: 'Harness generative AI, intelligent layouts, and high-fidelity frontends under tight combat constraints.',
    description: 'Design and assemble next-generation web experiences utilizing modern AI design tools, rapid prototyping frameworks, and frontend precision across UI/UX and web development stages.',
    icon: 'Code2',
    stage_code: 'STAGE // BETA',
    team_size: '1 — 2 Players',
    member_limit: 'Solo (1) or Team of 2',
    per_head_fee: '50/-',
    team_fee: '100/-',
    prize: '300/200',
    duration: '2 Rounds',
    eligibility: 'All UG / PG Students',
    rules: [
      'Participation is allowed individually or in a team of two.',
      'Registration fee: ₹50 per participant; ₹100 per team of two.',
      'Participants may bring their own laptops or use systems provided at the lab venue.',
      'ROUND 1 — UI/UX DESIGN: Participants will be given a theme/problem statement on the spot to create a website UI/UX layout focusing on creativity, visual appeal, layout hierarchy, and user experience.',
      'Tools for Round 1: Figma, Canva, or any other UI/UX design tools (specific tool announced on the spot).',
      'Selected qualifiers from Round 1 will advance to Round 2.',
      'ROUND 2 — WEBSITE DEVELOPMENT: Participants will convert their Round 1 UI/UX design into a functional and responsive website using web development tools or AI-powered website builders.',
      'AI tools may be used for assistance, but the overall design architecture and work must be executed by the participants.',
      'Participants must adhere to coordinator instructions to ensure smooth conduct.'
    ],
    venue_hint: 'Advanced Computing Lab 1',
    fee: '₹50/- per head · ₹100/- per team',
    sort_order: 2,
  },
  {
    slug: 'paper-presentation',
    name: 'PPT Presentation',
    category: 'technical',
    tagline: 'Defend innovative research, technical architectures, and high-impact slides before the jury.',
    description: 'Present original research and structured technical slides highlighting cutting-edge advances in AI, Cloud, Cybersecurity, IoT, or emerging engineering domains.',
    icon: 'FileText',
    stage_code: 'STAGE // GAMMA',
    team_size: '1 — 2 Players',
    member_limit: 'Maximum 2 participants per team',
    per_head_fee: '50/-',
    team_fee: '100/-',
    prize: '500/300',
    duration: '5–7 Mins + 2 Mins Q&A',
    eligibility: 'Open to all registered symposium participants',
    rules: [
      'Eligibility: Open to all registered symposium participants.',
      'Team Size: Maximum 2 participants per team.',
      'Presentation Time: 5–7 minutes for presentation, followed by 2 minutes for judge Q&A.',
      'PPT Slide Limit: Maximum 10 slides strictly allowed.',
      'Topic: Presentation must be relevant to the given or selected technical theme.',
      'Originality: Content must be 100% original. Plagiarism leads to immediate disqualification.',
      'PPT Submission: Submit your presentation file at least 15 minutes before the event starts.',
      'File Format: PPT must be submitted in standard PPT / PPTX format.',
      'Reporting Time: Report to venue at least 15 minutes before your allotted presentation slot.',
      'Q&A Defense: Participants must answer technical questions from judges after presentation.',
      'Discipline: Maintain proper academic discipline and decorum throughout the event.',
      'Judges’ Decision: The decision of the judges will be final and binding.',
      'Disqualification Criteria: Exceeding allotted time, plagiarism/copied content, inappropriate or offensive material, or failure to follow rules.'
    ],
    venue_hint: 'Conference Auditorium B',
    fee: '₹50/- per head · ₹100/- per team',
    sort_order: 3,
  },
  {
    slug: 'prompt-clash',
    name: 'Prompt Clash',
    category: 'technical',
    tagline: 'Master prompt architecture, outsmart LLMs, and craft targeted AI outputs in a head-to-head arena.',
    description: 'Enter the prompt engineering arena. Test your visual perception and prompt precision across manual drafting and live AI generation rounds.',
    icon: 'Sparkles',
    stage_code: 'STAGE // DELTA',
    team_size: '1 — 2 Players',
    member_limit: 'Individual or Team of 2',
    per_head_fee: '50/-',
    team_fee: '100/-',
    prize: '300/200',
    duration: '2 Rounds',
    eligibility: 'Open to All Registrants',
    rules: [
      'Participation: Compete individually (₹50) or as a team of 2 (₹100).',
      'Hardware: Mobile phones are mandatory for the event; laptops are optional based on participant choice.',
      'ROUND 1 — PROMPT CREATION: An image will be displayed on screen for exactly 1 minute.',
      'Round 1 Device Ban: Mobile phones and laptops are strictly NOT allowed during Round 1.',
      'Round 1 Drafting: An A4 sheet will be provided. Participants get 20 minutes to write a prompt based on the displayed image.',
      'Evaluation for Round 1: Prompts evaluated on structure, clarity, detail, creativity, and descriptive accuracy. Top scorers advance to Round 2.',
      'ROUND 2 — AI CHALLENGE: Mobile phones and laptops are allowed.',
      'AI Tool Policy: Only FREE AI tools may be used. Paid or subscription-based AI tools are strictly prohibited.',
      'Execution: Participants will feed their written prompt into the AI tool to generate the final output.',
      'Final Scoring: Winners selected based on prompt quality and final AI-generated fidelity. 2 winners will be announced.',
      'General Rules: Any unfair practice leads to disqualification. Judges’ decision is final.'
    ],
    venue_hint: 'AI & Data Science Lab',
    fee: '₹50/- per head · ₹100/- per team',
    sort_order: 4,
  },
  {
    slug: 'free-fire',
    name: 'E-Sports (Free Fire)',
    category: 'non-technical',
    tagline: 'Battle royale survival, tactical positioning, and lightning reflexes on the virtual battleground.',
    description: 'Squad up for high-octane mobile battle royale combat. 26 squad slots, multi-stage knockouts, Clash Squad battles, and IPL rules showdown.',
    icon: 'Gamepad2',
    stage_code: 'STAGE // EPSILON',
    team_size: 'Squad (4 Players)',
    member_limit: 'Team of 4 members',
    per_head_fee: '-',
    team_fee: '200/-',
    prize: '500/300',
    duration: '5 Rounds Knockout',
    eligibility: 'All Registered Symposium Players',
    rules: [
      'Hardware: Participants must play using mobile phones only. Emulators, tablets, or PC setups are strictly forbidden.',
      'Anti-Cheat: Absolutely no hacks, scripts, third-party mods, or glitch exploits allowed.',
      'Match Continuity: Do NOT exit or disconnect once the match countdown has commenced.',
      'Capacity: Tournament capped at a maximum of 26 squad slots.',
      'Round 1: 13 slots | 52 members → Top 3 teams selected.',
      'Round 2: 13 slots | 52 members → Top 3 teams selected.',
      'Round 3 (Clash Squad): Total 6 qualifying teams battle in CS mode → Top 3 teams selected.',
      'Round 4 (Finals): The 3 finalist squads battle under IPL tournament rules.',
      'Round 5 (Grand Podium): Champions declared and awarded live on stage.'
    ],
    venue_hint: 'E-Sports Arena / Hall 3',
    fee: '₹200/- per squad (4 players)',
    sort_order: 5,
  },
  {
    slug: 'quest-of-mind',
    name: 'Quest of Mind',
    category: 'non-technical',
    tagline: 'Solve cryptic puzzles, decipher hidden connections, and conquer intellectual challenges.',
    description: 'An exhilarating mind-bending competition featuring visual connections, rebus puzzles, lateral thinking, and cognitive riddle gauntlets under strict 15-second timers.',
    icon: 'Zap',
    stage_code: 'STAGE // ZETA',
    team_size: '1 — 2 Players',
    member_limit: '1 to 2 members per team',
    per_head_fee: '50/-',
    team_fee: '100/-',
    prize: '300/200',
    duration: '3 Rounds',
    eligibility: 'Open to All Registrants',
    rules: [
      'Team Size: Each team must have 1–2 members.',
      'Registration Fee: ₹50 per participant (₹100 per team of 2).',
      'Capacity Limit: Maximum of 20 teams can participate in the arena.',
      'Tournament Structure: The event consists of 3 elimination rounds.',
      'Speed Timer: Each question carries a strict 15-second time limit.',
      'Electronic Ban: Mobile phones, smartwatches, and internet usage are strictly prohibited.',
      'Answer Submission: Answers must be given within the specified 15-second countdown.',
      'Fair Play: Participants must maintain discipline, fair play, and sportsmanship.',
      'Coordinator Protocol: Follow all instructions given by event coordinators.'
    ],
    venue_hint: 'Mechanical Block Seminar Room',
    fee: '₹50/- per head · ₹100/- per team',
    sort_order: 6,
  },
  {
    slug: 'squid-game',
    name: 'Squid Game',
    category: 'non-technical',
    tagline: 'Survive. Compete. Win. 3 high-stakes elimination rounds where one mistake sends you home.',
    description: 'Step into the survival arena where precision, agility, patience, and nerves of steel dictate your fate across 3 ruthless elimination games until only two finalists remain.',
    icon: 'Crown',
    stage_code: 'STAGE // ETA',
    team_size: 'Solo Entry (1 Player)',
    member_limit: 'Individual survival entry',
    per_head_fee: '50/-',
    team_fee: '-',
    prize: '300/200',
    duration: '3 Elimination Games',
    eligibility: 'Open to All Registrants',
    rules: [
      'General Instructions: Follow all instructions given by organizers and judges. Understand and follow the rules of each game before playing.',
      'No Excuses: “I don’t know how to play” or “I didn’t know the rules” will NOT be accepted as an excuse once the game begins.',
      'Zero Tolerance: Any attempt to cheat, manipulate the game, or gain an unfair advantage results in immediate disqualification.',
      'Discipline & Respect: Maintain discipline and respect toward other participants, organizers, and judges. Fighting, pushing, abusing, or intentionally disturbing others is strictly prohibited.',
      'Game Integrity: Do not interfere with the game once started. Mobile phones and unauthorized devices must not be used during gameplay.',
      'Punctuality: Report to the venue on time. Late entry results in automatic disqualification.',
      'GAME STRUCTURE (3 ELIMINATION ROUNDS):',
      '🟢 GAME 1 (First Round): All registered participants compete. 50% eliminated; remaining 50% qualify for Game 2.',
      '🟡 GAME 2 (Second Round): Qualified participants from Game 1 compete. 25% of original pool eliminated; survivors proceed to the final game.',
      '🔴 GAME 3 (Final Round): Remaining participants compete until only 2 finalists remain: 🥇 1st Place Winner, 🥈 2nd Place Runner-up.',
      'Elimination Rules: Elimination is based strictly on performance and rules. Once eliminated, participants cannot re-enter. No second chances.',
      'Safety: Follow all safety instructions. Dangerous physical actions, pushing, or hitting are prohibited. Organizers reserve the right to halt games for safety.',
      'Judges’ Decision: The decision of the judges and organizers is final and binding. Arguments will not be entertained.'
    ],
    venue_hint: 'Open Air Amphitheatre / Quad',
    fee: '₹50/- per player',
    sort_order: 7,
  },
  {
    slug: 'filmography-photography',
    name: 'Filmography / Photography',
    category: 'non-technical',
    tagline: 'Capture cinematic frames, compelling visual storytelling, and decisive artistic moments.',
    description: 'Showcase your creative filmmaking lens within the campus grounds. Produce impactful short films adhering to symposium standards and present at the MBA Seminar Hall.',
    icon: 'Palette',
    stage_code: 'STAGE // THETA',
    team_size: '1 — 4 Creators',
    member_limit: 'Maximum of 4 members',
    per_head_fee: '-',
    team_fee: '150/-',
    prize: '300/200',
    duration: '5 Mins Max Duration',
    eligibility: 'Open to All Photographers & Creators',
    rules: [
      'Film Duration: Maximum duration of the short film is 5 minutes strictly.',
      'Campus Location: Filming location must strictly be within the college campus premises.',
      'Genre & Content: Can be any genre, but must strictly avoid extreme violence, abusive words, and offensive behavior.',
      'Submission Deadline: Final video submission deadline is strictly 2:00 PM.',
      'Venue: MBA Seminar Hall.',
      'Results Announcement: Winners will be announced at 3:30 PM on stage.',
      'Evaluation & Decision: Judging based on cinematography, editing, pacing, and storytelling. Judges’ decision is final.'
    ],
    venue_hint: 'MBA Seminar Hall',
    fee: '₹150/- per entry / team',
    sort_order: 8,
  },
];

const SEED_FAQS = [
  {
    question: 'What is INTELLETTO-26?',
    answer: 'INTELLETTO-26 is a national level technical symposium hosted by the Department of Artificial Intelligence & Machine Learning, featuring 8 competitive arenas across technical and non-technical divisions.',
    sort_order: 1,
  },
  {
    question: 'Who can participate?',
    answer: 'The symposium is open to undergraduate and postgraduate students from Engineering, Technology, Polytechnic, and Arts & Science colleges across India.',
    sort_order: 2,
  },
  {
    question: 'How do I register?',
    answer: 'Use the Player Registration page on this portal: pick your arenas, provide your academic & contact details, confirm your registration, and receive your unique Player Tag (IN26-XXXX).',
    sort_order: 3,
  },
  {
    question: 'Can I register for multiple events?',
    answer: 'Yes! You can choose multiple technical and non-technical arenas during registration as long as their stage schedules do not conflict.',
    sort_order: 4,
  },
  {
    question: 'What should I bring on event day?',
    answer: 'Bring a valid college student ID card, your registration confirmation / Player Tag, and laptops/chargers if participating in code/web/AI arenas.',
    sort_order: 5,
  },
];

const SEED_GALLERY = [
  { src: '/media/ev26-7.jpg', title: "Engineer's Vision 2026 Inaugural", caption: 'Auditorium Conclave & Symposium Assembly', sort_order: 1 },
  { src: '/media/ev26-1.jpg', title: 'AI Autonomous Rescue Robot', caption: 'Podium Defence · Robotics Innovation', sort_order: 2 },
  { src: '/media/ev26-2.jpg', title: 'Faculty Keynote & Mentorship', caption: 'Department Dignitaries & Organizers Address', sort_order: 3 },
  { src: '/media/ev26-3.jpg', title: 'Project OPTIK AI', caption: 'Rural Communities Computer Vision', sort_order: 4 },
  { src: '/media/ev26-4.jpg', title: 'ReVive Earth Clean Energy', caption: 'Sustainable Tech & Green Innovations', sort_order: 5 },
  { src: '/media/ev26-5.jpg', title: 'MediCura AI Healthcare', caption: 'Intelligent Medical Diagnostic Architecture', sort_order: 6 },
];

const SEED_SCHEDULE = [
  { day_label: 'DAY 01', start_time: '09:00 AM', end_time: '10:00 AM', title: 'Inaugural Protocol & Keynote Address', description: 'Assembly at the Main Auditorium with department dignitaries, faculty coordinators, and keynote remarks.', venue_hint: 'Main Seminar Hall', sort_order: 1 },
  { day_label: 'DAY 01', start_time: '10:15 AM', end_time: '01:00 PM', title: 'Arena Combat: Round 1 Prelims', description: 'Simultaneous deployment across Technical Quiz, AI Web Design, Paper Presentation, and Prompt Clash.', venue_hint: 'Department Labs & Seminar Blocks', sort_order: 2 },
  { day_label: 'DAY 01', start_time: '01:00 PM', end_time: '02:00 PM', title: 'Lunch & Tactical Debrief', description: 'Midday recharge and coordinator briefings for qualified stage finalists.', venue_hint: 'Campus Dining Pavilion', sort_order: 3 },
  { day_label: 'DAY 01', start_time: '02:00 PM', end_time: '04:30 PM', title: 'Non-Technical Arenas & Finals Showdown', description: 'Free Fire custom rooms, Quest of Mind decoding, Squid Game rounds, and photo showcase evaluation.', venue_hint: 'Amphitheatre & Media Hall', sort_order: 4 },
  { day_label: 'DAY 01', start_time: '04:45 PM', end_time: '05:45 PM', title: 'Grand Valedictory & Prize Distribution', description: 'Trophy presentations, cash awards, and coordinator recognition ceremony.', venue_hint: 'Main Stage Auditorium', sort_order: 5 },
];

async function initTiDB() {
  console.log('⚡ INTELLETTO-26 // TiDB Cloud Initializer');
  console.log('--------------------------------------------------');

  const url = process.env.DATABASE_URL || process.env.TIDB_DATABASE_URL;
  const host = process.env.TIDB_HOST;
  const user = process.env.TIDB_USER;
  const password = process.env.TIDB_PASSWORD || '';
  const database = process.env.TIDB_DATABASE || 'test';
  const port = Number(process.env.TIDB_PORT) || 4000;

  if (!url && (!host || !user)) {
    console.error('❌ Error: TiDB credentials missing in .env!');
    console.error('Please configure TIDB_HOST, TIDB_USER, TIDB_PASSWORD in .env or provide DATABASE_URL.');
    process.exit(1);
  }

  console.log(`Connecting to TiDB Cloud cluster ${host ? `at ${host}:${port}` : 'via connection URL'}...`);

  const ssl = process.env.TIDB_ENABLE_SSL === 'false' ? undefined : {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true,
  };

  const connection = await mysql.createConnection(
    url ? { uri: url, ssl, multipleStatements: true } : { host, port, user, password, database, ssl, multipleStatements: true }
  );

  console.log('✓ Successfully connected to TiDB Cloud cluster!');

  // 1. Run schema DDL
  const schemaPath = path.resolve(rootDir, 'db/schema.sql');
  console.log(`Applying schema from ${schemaPath}...`);
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  // Clean SQL comments before splitting into separate statements
  const cleanSql = schemaSql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n');

  const statements = cleanSql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    await connection.query(stmt);
  }
  console.log(`✓ Applied ${statements.length} DDL statements successfully.`);

  // 2. Seed Events
  console.log('Seeding official events...');
  for (const ev of SEED_EVENTS) {
    await connection.execute(
      `INSERT INTO events (slug, name, category, tagline, description, icon, stage_code, team_size, member_limit, per_head_fee, team_fee, prize, duration, eligibility, rules, venue_hint, fee, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name), category = VALUES(category), tagline = VALUES(tagline),
         description = VALUES(description), icon = VALUES(icon), stage_code = VALUES(stage_code),
         team_size = VALUES(team_size), member_limit = VALUES(member_limit), per_head_fee = VALUES(per_head_fee),
         team_fee = VALUES(team_fee), prize = VALUES(prize), duration = VALUES(duration),
         eligibility = VALUES(eligibility), rules = VALUES(rules), venue_hint = VALUES(venue_hint),
         fee = VALUES(fee), sort_order = VALUES(sort_order)`,
      [
        ev.slug, ev.name, ev.category, ev.tagline, ev.description, ev.icon, ev.stage_code,
        ev.team_size, ev.member_limit, ev.per_head_fee, ev.team_fee, ev.prize, ev.duration,
        ev.eligibility, JSON.stringify(ev.rules), ev.venue_hint, ev.fee, ev.sort_order,
      ]
    );
  }
  console.log(`✓ Seeded ${SEED_EVENTS.length} arena events.`);

  // 3. Seed FAQs
  console.log('Seeding FAQs...');
  for (const f of SEED_FAQS) {
    const [existing] = await connection.execute('SELECT id FROM faqs WHERE question = ? LIMIT 1', [f.question]);
    if (!existing.length) {
      await connection.execute(
        'INSERT INTO faqs (question, answer, sort_order) VALUES (?, ?, ?)',
        [f.question, f.answer, f.sort_order]
      );
    }
  }
  console.log(`✓ Seeded ${SEED_FAQS.length} FAQs.`);

  // 4. Seed Gallery
  console.log('Seeding gallery frames...');
  for (const g of SEED_GALLERY) {
    const [existing] = await connection.execute('SELECT id FROM gallery_items WHERE src = ? LIMIT 1', [g.src]);
    if (!existing.length) {
      await connection.execute(
        'INSERT INTO gallery_items (src, title, caption, sort_order) VALUES (?, ?, ?, ?)',
        [g.src, g.title, g.caption, g.sort_order]
      );
    }
  }
  console.log(`✓ Seeded ${SEED_GALLERY.length} gallery items.`);

  // 5. Seed Schedule
  console.log('Seeding symposium timeline...');
  for (const s of SEED_SCHEDULE) {
    const [existing] = await connection.execute('SELECT id FROM schedule_items WHERE title = ? AND day_label = ? LIMIT 1', [s.title, s.day_label]);
    if (!existing.length) {
      await connection.execute(
        'INSERT INTO schedule_items (day_label, start_time, end_time, title, description, venue_hint, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [s.day_label, s.start_time, s.end_time, s.title, s.description, s.venue_hint, s.sort_order]
      );
    }
  }
  console.log(`✓ Seeded ${SEED_SCHEDULE.length} schedule timeline entries.`);

  console.log('--------------------------------------------------');
  console.log('🎉 TiDB Cloud database initialized and seeded successfully!');
  await connection.end();
}

initTiDB().catch((err) => {
  console.error('❌ Failed to initialize TiDB:', err.message);
  process.exit(1);
});
