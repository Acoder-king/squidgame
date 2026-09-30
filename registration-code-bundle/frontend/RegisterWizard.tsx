import { useEffect, useState } from 'react';
import { useForm, useFieldArray, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Loader2, CheckCircle2, AlertCircle, Plus, Trash2,
  Swords, User, GraduationCap, PhoneCall, Users, ClipboardCheck, PartyPopper,
  MessageCircle, Send, Copy, ShieldCheck, CheckCheck, Printer, Check,
} from 'lucide-react';
import { apiGet, apiPost, type ArenaEvent } from '../lib/api';
import { buildRegistrationWhatsAppUrl } from '../data/content';
import { OFFICIAL_EVENTS } from '../data/eventsData';

const phoneRegex = /^[+]?[\d\s-]{10,16}$/;

const schema = z.object({
  event_slugs: z.array(z.string()).min(1, 'Select at least one arena to continue.'),
  full_name: z.string().trim().min(3, 'Enter your full name (min 3 characters).').max(80),
  email: z.string().trim().email('Enter a valid email address.').max(120),
  phone: z.string().trim().regex(phoneRegex, 'Enter a valid phone number.'),
  college: z.string().trim().min(3, 'Enter your college name.').max(140),
  department: z.string().trim().min(2, 'Enter your department.').max(80),
  year_of_study: z.string().min(1, 'Select your year of study.'),
  city: z.string().trim().max(60).optional().or(z.literal('')),
  state: z.string().trim().max(60).optional().or(z.literal('')),
  alternate_phone: z.string().trim().max(20).optional().or(z.literal('')),
  emergency_contact: z.string().trim().max(100).optional().or(z.literal('')),
  team_name: z.string().trim().max(60).optional().or(z.literal('')),
  team_size: z.string().optional().or(z.literal('')),
  teammates: z.array(z.object({ name: z.string().trim().min(2, 'Min 2 characters').max(80) })).max(5).optional().default([]),
  agree_rules: z.boolean().refine((v) => v === true, 'You must accept the arena protocol to register.'),
}).superRefine((v, ctx) => {
  if (v.alternate_phone && !phoneRegex.test(v.alternate_phone)) {
    ctx.addIssue({ code: 'custom', path: ['alternate_phone'], message: 'Enter a valid phone number.' });
  }
});

type FormValues = z.infer<typeof schema>;

const STEPS = [
  { id: 0, label: 'Arenas', icon: Swords },
  { id: 1, label: 'Player', icon: User },
  { id: 2, label: 'College', icon: GraduationCap },
  { id: 3, label: 'Contact', icon: PhoneCall },
  { id: 4, label: 'Squad', icon: Users },
  { id: 5, label: 'Review', icon: ClipboardCheck },
  { id: 6, label: 'Confirmed', icon: PartyPopper },
];

const STEP_FIELDS: (keyof FormValues)[][] = [
  ['event_slugs'],
  ['full_name', 'email', 'phone'],
  ['college', 'department', 'year_of_study'],
  ['alternate_phone'],
  [],
  ['agree_rules'],
  [],
];

const inputCls =
  'w-full border border-white/10 bg-void/70 px-4 py-3.5 text-[14px] text-ivory placeholder:text-faint transition-colors focus:border-neon/60 focus:outline-none';
const labelCls = 'font-grotesk mb-1.5 block text-[11px] font-semibold tracking-[0.25em] text-steel uppercase';
const errCls = 'mt-1.5 text-[12px] text-neon';

interface SuccessData {
  player_tag: string;
  full_name: string;
  event_slugs: string[];
  formData: FormValues;
  coordinators?: { event: string; phone: string; displayPhone: string }[];
}

