export const EVENT_TARGET_ISO = '2026-10-10T09:00:00+05:30';
export const EVENT_DATES_LABEL = '10 · OCT · 2026';
export const VENUE_SHORT = 'C. Abdul Hakeem College of Engineering & Technology · Vellore';
export const ORGANIZER = 'Department of Artificial Intelligence and Machine Learning';
export const INSTAGRAM_URL = 'https://www.instagram.com/aiml_cahcet?stkn=MTVqZDNuNGRxaTV5dg==';
export const INSTAGRAM_HANDLE = '@aiml_cahcet';
export const UNAVAILABLE = 'Details will be announced by the organizers.';
export const SITE_NAME = 'INTELLETTO-26';

export const TEAM = {
  hod: 'Mrs. M. Dhanalakshmi',
  facultyCoordinator: 'Mr. Yoga Moorthy R',
  studentCoordinators: ['Iman shihad', 'Naeemullah.R', 'Jayaprakash.B', 'Rizwan']
};

export const STUDENT_COORDINATORS = ['Nayeemullah.R', 'Jayaprakash.B', 'Md Tauseef Saleem V'];
export interface EventCrew {
  unit: string;
  coordinators: string[];
  team: string[];
  phone?: string;
  whatsapp?: string;
}

export const EVENT_WHATSAPP_HANDLERS: Record<string, { event: string; phone: string; displayPhone: string }> = {
  'quest-of-mind': { event: 'Quest of Mind', phone: '916383567945', displayPhone: '6383567945' },
  'free-fire': { event: 'E-Sports (Free Fire)', phone: '919566685417', displayPhone: '9566685417' },
  'filmography-photography': { event: 'Filmography / Photography', phone: '918678903307', displayPhone: '8678903307' },
  'paper-presentation': { event: 'Paper Presentation / Poster', phone: '917010298642', displayPhone: '7010298642' },
  'ai-web-design': { event: 'AI – Web Design', phone: '918778477488', displayPhone: '8778477488' },
  'technical-quiz': { event: 'Technical Quiz', phone: '919489619915', displayPhone: '9489619915' },
  'squid-game': { event: 'Squid Game', phone: '916380559119', displayPhone: '6380559119' },
  'prompt-clash': { event: 'Prompt Clash', phone: '918807685732', displayPhone: '8807685732' },
};

export const EVENT_CREW: Record<string, EventCrew> = {
  'technical-quiz': { unit: 'Technical Quiz', coordinators: ['Hasni Mubarak', 'Sanjana V'], team: ['Azeez', 'Nithish Kumar', 'Vaishnavi'], phone: '9489619915', whatsapp: '919489619915' },
  'ai-web-design': { unit: 'AI – Web Design', coordinators: ['Fareeduddeen', 'Sumaiya J'], team: ['Mohammed Ameen', 'Mohammed Affan', 'Shalini'], phone: '8778477488', whatsapp: '918778477488' },
  'coding-debugging': { unit: 'AI – Web Design', coordinators: ['Fareeduddeen', 'Sumaiya J'], team: ['Mohammed Ameen', 'Mohammed Affan', 'Shalini'], phone: '8778477488', whatsapp: '918778477488' },
  'paper-presentation': { unit: 'Paper Presentation / Poster', coordinators: ['Jagan', 'Rasika'], team: ['Vijay', 'Falak', 'Harish Priyan'], phone: '7010298642', whatsapp: '917010298642' },
  'prompt-clash': { unit: 'Prompt Clash', coordinators: ['Nizzamuddin', 'Yuvarani'], team: ['Evinesh', 'Priyanka V.'], phone: '8807685732', whatsapp: '918807685732' },
  'prompt-wars': { unit: 'Prompt Clash', coordinators: ['Nizzamuddin', 'Yuvarani'], team: ['Evinesh', 'Priyanka V.'], phone: '8807685732', whatsapp: '918807685732' },
  'free-fire': { unit: 'E-Sports (Free Fire)', coordinators: ['Sabarivasan'], team: ['Shanmugam', 'Imran', 'Yukesh'], phone: '9566685417', whatsapp: '919566685417' },
  'quest-of-mind': { unit: 'Quest of Mind', coordinators: ['Arif', 'Priyanka I'], team: ['Aiman', 'Pooja Shree'], phone: '6383567945', whatsapp: '916383567945' },
  'connections': { unit: 'Quest of Mind', coordinators: ['Arif', 'Priyanka I'], team: ['Aiman', 'Pooja Shree'], phone: '6383567945', whatsapp: '916383567945' },
  'squid-game': { unit: 'Squid Game', coordinators: ['Emad Ur Rahman', 'Samyuktha'], team: ['Mohammed Amaan', 'Hemasri B'], phone: '6380559119', whatsapp: '916380559119' },
  'chess': { unit: 'Squid Game', coordinators: ['Emad Ur Rahman', 'Samyuktha'], team: ['Mohammed Amaan', 'Hemasri B'], phone: '6380559119', whatsapp: '916380559119' },
  'filmography-photography': { unit: 'Filmography / Photography', coordinators: ['Ashiq', 'Sai'], team: [], phone: '8678903307', whatsapp: '918678903307' },
  'art-painting': { unit: 'Filmography / Photography', coordinators: ['Ashiq', 'Sai'], team: [], phone: '8678903307', whatsapp: '918678903307' },
};

