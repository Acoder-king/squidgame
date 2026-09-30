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
  'prompt-clash': { event: 'Prompt Clash', phone: '916369906810', displayPhone: '6369906810' },
};

export const EVENT_CREW: Record<string, EventCrew> = {
  'technical-quiz': { unit: 'Technical Quiz', coordinators: ['Hasni Mubarak', 'Sanjana V'], team: ['Azeez', 'Nithish Kumar', 'Vaishnavi'], phone: '9489619915', whatsapp: '919489619915' },
  'ai-web-design': { unit: 'AI – Web Design', coordinators: ['Fareeduddeen', 'Sumaiya J'], team: ['Mohammed Ameen', 'Mohammed Affan', 'Shalini'], phone: '8778477488', whatsapp: '918778477488' },
  'coding-debugging': { unit: 'AI – Web Design', coordinators: ['Fareeduddeen', 'Sumaiya J'], team: ['Mohammed Ameen', 'Mohammed Affan', 'Shalini'], phone: '8778477488', whatsapp: '918778477488' },
  'paper-presentation': { unit: 'Paper Presentation / Poster', coordinators: ['Jagan', 'Rasika'], team: ['Vijay', 'Falak', 'Harish Priyan'], phone: '7010298642', whatsapp: '917010298642' },
  'prompt-clash': { unit: 'Prompt Clash', coordinators: ['Nizzamuddin', 'Yuvarani'], team: ['Evinesh', 'Priyanka V.'], phone: '6369906810', whatsapp: '916369906810' },
  'prompt-wars': { unit: 'Prompt Clash', coordinators: ['Nizzamuddin', 'Yuvarani'], team: ['Evinesh', 'Priyanka V.'], phone: '6369906810', whatsapp: '916369906810' },
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
): { url: string; phone: string; displayPhone: string; eventName: string } | null {
  const handler = EVENT_WHATSAPP_HANDLERS[eventSlug];
  if (!handler) return null;

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

  if (registration.transaction_id) {
    lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`💳 *UPI Reference / UTR:* \`${registration.transaction_id}\``);
    lines.push(`📑 *Payment Receipt:* Attached (Pending Coordinator Verification)`);
  }

  lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`✅ *Status:* Registered (${registration.transaction_id ? 'Payment Pending Verification' : 'Confirmed'})`);
  lines.push(`_Dept. of Artificial Intelligence & Machine Learning_`);
  lines.push(`_C. Abdul Hakeem College of Engineering & Technology_`);

  const message = lines.join('\n');
  const url = `https://wa.me/${handler.phone}?text=${encodeURIComponent(message)}`;

  return {
    url,
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
    title: 'General Rules',
    points: [
      'Every player must carry a valid college identity card and registration confirmation for arena entry.',
      'Report to the venue at least 45 minutes before your scheduled arena slot.',
      'The organizers decisions across all rounds are final and binding.',
      'Any form of malpractice, impersonation or misconduct leads to instant elimination.',
    ],
  },
  {
    id: 'technical',
    code: 'PROTOCOL 02',
    title: 'Technical Events',
    points: [
      'Bring your own laptops, chargers and hardware where the arena format requires it.',
      'Code, papers and prompts submitted must be original work of the registered player or squad.',
      'Round-wise briefings will be given by arena coordinators before every stage begins.',
      UNAVAILABLE,
    ],
  },
  {
    id: 'non-technical',
    code: 'PROTOCOL 03',
    title: 'Non-Technical Events',
    points: [
      'Required materials and props must be arranged by players unless stated otherwise at the venue desk.',
      'For gaming arenas, players must arrive with charged devices and stable game accounts.',
      'Judging criteria will be announced by the coordinators at the start of each event.',
      UNAVAILABLE,
    ],
  },
  {
    id: 'registration',
    code: 'PROTOCOL 04',
    title: 'Registration & Participation',
    points: [
      'One player registration covers entry to the symposium; arena access depends on the events selected.',
      'Team events require every squad member to complete player registration individually.',
      'On-spot registrations, if opened, will be announced at the help desk on event day.',
      UNAVAILABLE,
    ],
  },
];