export default function RegisterWizard() {
  const [step, setStep] = useState(0);
  const [events, setEvents] = useState<ArenaEvent[]>(OFFICIAL_EVENTS);
  const [eventsError, setEventsError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState<SuccessData | null>(null);
  const [copied, setCopied] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    mode: 'onTouched',
    defaultValues: {
      event_slugs: [],
      full_name: '',
      email: '',
      phone: '',
      college: '',
      department: '',
      year_of_study: '',
      city: '',
      state: '',
      alternate_phone: '',
      emergency_contact: '',
      team_name: '',
      team_size: '',
      teammates: [],
      agree_rules: false,
    },
  });
  const { register, control, trigger, watch, setValue, getValues, formState: { errors } } = form;
  const { fields, append, remove } = useFieldArray({ control, name: 'teammates' });
  const picked = watch('event_slugs');

  useEffect(() => {
    apiGet<ArenaEvent[]>('/api/events')
      .then((d) => {
        if (Array.isArray(d) && d.length > 0) {
          setEvents(d);
        }
      })
      .catch(() => {
        // Fallback already seeded with OFFICIAL_EVENTS
      });
  }, []);

  const toggleEvent = (slug: string) => {
    const cur = getValues('event_slugs');
    setValue('event_slugs', cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug], { shouldValidate: true });
  };

  const next = async () => {
    const toCheck = STEP_FIELDS[step];
    const ok = toCheck.length ? await trigger(toCheck) : true;
    if (ok) {
      setStep((s) => Math.min(6, s + 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  const back = () => {
    setStep((s) => Math.max(0, s - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = async () => {
    const ok = await trigger();
    if (!ok) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const values = getValues();
      const data = await apiPost<{
        ok: boolean;
        player_tag: string;
        full_name: string;
        event_slugs: string[];
        coordinators?: { event: string; phone: string; displayPhone: string }[];
      }>('/api/register', values);
      setSuccess({
        player_tag: data.player_tag,
        full_name: data.full_name,
        event_slugs: data.event_slugs,
        formData: values,
        coordinators: data.coordinators,
      });
      setStep(6);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Trigger instant WhatsApp dispatch for the first selected event
      if (data.event_slugs && data.event_slugs.length > 0) {
        const firstDispatch = buildRegistrationWhatsAppUrl(data.event_slugs[0], {
          player_tag: data.player_tag,
          ...values,
        });
        if (firstDispatch?.url) {
          try {
            window.open(firstDispatch.url, '_blank');
          } catch { }
        }
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const pickedNames = events.filter((e) => picked.includes(e.slug)).map((e) => e.name);
  const progress = Math.round(((step + 1) / 7) * 100);

  return (
    <div>
      <div className="mb-8" aria-label="Registration progress">
        <div className="flex items-center justify-between">
          <p className="font-grotesk text-[11px] tracking-[0.3em] text-faint">STEP {Math.min(step + 1, 7)} / 07</p>
          <p className="font-grotesk text-[11px] tracking-[0.3em] text-neon">{progress}%</p>
        </div>
        <div className="mt-2 h-1 overflow-hidden bg-white/10" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <motion.div className="h-full bg-neon" animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} style={{ boxShadow: `0 0 12px rgba(var(--theme-glow-rgb),0.8)` }} />
        </div>
        <ol className="mt-4 hidden grid-cols-7 gap-1 md:grid">
          {STEPS.map((s) => (
            <li key={s.id} className={`font-grotesk flex items-center gap-1.5 text-[10px] tracking-[0.14em] uppercase ${s.id <= step ? 'text-ivory' : 'text-faint'}`} aria-current={s.id === step ? 'step' : undefined}>
              <s.icon size={13} className={s.id <= step ? 'text-neon' : ''} /> {s.label}
            </li>
          ))}
        </ol>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -28 }}
          transition={{ duration: 0.28 }}
        >
          {step === 0 && (
            <fieldset>
              <legend className="font-display text-xl font-bold text-ivory sm:text-2xl">Select your arenas</legend>
              <p className="mt-1 text-sm text-dim">Choose every stage you want to enter. You can fight in both divisions.</p>
              {eventsError && <p className="mt-4 text-sm text-neon" role="alert">{eventsError}</p>}
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {events.map((e) => {
                  const on = picked.includes(e.slug);
                  return (
                    <button
                      type="button"
                      key={e.slug}
                      onClick={() => toggleEvent(e.slug)}
                      aria-pressed={on}
                      className={`cursor-pointer border p-4 text-left transition-all ${on ? 'border-neon bg-neon/10 shadow-[0_0_18px_rgba(237,27,118,0.3)]' : 'hud-border bg-panel/60 hover:border-white/25'
                        }`}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="font-grotesk text-[10px] tracking-[0.28em] text-faint">{e.stage_code}</span>
                        <span className={`flex h-5 w-5 items-center justify-center border text-[11px] font-bold ${on ? 'border-neon bg-neon text-white' : 'border-white/20 text-transparent'}`} aria-hidden="true">✓</span>
                      </span>
                      <span className="font-display mt-1.5 block text-[15px] font-bold text-ivory">{e.name}</span>
                      <span className={`font-grotesk mt-1 block text-[10.5px] tracking-[0.2em] uppercase ${e.category === 'technical' ? 'text-neon' : 'text-sage'}`}>{e.category}</span>
                    </button>
                  );
                })}
              </div>
              {errors.event_slugs && <p className={errCls} role="alert">{errors.event_slugs.message}</p>}
            </fieldset>
          )}

          {step === 1 && (
            <fieldset>
              <legend className="font-display text-xl font-bold text-ivory sm:text-2xl">Player information</legend>
              <p className="mt-1 text-sm text-dim">Your identity inside the arena. Use your real details.</p>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="r-name" className={labelCls}>Full name *</label>
                  <input id="r-name" className={inputCls} placeholder="Aarav Sharma" autoComplete="name" {...register('full_name')} />
                  {errors.full_name && <p className={errCls} role="alert">{errors.full_name.message}</p>}
                </div>
                <div>
                  <label htmlFor="r-email" className={labelCls}>Email *</label>
                  <input id="r-email" type="email" className={inputCls} placeholder="you@college.edu" autoComplete="email" {...register('email')} />
                  {errors.email && <p className={errCls} role="alert">{errors.email.message}</p>}
                </div>
                <div>
                  <label htmlFor="r-phone" className={labelCls}>Phone *</label>
                  <input id="r-phone" type="tel" className={inputCls} placeholder="+91 98765 43210" autoComplete="tel" {...register('phone')} />
                  {errors.phone && <p className={errCls} role="alert">{errors.phone.message}</p>}
                </div>
              </div>
            </fieldset>
          )}

          {step === 2 && (
            <fieldset>
              <legend className="font-display text-xl font-bold text-ivory sm:text-2xl">College information</legend>
              <p className="mt-1 text-sm text-dim">The institution you represent on the national stage.</p>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="r-college" className={labelCls}>College name *</label>
                  <input id="r-college" className={inputCls} placeholder="Your college / university" {...register('college')} />
                  {errors.college && <p className={errCls} role="alert">{errors.college.message}</p>}
                </div>
                <div>
                  <label htmlFor="r-dept" className={labelCls}>Department *</label>
                  <input id="r-dept" className={inputCls} placeholder="CSE / ECE / ME …" {...register('department')} />
                  {errors.department && <p className={errCls} role="alert">{errors.department.message}</p>}
                </div>
                <div>
                  <label htmlFor="r-year" className={labelCls}>Year of study *</label>
                  <select id="r-year" className={inputCls} {...register('year_of_study')} defaultValue="">
                    <option value="" disabled>Select year</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="PG / Other">PG / Other</option>
                  </select>
                  {errors.year_of_study && <p className={errCls} role="alert">{errors.year_of_study.message}</p>}
                </div>
                <div>
                  <label htmlFor="r-city" className={labelCls}>City</label>
                  <input id="r-city" className={inputCls} placeholder="Vellore" autoComplete="address-level2" {...register('city')} />
                </div>
                <div>
                  <label htmlFor="r-state" className={labelCls}>State</label>
                  <input id="r-state" className={inputCls} placeholder="Tamil Nadu" autoComplete="address-level1" {...register('state')} />
                </div>
              </div>
            </fieldset>
          )}

          {step === 3 && (
            <fieldset>
              <legend className="font-display text-xl font-bold text-ivory sm:text-2xl">Contact information</legend>
              <p className="mt-1 text-sm text-dim">Backup channels so command can always reach you.</p>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="r-alt" className={labelCls}>Alternate phone</label>
                  <input id="r-alt" type="tel" className={inputCls} placeholder="Optional" {...register('alternate_phone')} />
                  {errors.alternate_phone && <p className={errCls} role="alert">{errors.alternate_phone.message}</p>}
                </div>
                <div>
                  <label htmlFor="r-emg" className={labelCls}>Emergency contact</label>
                  <input id="r-emg" className={inputCls} placeholder="Name + phone (optional)" {...register('emergency_contact')} />
                </div>
              </div>
              <div className="hud-border glass mt-6 p-4">
                <p className="font-grotesk text-[12px] leading-relaxed tracking-wide text-steel">
                  PRIMARY CHANNELS — {getValues('email') || '—'} · {getValues('phone') || '—'}. All arena
                  briefings and slot allotments will be sent here.
                </p>
              </div>
            </fieldset>
          )}

          {step === 4 && (
            <fieldset>
              <legend className="font-display text-xl font-bold text-ivory sm:text-2xl">Squad details</legend>
              <p className="mt-1 text-sm text-dim">Solo player? Skip ahead. Entering team arenas? Declare your squad.</p>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="r-team" className={labelCls}>Squad name</label>
                  <input id="r-team" className={inputCls} placeholder="e.g. Night Owls (optional)" {...register('team_name')} />
                </div>
                <div>
                  <label htmlFor="r-tsize" className={labelCls}>Squad size</label>
                  <select id="r-tsize" className={inputCls} {...register('team_size')} defaultValue="">
                    <option value="">Solo / undecided</option>
                    <option value="2">2 players</option>
                    <option value="3">3 players</option>
                    <option value="4">4 players</option>
                    <option value="5+">5+ players</option>
                  </select>
                </div>
              </div>
              <div className="mt-6">
                <p className={labelCls}>Squad members (max 5)</p>
                <div className="space-y-3">
                  {fields.map((f, i) => (
                    <div key={f.id} className="flex gap-2">
                      <input
                        className={inputCls}
                        placeholder={`Member ${i + 1} full name`}
                        {...register(`teammates.${i}.name` as const)}
                        aria-label={`Squad member ${i + 1} name`}
                      />
                      <button type="button" onClick={() => remove(i)} className="cursor-pointer border border-white/15 px-3.5 text-dim hover:border-neon hover:text-neon" aria-label={`Remove member ${i + 1}`}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {fields.length < 5 && (
                    <button type="button" onClick={() => append({ name: '' })} className="font-grotesk inline-flex cursor-pointer items-center gap-2 border border-dashed border-white/20 px-4 py-3 text-[12px] font-bold tracking-[0.18em] text-dim uppercase hover:border-neon/60 hover:text-neon">
                      <Plus size={15} /> Add member
                    </button>
                  )}
                </div>
              </div>
            </fieldset>
          )}

          {step === 5 && (
            <div>
              <h2 className="font-display text-xl font-bold text-ivory sm:text-2xl">Review and confirm</h2>
              <p className="mt-1 text-sm text-dim">Verify your dossier before entering the registry.</p>
              <dl className="hud-border mt-6 divide-y divide-white/10 bg-panel/60 text-[13.5px]">
                {[
                  ['Arenas', pickedNames.join(', ') || '—'],
                  ['Player', `${getValues('full_name')} · ${getValues('email')} · ${getValues('phone')}`],
                  ['College', `${getValues('college')} · ${getValues('department')} · ${getValues('year_of_study')}`],
                  ['Squad', getValues('team_name') || (fields.length ? `${fields.length} member(s)` : 'Solo')],
                ].map(([k, v]) => (
                  <div key={k} className="grid gap-1 px-5 py-4 sm:grid-cols-[140px_1fr] sm:gap-4">
                    <dt className="font-grotesk text-[11px] tracking-[0.25em] text-faint uppercase">{k}</dt>
                    <dd className="text-ivory">{v}</dd>
                  </div>
                ))}
              </dl>
              <label className="mt-5 flex cursor-pointer items-start gap-3 text-[13.5px] text-dim">
                <input type="checkbox" className="mt-1 h-4 w-4 shrink-0" {...register('agree_rules')} />
                <span>I accept the arena protocol and confirm that all details provided are accurate. I understand the official rulebook will be published by the organizers.</span>
              </label>
              {errors.agree_rules && <p className={errCls} role="alert">{errors.agree_rules.message}</p>}
              {submitError && (
                <p className="mt-4 flex items-center gap-2 text-[13.5px] text-neon" role="alert">
                  <AlertCircle size={16} /> {submitError}
                </p>
              )}
            </div>
          )}

          {step === 6 && success && (
            <div className="py-6 text-center" role="status">
              <div>
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 14 }}
                  className="relative mx-auto flex h-20 w-20 items-center justify-center"
                >
                  <div className="absolute inset-0 rounded-full bg-emerald-500/25 blur-xl animate-pulse" />
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-2 border-emerald-400 bg-emerald-950/80 shadow-[0_0_30px_rgba(37,211,102,0.5)]">
                    <CheckCircle2 size={38} className="text-[#25D366]" />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <h2 className="font-display mt-6 text-2xl font-black text-ivory sm:text-3xl tracking-wide">
                    YOU HAVE <span className="text-[#25D366]" style={{ textShadow: '0 0 24px rgba(37,211,102,0.6)' }}>SUCCESSFULLY REGISTERED!</span>
                  </h2>
                  <p className="mt-2 text-sm text-dim">
                    Official arena entry granted! Your registration has been confirmed in TiDB Cloud.
                  </p>

                  <div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/50 bg-emerald-500/15 px-4 py-1.5 font-grotesk text-[11px] font-bold tracking-widest text-[#25D366] uppercase shadow-[0_0_18px_rgba(37,211,102,0.25)]">
                    <ShieldCheck size={15} /> Confirmed in System · TiDB Cloud Cleared
                  </div>
                </motion.div>

                {/* Official Player Pass Card */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="hud-border mx-auto mt-8 max-w-lg border-emerald-500/40 bg-void/85 p-6 text-left shadow-[0_0_40px_rgba(37,211,102,0.18)]"
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div>
                      <p className="font-grotesk text-[10px] tracking-[0.35em] text-[#25D366] uppercase font-bold">
                        INTELLETTO-26 // ARENA PASS
                      </p>
                      <p className="font-display mt-1 text-3xl font-black tracking-wider text-ivory">
                        {success.player_tag}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-grotesk inline-flex items-center gap-1 rounded-xs border border-emerald-500/50 bg-emerald-500/20 px-2.5 py-1 text-[10px] font-bold tracking-widest text-emerald-400 uppercase">
                        <CheckCheck size={12} /> CONFIRMED
                      </span>
                      <p className="font-grotesk mt-1 text-[10px] text-faint uppercase">TiDB Cloud Live</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 text-[13px] sm:grid-cols-2">
                    <div>
                      <p className="font-grotesk text-[10px] tracking-[0.25em] text-faint uppercase">Student Name</p>
                      <p className="mt-0.5 font-semibold text-ivory">{success.full_name}</p>
                    </div>
                    <div>
                      <p className="font-grotesk text-[10px] tracking-[0.25em] text-faint uppercase">Phone</p>
                      <p className="mt-0.5 font-semibold text-ivory">{success.formData.phone}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="font-grotesk text-[10px] tracking-[0.25em] text-faint uppercase">College & Department</p>
                      <p className="mt-0.5 font-semibold text-ivory">{success.formData.college}</p>
                      <p className="text-[12px] text-dim">{success.formData.department} · {success.formData.year_of_study}</p>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-white/10 pt-4">
                    <p className="font-grotesk text-[10px] tracking-[0.3em] text-faint uppercase">CONFIRMED ARENAS</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {pickedNames.map((n) => (
                        <span
                          key={n}
                          className="font-grotesk inline-block border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold tracking-wider text-ivory uppercase"
                        >
                          ✓ {n}
                        </span>
                      ))}
                    </div>
                  </div>

                  {success.formData.team_name && (
                    <div className="mt-4 border-t border-white/10 pt-3">
                      <p className="font-grotesk text-[10px] tracking-[0.25em] text-faint uppercase">Squad Name</p>
                      <p className="mt-0.5 font-semibold text-ivory">{success.formData.team_name}</p>
                    </div>
                  )}

                  {/* Authorized Stamp */}
                  <div className="mt-5 border-t border-dashed border-white/15 pt-4 flex items-center justify-between text-[11px] text-steel">
                    <span className="font-grotesk tracking-widest uppercase">
                      Dept. of AIML · CAHCET
                    </span>
                    <span className="font-grotesk font-bold text-emerald-400 uppercase">
                      ✓ Entry Validated
                    </span>
                  </div>
                </motion.div>

                {/* Action toolbar */}
                <div className="mx-auto mt-6 flex max-w-lg flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="font-grotesk inline-flex cursor-pointer items-center gap-1.5 border border-white/20 bg-void/60 px-5 py-2.5 text-[11.5px] font-bold tracking-wider text-ivory uppercase transition-colors hover:border-white/40"
                  >
                    <Printer size={13} /> Print Arena Pass
                  </button>
                </div>

                <p className="font-grotesk mx-auto mt-4 max-w-md text-[12px] leading-relaxed tracking-wide text-faint">
                  Screenshot or print this pass. Present your Player Tag at the physical registration desk on event day.
                </p>

                {/* WhatsApp Coordinator Forwarding Section */}
                <div className="hud-border mx-auto mt-8 max-w-lg border-emerald-500/40 bg-panel/80 p-6 text-left shadow-[0_0_30px_rgba(37,211,102,0.18)]">
                  <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-emerald-500/50 bg-emerald-500/20 text-[#25D366]">
                      <MessageCircle size={18} />
                    </span>
                    <div>
                      <h3 className="font-display text-[14px] font-bold tracking-wider text-ivory uppercase">
                        Send Registration to Event Coordinator
                      </h3>
                      <p className="font-grotesk text-[11px] text-dim">
                        Connect directly with your event handler on WhatsApp to submit your registration details.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2.5">
                    {success.event_slugs.map((slug) => {
                      const dispatch = buildRegistrationWhatsAppUrl(slug, {
                        player_tag: success.player_tag,
                        ...success.formData,
                      });
                      if (!dispatch) return null;

                      return (
                        <a
                          key={slug}
                          href={dispatch.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-center justify-between gap-3 border border-emerald-500/40 bg-emerald-500/10 p-3.5 transition-all hover:border-emerald-400 hover:bg-emerald-500/20 hover:shadow-[0_0_16px_rgba(37,211,102,0.3)]"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-grotesk text-[10px] font-bold tracking-[0.18em] text-[#25D366] uppercase">
                              {dispatch.eventName} Coordinator
                            </p>
                            <p className="font-grotesk mt-0.5 text-[12px] font-semibold text-ivory">
                              📱 +91 {dispatch.displayPhone}
                            </p>
                          </div>
                          <span className="font-grotesk inline-flex shrink-0 items-center gap-1.5 bg-[#25D366] px-3.5 py-1.5 text-[11px] font-bold tracking-wider text-black uppercase transition-transform group-hover:scale-105">
                            <Send size={12} /> Send on WhatsApp
                          </span>
                        </a>
                      );
                    })}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                    <span className="font-grotesk text-[10px] tracking-wider text-faint uppercase">
                      Auto-formatted registration dossier
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const text = success.event_slugs.map((slug) => {
                          const d = buildRegistrationWhatsAppUrl(slug, { player_tag: success.player_tag, ...success.formData });
                          return d ? decodeURIComponent(d.url.split('text=')[1] || '') : '';
                        }).filter(Boolean).join('\n\n');
                        navigator.clipboard.writeText(text);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2500);
                      }}
                      className="font-grotesk inline-flex cursor-pointer items-center gap-1 text-[11px] font-semibold tracking-wider text-dim uppercase transition-colors hover:text-ivory"
                    >
                      <Copy size={12} /> {copied ? 'Copied Dossier!' : 'Copy Dossier'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {step < 6 && (
        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={back}
            disabled={step === 0}
            className="font-grotesk inline-flex cursor-pointer items-center justify-center gap-2 border border-white/15 px-7 py-3.5 text-[12px] font-bold tracking-[0.2em] text-dim uppercase transition-colors hover:text-ivory disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronLeft size={16} /> Back
          </button>
          {step < 5 ? (
            <button
              type="button"
              onClick={next}
              className="clip-btn font-grotesk inline-flex cursor-pointer items-center justify-center gap-2 bg-neon px-8 py-3.5 text-[12px] font-bold tracking-[0.2em] text-white uppercase hover:bg-crimson"
            >
              Continue <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="clip-btn font-grotesk inline-flex cursor-pointer items-center justify-center gap-2 bg-neon px-8 py-3.5 text-[12px] font-bold tracking-[0.2em] text-white uppercase hover:bg-crimson disabled:opacity-60"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              {submitting ? 'Registering…' : 'Confirm registration'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