export function buildRegistrationWhatsAppUrl(
  eventSlug: string,
  registration: {
    player_tag: string;
    full_name: string;
    email: string;
    phone: string;
    college: string;
    department: string;
    year_of_study: string;
    city?: string;
    state?: string;
    alternate_phone?: string;
    emergency_contact?: string;
    team_name?: string;
    team_size?: string;
    teammates?: { name: string }[];
    transaction_id?: string;
  }
): { url: string; phone: string; displayPhone: string; eventName: string; message: string; receiptUrl: string } | null {
  const handler = EVENT_WHATSAPP_HANDLERS[eventSlug];
  if (!handler) return null;

  const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : '';

  const lines = [
    `⚡ *INTELLETTO-26 // ARENA REGISTRATION* ⚡`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `🎯 *Arena:* ${handler.event}`,
    `🎫 *Player Tag:* ${registration.player_tag}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `👤 *Student Name:* ${registration.full_name}`,
    `📱 *Phone Number:* ${registration.phone}`,
    `📧 *Email:* ${registration.email}`,
    `🏛️ *College:* ${registration.college}`,
    `🎓 *Department:* ${registration.department}`,
    `📅 *Year of Study:* ${registration.year_of_study}`,
  ];

  if (registration.city || registration.state) {
    lines.push(`📍 *Location:* ${[registration.city, registration.state].filter(Boolean).join(', ')}`);
  }

  if (registration.alternate_phone) {
    lines.push(`📞 *Alternate Phone:* ${registration.alternate_phone}`);
  }

  if (registration.emergency_contact) {
    lines.push(`🆘 *Emergency Contact:* ${registration.emergency_contact}`);
  }

  if (registration.team_name) {
    lines.push(`👥 *Squad Name:* ${registration.team_name}`);
  }

  if (registration.teammates && registration.teammates.length > 0) {
    const list = registration.teammates.map((t, idx) => `   ${idx + 1}. ${t.name}`).join('\n');
    lines.push(`🤝 *Teammates:*\n${list}`);
  }

  const receiptUrl = origin
    ? `${origin}/receipt?tag=${registration.player_tag}&slug=${eventSlug}${registration.transaction_id ? `&txn=${registration.transaction_id}` : ''}`
    : '';

  if (registration.transaction_id) {
    lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`💳 *UPI Reference / UTR:* \`${registration.transaction_id}\``);
    lines.push(`📑 *Payment Receipt:* Uploaded in portal · Pending Verification`);
    if (receiptUrl) {
      lines.push(`🖼️ *View Payment Screenshot:* ${receiptUrl}`);
    }
  }

  lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`✅ *Status:* Registered (${registration.transaction_id ? 'Payment Pending Verification' : 'Confirmed'})`);
  lines.push(`_Dept. of Artificial Intelligence & Machine Learning_`);
  lines.push(`_C. Abdul Hakeem College of Engineering & Technology_`);

  const message = lines.join('\n');
  const url = `https://wa.me/${handler.phone}?text=${encodeURIComponent(message)}`;

  return {
    url,
    message,
    receiptUrl,
    phone: handler.phone,
    displayPhone: handler.displayPhone,
    eventName: handler.event,
  };
}

