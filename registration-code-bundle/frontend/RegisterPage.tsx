import { Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Zap, Eye, Loader2 } from 'lucide-react';
import { EVENT_DATES_LABEL, VENUE_SHORT } from '../data/content';

const RegisterWizard = lazy(() => import('../components/RegisterWizard'));

export default function RegisterPage() {
  return (
    <div className="relative overflow-hidden pt-28 pb-24 md:pt-32">
      <div className="bg-arena-grid absolute inset-0 opacity-50" aria-hidden="true" />
      <div className="absolute -top-20 left-1/2 h-[360px] w-[720px] -translate-x-1/2 rounded-full bg-neon/10 blur-[140px]" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link to="/" className="font-grotesk inline-flex items-center gap-2 text-[12px] tracking-[0.25em] text-dim uppercase hover:text-neon">
          <ArrowLeft size={15} /> Back to arena
        </Link>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="mt-6">
          <p className="font-grotesk flex items-center gap-3 text-[11px] font-semibold tracking-[0.4em] text-neon">
            <span className="inline-block h-px w-10 bg-neon" aria-hidden="true" /> PLAYER REGISTRATION
          </p>
          <h1 className="font-display mt-4 text-3xl font-black text-ivory sm:text-4xl md:text-5xl">
            Claim your <span className="text-neon text-glow-pink">player tag.</span>
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] text-dim">
            Seven stages. Five minutes. One registry. Complete every step to lock your entry to INTELLETTO-26 — {EVENT_DATES_LABEL} · {VENUE_SHORT}.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-8 lg:grid-cols-3">
          <div className="hud-border bg-abyss/80 p-6 sm:p-8 lg:col-span-2">
            <Suspense fallback={<div className="flex items-center justify-center gap-3 py-24 text-dim" role="status"><Loader2 className="animate-spin text-neon" size={22} /> Loading registry…</div>}>
              <RegisterWizard />
            </Suspense>
          </div>

          <aside className="space-y-4" aria-label="Registration intel">
            {[
              { icon: Zap, t: 'Instant player tag', d: 'A unique IN26 tag is minted the moment your dossier clears the registry.' },
              { icon: ShieldCheck, t: 'Secure registry', d: 'Your details are validated server-side and stored in the official symposium database.' },
              { icon: Eye, t: 'Watch your inbox', d: 'Slot allotments, reporting times and arena briefings arrive on your registered email.' },
            ].map((c, i) => (
              <motion.div
                key={c.t}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 + i * 0.1 }}
                className="hud-border bg-panel/70 p-5"
              >
                <c.icon size={19} className="text-neon" />
                <p className="font-grotesk mt-3 text-[13.5px] font-bold text-ivory">{c.t}</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-dim">{c.d}</p>
              </motion.div>
            ))}
            <div className="hud-border overflow-hidden">
              <img src="/media/arena-key.jpg" alt="The INTELLETTO-26 survival arena rendered in cinematic light" className="aspect-[4/3] w-full object-cover saturate-[0.7]" loading="lazy" />
              <p className="font-grotesk bg-void/80 px-4 py-3 text-[10.5px] tracking-[0.3em] text-faint uppercase">Arena render · Sector 07</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
