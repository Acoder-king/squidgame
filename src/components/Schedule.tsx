import { motion } from 'framer-motion';
import { Clock, MapPin, Info } from 'lucide-react';
import SectionHeading from './SectionHeading';

const scheduleData = [
  {
    id: '1',
    start_time: '08:30 AM',
    end_time: '09:30 AM',
    title: 'Registration & Desk Check-in',
    description: 'Participants must report to the respective arena desks and confirm their registration. ID cards are mandatory.',
    venue_hint: 'Main Block Entrance',
  },
  {
    id: '2',
    start_time: '09:30 AM',
    end_time: '10:00 AM',
    title: 'Inauguration Ceremony',
    description: 'Kickoff of INTELLETTO-26. Welcome address, rules briefing, and the official opening of all arenas.',
    venue_hint: 'Conference Auditorium B',
  },
  {
    id: '3',
    start_time: '10:00 AM',
    end_time: '12:30 PM',
    title: 'Technical Arenas',
    description: 'Technical Quiz, Paper Presentation, AI – Web Design, and Prompt Clash parallel sessions.',
    venue_hint: 'Various Labs & Halls',
  },
  {
    id: '4',
    start_time: '12:30 PM',
    end_time: '01:30 PM',
    title: 'Lunch Break',
    description: 'Refuel and strategize for the afternoon survival rounds.',
    venue_hint: 'College Canteen',
  },
  {
    id: '5',
    start_time: '01:30 PM',
    end_time: '03:30 PM',
    title: 'Non-Technical Arenas',
    description: 'Squid Game, Quest of Mind, and E-Sports (Free Fire).',
    venue_hint: 'Various Venues',
  },
  {
    id: '6',
    start_time: '03:30 PM',
    end_time: '04:00 PM',
    title: 'Filmography Screening',
    description: 'Short film screening and results announcement for Filmography & Photography.',
    venue_hint: 'MBA Seminar Hall',
  },
  {
    id: '7',
    start_time: '04:00 PM',
    end_time: '05:00 PM',
    title: 'Valedictory & Prize Distribution',
    description: 'Crowning the champions of INTELLETTO-26. Closing ceremony and photo sessions.',
    venue_hint: 'Conference Auditorium B',
  }
];

export default function Schedule() {
  return (
    <section id="schedule" className="relative scroll-mt-20 overflow-hidden py-24 md:py-32" aria-label="Schedule">
      <div className="bg-fine-grid absolute inset-0 opacity-50" aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          code="TRANSMISSION 03 // MISSION TIMELINE"
          title="The one-day"
          accent="survival run."
          sub="The structural timeline for INTELLETTO-26. Prepare for an intense day of competition."
        />

        <div className="hud-border glass mb-8 flex items-start gap-3 p-4">
          <Info size={17} className="mt-0.5 shrink-0 text-neon" />
          <p className="text-[13px] leading-relaxed text-dim">
            The official event-day schedule with exact timings is subject to minor changes. Please be present at the venues at least 15 minutes before your event starts.
          </p>
        </div>

        <ol className="relative space-y-4 border-l border-white/10 pl-0">
          {scheduleData.map((s, i) => (
            <motion.li
              key={s.id}
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, delay: i * 0.06 }}
              className="hud-border card-sheen relative ml-6 bg-panel/70 p-5 sm:ml-8 sm:p-6"
            >
              <span className="absolute top-6 -left-[33px] flex h-4 w-4 items-center justify-center sm:-left-[41px]" aria-hidden="true">
                <span className="absolute h-4 w-4 rounded-full border border-neon/60" />
                <span className="h-1.5 w-1.5 rounded-full bg-neon shadow-[0_0_10px_rgba(237,27,118,0.9)]" />
              </span>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                <span className="font-grotesk inline-flex items-center gap-2 bg-void px-3 py-1.5 text-[11px] font-bold tracking-[0.2em] text-neon ring-1 ring-neon/30">
                  <Clock size={13} /> {s.start_time}{s.end_time ? ` — ${s.end_time}` : ''}
                </span>
                {s.venue_hint && (
                  <span className="font-grotesk inline-flex items-center gap-1.5 text-[11px] tracking-[0.18em] text-faint uppercase">
                    <MapPin size={13} /> {s.venue_hint}
                  </span>
                )}
              </div>
              <h3 className="font-display mt-3 text-lg font-bold text-ivory sm:text-xl">{s.title}</h3>
              {s.description && <p className="mt-1.5 text-[13.5px] leading-relaxed text-dim">{s.description}</p>}
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