export const EVENT_IMAGES: Record<string, string> = {
  'technical-quiz': '/media/e-quiz.jpg',
  'ai-web-design': '/media/g-code.jpg',
  'coding-debugging': '/media/g-code.jpg',
  'paper-presentation': '/media/g-stage.jpg',
  'prompt-clash': '/media/e-ai.jpg',
  'prompt-wars': '/media/e-ai.jpg',
  'free-fire': '/media/g-esports.jpg',
  'quest-of-mind': '/media/e-quest.jpg',
  'connections': '/media/e-quest.jpg',
  'squid-game': '/media/g-chess.jpg',
  'chess': '/media/g-chess.jpg',
  'filmography-photography': '/media/e-photo.jpg',
  'art-painting': '/media/e-photo.jpg',
  'mini-hackathon': '/media/e-hack.jpg',
  'shark-tank-sgc': '/media/e-pitch.jpg',
  'mehendi': '/media/e-mehndi.jpg',
  'cooking-without-fire': '/media/g-cooking.jpg',
  'ipl-auction': '/media/e-cricket.jpg',
};

export const NAV_LINKS = [
  { id: 'home', label: 'Home', path: '/' },
  { id: 'about', label: 'About', path: '/about' },
  { id: 'team', label: 'Team', path: '/team' },
  { id: 'events', label: 'Events', path: '/events' },
  { id: 'schedule', label: 'Schedule', path: '/schedule' },
  { id: 'rules', label: 'Rules', path: '/rules' },
  { id: 'gallery', label: 'Gallery', path: '/gallery' },
  { id: 'faq', label: 'FAQ', path: '/faq' },
  { id: 'contact', label: 'Contact', path: '/contact' },
] as const;

export interface RuleBlock {
  id: string;
  code: string;
  title: string;
  points: string[];
}

