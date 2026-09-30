import { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, ShieldAlert, Swords, BrainCircuit, Gamepad2, ShieldCheck, Ticket } from 'lucide-react';
import { Link } from 'react-router-dom';
import SectionHeading from './SectionHeading';
import { RULES } from '../data/content';

type CategoryFilter = 'all' | 'technical' | 'non-technical' | 'general';

const CATEGORY_MAP: Record<string, 'technical' | 'non-technical' | 'general'> = {
  general: 'general',
  'ppt-presentation': 'technical',
  'squid-game': 'non-technical',
  'technical-quiz': 'technical',
  filmography: 'non-technical',
  'quest-of-mind': 'non-technical',
  'free-fire': 'non-technical',
  'ai-web-design': 'technical',
  'prompt-clash': 'technical',
  disqualification: 'general',
};

export default function Rules() {
  const [open, setOpen] = useState<string | null>('general');
  const [filter, setFilter] = useState<CategoryFilter>('all');

  const filteredRules = useMemo(() => {
    if (filter === 'all') return RULES;
    return RULES.filter((r) => CATEGORY_MAP[r.id] === filter);
  }, [filter]);

  return (
    <section id="rules" className="relative scroll-mt-20 overflow-hidden bg-abyss py-24 md:py-32" aria-label="Rules">
      <div className="absolute inset-0 bg-gradient-to-b from-void via-transparent to-void" aria-hidden="true" />
      <div className="absolute top-1/4 -left-32 h-[400px] w-[400px] rounded-full bg-crimson/20 blur-[140px]" aria-hidden="true" />
      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          code="TRANSMISSION 04 // CODE OF THE ARENA"
          title="Survive by"
          accent="the protocol."
          sub="Official rules, round-by-round knockout structures, device policies, and evaluation standards for all 8 competition arenas."
        />

        {/* Category Filter Pills */}
        <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
          {[
            { id: 'all', label: 'All Protocols', icon: Swords },
            { id: 'technical', label: 'Technical Arenas', icon: BrainCircuit },
            { id: 'non-technical', label: 'Non-Technical Arenas', icon: Gamepad2 },
            { id: 'general', label: 'General & Disqualification', icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id as CategoryFilter)}
                className={`font-grotesk flex cursor-pointer items-center gap-2 rounded-xs border px-4 py-2.5 text-[11px] font-bold tracking-[0.18em] uppercase transition-all ${
                  active
                    ? 'border-neon bg-neon/15 text-ivory shadow-[0_0_16px_rgba(var(--theme-glow-rgb),0.35)]'
                    : 'border-white/10 bg-panel/50 text-dim hover:border-white/20 hover:text-ivory'
                }`}
              >
                <Icon size={14} className={active ? 'text-neon' : 'text-faint'} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="space-y-3">
          {filteredRules.map((r) => {
            const isOpen = open === r.id;
            return (
              <div key={r.id} className={`hud-border bg-panel/70 transition-colors ${isOpen ? 'border-neon/40' : ''}`}>
                <button
                  onClick={() => setOpen(isOpen ? null : r.id)}
                  aria-expanded={isOpen}
                  aria-controls={`rules-${r.id}`}
                  className="flex w-full cursor-pointer items-center gap-4 px-5 py-5 text-left sm:px-7"
                >
                  <ShieldAlert size={19} className={isOpen ? 'shrink-0 text-neon' : 'shrink-0 text-faint'} />
                  <span className="flex-1">
                    <span className="font-grotesk block text-[10px] tracking-[0.32em] text-faint">{r.code}</span>
                    <span className="font-display mt-0.5 block text-[16px] font-bold text-ivory sm:text-lg">{r.title}</span>
                  </span>
                  <motion.span animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.25 }} className={isOpen ? 'text-neon' : 'text-dim'}>
                    <Plus size={20} />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`rules-${r.id}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <ul className="space-y-3 border-t border-white/10 px-5 py-6 sm:px-7 sm:pl-[68px]">
                        {r.points.map((p, i) => (
                          <li key={i} className="flex gap-3 text-[14px] leading-relaxed text-dim">
                            <span className="font-grotesk mt-0.5 shrink-0 text-[11px] font-bold text-neon">{String(i + 1).padStart(2, '0')}</span>
                            {p}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Action Call to Register */}
        <div className="mt-12 text-center">
          <Link
            to="/register"
            className="clip-btn font-grotesk inline-flex items-center justify-center gap-2 bg-neon px-8 py-4 text-[12px] font-bold tracking-[0.2em] text-white uppercase transition-all hover:bg-crimson hover:shadow-[0_0_24px_rgba(237,27,118,0.5)]"
          >
            <Ticket size={16} /> Enter Arena & Register Now
          </Link>
        </div>
      </div>
    </section>
  );
}

