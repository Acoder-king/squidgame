import { useEffect, useRef } from 'react';
import { motion, type Variants } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronDown, MapPin, CalendarDays, Ticket, Compass } from 'lucide-react';
import Countdown from './Countdown';
import { EVENT_DATES_LABEL, VENUE_SHORT, ORGANIZER } from '../data/content';
import { useMusic } from '../hooks/AudioContext';

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 34 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

function FloatShape({ className, d, delay = 0 }: { className?: string; d: string; delay?: number }) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      className={className}
      aria-hidden="true"
      animate={{ y: [0, -18, 0], rotate: [0, 8, 0] }}
      transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      <path d={d} />
    </motion.svg>
  );
}

export default function Hero({ booted }: { booted: boolean }) {
  const { isPlaying } = useMusic();
  const salesmanVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = salesmanVideoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.currentTime = 0;
      video.play().catch((err) => console.warn('Salesman video play error:', err));
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [isPlaying]);

  return (
    <section id="home" className="grain relative flex min-h-[100svh] flex-col justify-center overflow-hidden" aria-label="INTELLETTO-26 hero">
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        {/* Default ambient hero video */}
        <video
          className={`hero-ambient-video h-full w-full object-cover transition-opacity duration-1000 ${
            isPlaying ? 'opacity-0' : 'opacity-35'
          }`}
          src="/media/hero-arena.mp4"
          poster="/media/arena-key.jpg"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />

        {/* Squid Game Salesman video playing when logo clicked */}
        <video
          ref={salesmanVideoRef}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
            isPlaying ? 'opacity-65' : 'opacity-0 pointer-events-none'
          }`}
          src="/media/salesman_video.mp4"
          muted
          loop
          playsInline
          preload="auto"
        />

        {/* Dark cinematic gradient overlays for pristine text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-void/85 via-void/50 to-void" />
        <div className="absolute inset-0 bg-gradient-to-r from-void/90 via-transparent to-void/70" />
        <div className="hero-grid-overlay bg-arena-grid animate-grid-pan absolute inset-0 opacity-55" />
        <div className="hero-glow-crimson absolute -left-40 top-1/3 h-[480px] w-[480px] rounded-full bg-crimson/25 blur-[140px]" />
        <div className="hero-glow-neon absolute -right-32 bottom-0 h-[380px] w-[380px] rounded-full bg-neon/20 blur-[130px]" />

        {/* Dynamic neon pink audio mood glow when video is active */}
        {isPlaying && (
          <div className="absolute inset-0 bg-neon/10 mix-blend-screen pointer-events-none transition-opacity duration-1000 animate-pulse" />
        )}
      </div>

      <div className="pointer-events-none absolute inset-0 text-neon/50" aria-hidden="true">
        <FloatShape className="absolute top-[16%] right-[10%] hidden h-20 w-20 md:block" d="M12 4a8 8 0 100 16 8 8 0 000-16z" />
        <FloatShape className="absolute top-[58%] right-[22%] hidden h-12 w-12 text-ivory/30 lg:block" d="M12 4l8 16H4z" delay={1.4} />
        <FloatShape className="absolute bottom-[18%] left-[6%] hidden h-14 w-14 text-crimson/60 md:block" d="M4 4h16v16H4z" delay={2.2} />
        <FloatShape className="absolute top-[24%] left-[14%] hidden h-8 w-8 text-ivory/20 md:block" d="M12 4l8 16H4z" delay={0.8} />
      </div>

      <div className="font-grotesk pointer-events-none absolute top-1/2 left-5 hidden -translate-y-1/2 xl:block" aria-hidden="true">
        <p className="vertical-rail text-[10px] text-faint">SECTOR 07 — ARENA BREACH // 12.91 N 79.13 E</p>
      </div>
      <div className="font-grotesk pointer-events-none absolute top-1/2 right-5 hidden -translate-y-1/2 xl:block" aria-hidden="true">
        <p className="vertical-rail text-[10px] text-faint">8 ARENAS · 02 DIVISIONS · 01 NATIONAL STAGE</p>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate={booted ? 'show' : 'hidden'}
        className="relative z-10 mx-auto w-full max-w-7xl px-4 xs:px-5 sm:px-6 md:px-8 pt-24 pb-12 sm:pt-32 sm:pb-20 md:pt-36 lg:px-8"
      >
        {/* 1. Department Badge */}
        <motion.div variants={item} className="flex flex-wrap items-center">
          <span className="clip-tag font-grotesk inline-flex items-center gap-2.5 bg-neon/15 px-4 py-2 sm:px-5 sm:py-2.5 text-[12px] sm:text-[14px] font-bold tracking-[0.18em] sm:tracking-[0.25em] text-neon uppercase ring-1 ring-neon/50 max-w-full shadow-[0_0_20px_rgba(237,27,118,0.2)]">
            <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-neon shadow-[0_0_8px_rgba(237,27,118,0.8)]" aria-hidden="true" />
            <span className="sm:hidden">Dept. of AI & ML presents</span>
            <span className="hidden sm:inline">{ORGANIZER} presents</span>
          </span>
        </motion.div>

        {/* 2. Symposium Text */}
        <motion.p variants={item} className="font-grotesk mt-3 sm:mt-5 text-[13px] sm:text-base tracking-[0.22em] sm:tracking-[0.45em] text-ivory font-semibold uppercase leading-relaxed">
          NATIONAL LEVEL TECHNICAL SYMPOSIUM
        </motion.p>

        {/* 3 & 4. Title & Arena Tagline */}
        <motion.h1 variants={item} className="font-display mt-2 sm:mt-3 leading-[0.95] font-black tracking-tight">
          <span className="block text-[clamp(2.35rem,9.2vw,7rem)] text-ivory">
            INTELLETTO<span className="text-neon text-glow-pink animate-flicker">-26</span>
          </span>
          <span className="font-grotesk mt-2 sm:mt-4 block text-[clamp(0.85rem,2.8vw,1.5rem)] font-bold tracking-[0.26em] sm:tracking-[0.28em] text-dim uppercase leading-tight">
            The Survival Arena
          </span>
        </motion.h1>

        {/* 5. Description */}
        <motion.p variants={item} className="mt-3.5 sm:mt-6 max-w-2xl text-[13px] sm:text-[15px] leading-relaxed text-dim">
          <span className="hidden sm:inline">Eight competition arenas. Two divisions. One national stage. Conducted by the Department of Artificial Intelligence and Machine Learning. Solve, design, battle, present, and outlast the finest student minds in the country — under the lights of the arena.</span>
          <span className="sm:hidden">8 arenas. 2 divisions. One national stage — outlast the finest student minds under the lights of the arena.</span>
        </motion.p>

        {/* 6. Date / Location */}
        <motion.div variants={item} className="font-grotesk mt-4 sm:mt-6 flex flex-wrap items-center gap-2.5 sm:gap-3 text-[13px] sm:text-[15px] tracking-[0.14em] sm:tracking-[0.18em] uppercase">
          <span className="hud-border inline-flex items-center gap-2.5 rounded-sm bg-panel/80 px-4 py-2 sm:px-5 sm:py-2.5 text-ivory font-semibold shadow-md backdrop-blur border border-white/15">
            <CalendarDays size={16} className="text-neon shrink-0 sm:size-[18px]" />
            <span>{EVENT_DATES_LABEL}</span>
          </span>
          <span className="hud-border inline-flex items-center gap-2.5 rounded-sm bg-panel/80 px-4 py-2 sm:px-5 sm:py-2.5 text-ivory font-semibold shadow-md backdrop-blur border border-white/15">
            <MapPin size={16} className="text-neon shrink-0 sm:size-[18px]" />
            <span className="hidden sm:inline">{VENUE_SHORT}</span>
            <span className="sm:hidden">CAHCET · Vellore</span>
          </span>
        </motion.div>

        {/* 7 & 8. REGISTER NOW & EXPLORE EVENTS Buttons */}
        <motion.div variants={item} className="mt-5 sm:mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-4">
          <Link
            to="/register"
            className="clip-btn group font-grotesk inline-flex min-h-[48px] w-full sm:w-auto items-center justify-center gap-2 bg-neon px-6 py-3.5 sm:px-8 sm:py-4 text-[12px] sm:text-sm font-bold tracking-[0.18em] sm:tracking-[0.2em] text-white uppercase transition-all duration-300 hover:bg-crimson hover:shadow-[0_0_36px_rgba(237,27,118,0.6)]"
          >
            <Ticket size={16} className="transition-transform group-hover:-rotate-12" /> Register Now
          </Link>
          <Link
            to="/events"
            className="clip-btn font-grotesk inline-flex min-h-[48px] w-full sm:w-auto items-center justify-center gap-2 border border-white/20 bg-white/5 px-6 py-3.5 sm:px-8 sm:py-4 text-[12px] sm:text-sm font-bold tracking-[0.18em] sm:tracking-[0.2em] text-ivory uppercase backdrop-blur transition-all duration-300 hover:border-neon/60 hover:bg-neon/10"
          >
            <Compass size={16} /> Explore Events
          </Link>
        </motion.div>

        {/* 9. Countdown Section */}
        <motion.div variants={item} className="mt-6 sm:mt-11 pb-8 sm:pb-0">
          <div className="mb-2.5 sm:mb-3 flex items-center gap-2 font-grotesk text-[9.5px] sm:text-[10px] tracking-[0.3em] text-faint uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-neon animate-pulse" aria-hidden="true" />
            <span>THE ARENA OPENS IN</span>
          </div>
          <Countdown />
        </motion.div>
      </motion.div>

      <div className="relative border-t border-white/10 bg-void/80 py-2.5 sm:py-3 backdrop-blur sm:absolute sm:inset-x-0 sm:bottom-0" aria-hidden="true">
        <div className="flex w-max animate-marquee gap-0 whitespace-nowrap">
          {[0, 1].map((n) => (
            <span key={n} className="font-grotesk text-[10px] sm:text-[11px] tracking-[0.35em] text-dim uppercase">
              {Array.from({ length: 6 }).map((_, i) => (
                <span key={i} className="mx-4 sm:mx-6">
                  Enter the arena <span className="mx-4 sm:mx-6 text-neon">○</span> Intelletto-26 <span className="mx-4 sm:mx-6 text-neon">△</span> 13 stages <span className="mx-4 sm:mx-6 text-neon">□</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      <motion.a
        href="#about"
        aria-label="Scroll to about"
        className="absolute bottom-16 left-1/2 hidden -translate-x-1/2 text-faint transition-colors hover:text-neon md:block"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 1.8, repeat: Infinity }}
      >
        <ChevronDown size={22} />
      </motion.a>
    </section>
  );
}