export const RULES: RuleBlock[] = [
  {
    id: 'general',
    code: 'PROTOCOL 01',
    title: 'General Symposium Protocol',
    points: [
      'Eligibility: Open to all undergraduate and postgraduate students from Engineering, Tech, Polytechnic, and Arts & Science colleges across India.',
      'Identification: Every participant must carry their official College ID card and registration confirmation on event day.',
      'Reporting Time: Participants must report to the respective arena desks at least 15–30 minutes before their scheduled event slot.',
      'Discipline: Maintain high academic decorum, sportsmanship, and respect toward fellow contestants, organizers, and judges at all times.',
      'Judges’ Authority: The decision of the judges and faculty coordinators is final, authoritative, and binding across all rounds.',
      'Zero Tolerance for Malpractice: Any form of cheating, impersonation, unauthorized device usage, or misconduct results in immediate disqualification without refund.',
    ],
  },
  {
    id: 'ppt-presentation',
    code: 'PROTOCOL 02',
    title: 'PPT Presentation — Rules & Regulations',
    points: [
      'Eligibility & Squad: Open to all registered symposium participants. Maximum of 2 participants per team.',
      'Presentation Time: Strictly 5–7 minutes for presentation, followed by 2 minutes for judge Q&A defense.',
      'Slide Ceiling: Maximum of 10 slides strictly allowed. File format must be standard PPT or PPTX.',
      'Topic Relevance: Presentation content must be directly relevant to the given or selected technical theme.',
      'Originality & Anti-Plagiarism: Content must be 100% original. Plagiarism or copied slide decks will lead to instant disqualification.',
      'File Submission: PPT file must be submitted to the arena coordinators at least 15 minutes before the event begins.',
      'Venue & Reporting: Report to Conference Auditorium B at least 15 minutes prior to your allotted stage slot.',
      'Active Q&A Defense: All team members must actively respond to questions posed by the panel of judges.',
      'Disqualification Criteria: Exceeding allotted time, plagiarism, offensive/inappropriate material, or failure to follow coordinator instructions.',
    ],
  },
  {
    id: 'squid-game',
    code: 'PROTOCOL 03',
    title: 'Squid Game — Survival Arena & Eliminations',
    points: [
      'General Mandate: All participants must strictly adhere to the instructions of organizers and judges. Know the game and follow the rules.',
      'No Excuses Permitted: Claiming “I don’t know how to play” or “I didn’t know the rules” will NOT be accepted once a survival game starts.',
      '🟢 Game 1 (First Round): All registered players compete. 50% eliminated on the spot; surviving 50% advance to Game 2.',
      '🟡 Game 2 (Second Round): Only Game 1 qualifiers compete. 25% of original pool eliminated; qualifiers proceed to the Final Round.',
      '🔴 Game 3 (Final Round): Finalists compete down to the wire until only 2 remain: 🥇 1st Place Winner & 🥈 2nd Place Runner-up.',
      'Strict Elimination: Once eliminated, a player CANNOT re-enter the competition. No second chances or buy-ins.',
      'Fair Play & Decorum: Fighting, pushing, verbal abuse, or intentionally disturbing another player is strictly prohibited.',
      'Safety Protocol: Dangerous physical maneuvers or actions causing injury are strictly forbidden. Coordinators reserve the right to halt games for safety.',
      'Device Prohibition: Mobile phones and electronic gadgets must be switched off and put away during gameplay.',
      'Survive. Compete. Win: The game officially begins when the organizers announce it.',
    ],
  },
  {
    id: 'technical-quiz',
    code: 'PROTOCOL 04',
    title: 'Technical Quiz — Multi-Stage Knockout',
    points: [
      'Mandatory Hardware: A smartphone or laptop with an active, stable internet connection is required for each participant.',
      'Time Discipline: Complete all quiz questions strictly within the allotted countdown.',
      'Anti-Cheating Controls: Do NOT press the browser back button or refresh the page during live testing.',
      'No Tab Switching: Tab switching or minimizing the test application will be detected and cause immediate test termination.',
      'Round 1 (Prelims): 20 Questions | 50 Members pool → 25 Eliminated → Top 25 Selected.',
      'Round 2 (Semi-Finals): 15 Questions | 25 Members → 15 Eliminated → Top 10 Selected.',
      'Round 3 (Finals): 10 Questions | 10 Members → 8 Eliminated → Top 2 Winners declared.',
      'Scoring & Tiebreakers: Accuracy and response speed determine rankings; coordinator decisions are final.',
    ],
  },
  {
    id: 'filmography',
    code: 'PROTOCOL 05',
    title: 'Filmography / Photography — Campus Cinema',
    points: [
      'Maximum Duration: The runtime of the short film must not exceed 5 minutes strictly.',
      'Campus Boundary: Filming must be carried out strictly within the college campus premises.',
      'Genre & Content: Any creative genre is permitted, but entries must strictly avoid extreme violence, abusive language, vulgarity, or offensive behavior.',
      'Submission Deadline: Final edited video file must be submitted before 2:00 PM at the MBA Seminar Hall desk.',
      'Venue & Screening: MBA Seminar Hall.',
      'Results Announcement: Winners and runners-up will be announced live on stage at 3:30 PM.',
      'Originality: All footage must be captured during the designated symposium window. Plagiarized stock footage is prohibited.',
    ],
  },
  {
    id: 'quest-of-mind',
    code: 'PROTOCOL 06',
    title: 'Quest of Mind — Cognitive & Speed Challenge',
    points: [
      'Team Structure: Each team consists of 1–2 members. Registration fee is ₹50 per head (₹100 per team of 2).',
      'Capped Capacity: Maximum of 20 teams can participate in the arena.',
      'Tournament Structure: The competition consists of 3 progressive rounds (connections, rebus, lateral logic).',
      'Rapid-Fire Timer: Each question carries a strict 15-second time limit to answer.',
      'Electronic Blackout: Mobile phones, smartwatches, and internet access are strictly prohibited in the arena.',
      'Submission: Answers must be submitted within the 15-second countdown.',
      'Fair Play: Maintain silence, discipline, and respect for coordinators’ scoring.',
    ],
  },
  {
    id: 'free-fire',
    code: 'PROTOCOL 07',
    title: 'E-Sports (Free Fire) — Tactical Battle Royale',
    points: [
      'Device Rule: Participants must play exclusively on mobile phones. Emulators, iPads/tablets, triggers, and PC setups are strictly forbidden.',
      'Zero Tolerance for Hacks: Using hacks, scripts, aimbots, modified APKs, or third-party tools results in an instant squad ban.',
      'Match Continuity: Do NOT leave, disconnect, or exit the lobby once the match countdown begins.',
      'Tournament Scale: Maximum capacity of 26 squad slots.',
      'Round 1: 13 slots | 52 players → Top 3 teams advance.',
      'Round 2: 13 slots | 52 players → Top 3 teams advance.',
      'Round 3 (Clash Squad): The 6 qualified teams clash in CS mode → Top 3 teams advance.',
      'Round 4 (Finals): The 3 finalist teams battle under tournament IPL rules.',
      'Round 5 (Podium): Champions declared and awarded live on the grand stage.',
    ],
  },
  {
    id: 'ai-web-design',
    code: 'PROTOCOL 08',
    title: 'AI – Web Design — UI/UX & Web Development',
    points: [
      'Participation Format: Individual (1 player) or Team of 2 (Fee: ₹50 solo, ₹100 team).',
      'Hardware: Bring your own laptop or use workstations provided in Advanced Computing Lab 1.',
      'Round 1 (UI/UX Design): A theme/problem statement will be revealed on the spot. Design a website UI/UX layout focusing on aesthetics, layout hierarchy, and UX.',
      'Round 1 Tools: Figma, Canva, or UI/UX design tools (specific tool announced on the spot). Qualifiers advance to Round 2.',
      'Round 2 (Website Development): Convert your Round 1 UI/UX design into a functional, responsive web application using web development tools or AI-powered builders.',
      'AI Tool Usage: AI tools may be used for assistance and ideation, but core layout, styling, and implementation must be executed by the participants.',
      'Submission: Websites must be responsive and deployed live or runnable locally for judge inspection.',
    ],
  },
  {
    id: 'prompt-clash',
    code: 'PROTOCOL 09',
    title: 'Prompt Clash — Dual-Stage Prompt Arena',
    points: [
      'Participation: Compete individually (₹50) or as a squad of 2 (₹100).',
      'Hardware Requirements: Mobile phones are mandatory for Round 2; laptops are optional based on participant preference.',
      'Round 1 (Prompt Creation): A reference image will be displayed on screen for exactly 1 minute.',
      'Round 1 Hardware Ban: Mobile phones and laptops are strictly NOT allowed during Round 1.',
      'Round 1 Drafting: An A4 sheet will be provided. Participants have 20 minutes to write an in-depth descriptive prompt based on the image.',
      'Round 1 Evaluation: Scored on structure, clarity, detail, creativity, and descriptive fidelity. Selected participants proceed to Round 2.',
      'Round 2 (AI Challenge): Mobile phones/laptops are permitted. Only FREE AI tools may be used (paid or subscription tools prohibited).',
      'Round 2 Execution: Participants feed their written prompt into the AI tool to generate the target output.',
      'Scoring: Evaluated on prompt engineering quality and final AI output accuracy. 2 winners will be announced.',
    ],
  },
  {
    id: 'disqualification',
    code: 'PROTOCOL 10',
    title: 'Disqualification & Fair Play Policy',
    points: [
      'Plagiarism: Submitting copied code, stolen PPT slides, or non-original work leads to automatic elimination.',
      'Unsportsmanlike Conduct: Any aggressive behavior, foul language, harassment, or disturbance to organizers/judges will result in immediate escort off campus.',
      'Time Violations: Late arrivals to designated venues or exceeding presentation timers will be penalized or disqualified.',
      'Electronic Violations: Using prohibited devices or internet where forbidden results in instant ejection.',
      'Final Authority: The decision of the organizing committee, faculty advisors, and judges is absolute and non-negotiable.',
    ],
  },
];

