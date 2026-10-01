import { useEffect, useState } from 'react';
import { useForm, useFieldArray, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Loader2, CheckCircle2, AlertCircle, Plus, Trash2,
  Swords, User, GraduationCap, PhoneCall, Users, ClipboardCheck, PartyPopper,
  MessageCircle, Send, Copy, ShieldCheck, CheckCheck, Printer, Check, QrCode, IndianRupee,
  Upload, FileCheck, X, Eye, ShieldAlert, CheckCircle, RefreshCw, Paperclip, Download, Share2,
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
  { id: 5, label: 'Payment', icon: QrCode },
  { id: 6, label: 'Review', icon: ClipboardCheck },
  { id: 7, label: 'Confirmed', icon: PartyPopper },
];

const STEP_FIELDS: (keyof FormValues)[][] = [
  ['event_slugs'],
  ['full_name', 'email', 'phone'],
  ['college', 'department', 'year_of_study'],
  ['alternate_phone'],
  [],
  [],
  ['agree_rules'],
  [],
];

/* ── UPI Payment QR codes mapped to specific events ── */
const EVENT_PAYMENT_QR: Record<string, {
  coordinatorName: string;
  upiId: string;
  qrImage: string;
}> = {
  'paper-presentation': {
    coordinatorName: 'Vijay',
    upiId: 'm.s.vijayakumar360@okicici',
    qrImage: '/qr-codes/paper-presentation.jpg',
  },
  'prompt-clash': {
    coordinatorName: 'Harish Priyan',
    upiId: 'harishpriyan767-1@okhdfcbank',
    qrImage: '/qr-codes/prompt-clash.jpg',
  },
  'free-fire': {
    coordinatorName: 'Shanmugam P',
    upiId: 'shanmugamp598@oksbi',
    qrImage: '/qr-codes/free-fire.jpg',
  },
  'quest-of-mind': {
    coordinatorName: 'Arif',
    upiId: 'ah8499418@oksbi',
    qrImage: '/qr-codes/quest-of-mind.jpg',
  },
  'squid-game': {
    coordinatorName: 'Mohammed Amaan. D',
    upiId: 'amaanmohammed757@okhdfcbank',
    qrImage: '/qr-codes/squid-game.jpg',
  },
  'technical-quiz': {
    coordinatorName: 'Hasni Mubarak G',
    upiId: '919489619915@wahdfcbank',
    qrImage: '/qr-codes/technical-quiz.jpg',
  },
  'ai-web-design': {
    coordinatorName: 'Muhammad Ameen',
    upiId: 'jmuhammadameen19@okhdfcbank',
    qrImage: '/qr-codes/ai-web-design.jpg',
  },
  'filmography-photography': {
    coordinatorName: 'Rakshan',
    upiId: '8678903307@fam',
    qrImage: '/qr-codes/filmography-photography.jpg',
  },
};

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

  /* ── Payment confirmation and verification state ── */
  const [paymentConfirmed, setPaymentConfirmed] = useState<Record<string, boolean>>({});
  const [transactionIds, setTransactionIds] = useState<Record<string, string>>({});
  const [paymentProofs, setPaymentProofs] = useState<Record<string, { dataUrl: string; name: string; size: number }>>({});
  const [txnErrors, setTxnErrors] = useState<Record<string, string>>({});
  const [txnChecking, setTxnChecking] = useState<Record<string, boolean>>({});
  const [txnSuccess, setTxnSuccess] = useState<Record<string, boolean>>({});
  const [paymentError, setPaymentError] = useState('');
  const [verifyingPayments, setVerifyingPayments] = useState(false);
  const [selectedProofModal, setSelectedProofModal] = useState<{ src: string; title: string } | null>(null);
  const [canShareFile, setCanShareFile] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'canShare' in navigator) {
      try {
        const testFile = new File(['test'], 'test.png', { type: 'image/png' });
        setCanShareFile(navigator.canShare({ files: [testFile] }));
      } catch {
        setCanShareFile(false);
      }
    }
  }, []);

  const handleShareWithReceipt = async (slug: string, dispatch: any) => {
    const proof = paymentProofs[slug];
    const text = dispatch.message;
    if (!proof || !canShareFile) {
      window.open(dispatch.url, '_blank');
      return;
    }

    try {
      const res = await fetch(proof.dataUrl);
      const blob = await res.blob();
      const ext = blob.type.includes('png') ? 'png' : 'jpg';
      const file = new File([blob], `receipt-${slug}.${ext}`, { type: blob.type || 'image/jpeg' });

      await navigator.share({
        title: `INTELLETTO-26 Registration - ${dispatch.eventName}`,
        text: text,
        files: [file],
      });
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        window.open(dispatch.url, '_blank');
      }
    }
  };

  const validateUpiInput = (id: string, currentSlug: string, allTxnIds: Record<string, string>, payableSlugs: string[]) => {
    const clean = id.trim();
    if (!clean) {
      return { valid: false, message: '12-digit UPI UTR is required.' };
    }
    if (!/^\d{12}$/.test(clean)) {
      return {
        valid: false,
        message: `Must be exactly 12 numeric digits (${clean.length}/12 entered). Check UPI receipt.`,
      };
    }
    if (/^(\d)\1{11}$/.test(clean)) {
      return { valid: false, message: 'Invalid reference ID: repeating digits are not permitted.' };
    }
    const dummySequences = [
      '123456789012', '012345678901', '234567890123', '345678901234',
      '987654321098', '876543210987', '000000000000', '111111111111',
      '121212121212', '123123123123',
    ];
    if (dummySequences.includes(clean)) {
      return { valid: false, message: 'Dummy reference ID detected! Enter the genuine 12-digit UPI UTR.' };
    }
    // Check if duplicate with other events in the same registration
    for (const otherSlug of payableSlugs) {
      if (otherSlug !== currentSlug && (allTxnIds[otherSlug] || '').trim() === clean) {
        return { valid: false, message: 'Duplicate ID! You cannot use the same transaction ID for multiple events.' };
      }
    }
    return { valid: true, message: '✓ Valid 12-digit UPI UTR' };
  };

  const handleTxnChange = async (slug: string, val: string) => {
    const digitsOnly = val.replace(/\D/g, '').slice(0, 12);
    const updated = { ...transactionIds, [slug]: digitsOnly };
    setTransactionIds(updated);
    setPaymentError('');

    const payableSlugs = picked.filter((s) => s in EVENT_PAYMENT_QR);

    if (digitsOnly.length === 12) {
      const check = validateUpiInput(digitsOnly, slug, updated, payableSlugs);
      if (!check.valid) {
        setTxnErrors((prev) => ({ ...prev, [slug]: check.message }));
        setTxnSuccess((prev) => ({ ...prev, [slug]: false }));
      } else {
        setTxnErrors((prev) => ({ ...prev, [slug]: '' }));
        setTxnSuccess((prev) => ({ ...prev, [slug]: true }));

        // Attempt server-side duplicate check (non-blocking if API is offline or returns HTML)
        setTxnChecking((prev) => ({ ...prev, [slug]: true }));
        try {
          const res = await apiPost<{ valid: boolean; message?: string }>('/api/check-transaction', {
            transactionId: digitsOnly,
          });
          if (res && res.valid) {
            setTxnErrors((prev) => ({ ...prev, [slug]: '' }));
            setTxnSuccess((prev) => ({ ...prev, [slug]: true }));
          } else if (res && !res.valid) {
            setTxnErrors((prev) => ({ ...prev, [slug]: res?.message || 'Invalid or duplicate reference ID.' }));
            setTxnSuccess((prev) => ({ ...prev, [slug]: false }));
          }
        } catch (err: any) {
          const msg = err?.message || '';
          if (msg && !msg.includes('<!DOCTYPE') && !msg.includes('JSON') && !msg.includes('HTML') && !msg.includes('Unexpected') && !msg.includes('non-JSON')) {
            setTxnErrors((prev) => ({ ...prev, [slug]: msg }));
            setTxnSuccess((prev) => ({ ...prev, [slug]: false }));
          } else {
            console.warn('Backend duplicate check unavailable, using client validation:', msg);
            setTxnErrors((prev) => ({ ...prev, [slug]: '' }));
            setTxnSuccess((prev) => ({ ...prev, [slug]: true }));
          }
        } finally {
          setTxnChecking((prev) => ({ ...prev, [slug]: false }));
        }
      }
    } else {
      setTxnSuccess((prev) => ({ ...prev, [slug]: false }));
      if (digitsOnly.length > 0) {
        setTxnErrors((prev) => ({
          ...prev,
          [slug]: `Must be 12 numeric digits (${digitsOnly.length}/12 entered).`,
        }));
      } else {
        setTxnErrors((prev) => ({ ...prev, [slug]: '' }));
      }
    }
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        };
        img.onerror = () => resolve(event.target?.result as string);
        img.src = event.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleProofUpload = async (slug: string, file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setPaymentError('Only image files (JPG, PNG, WebP) are allowed for payment proof.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setPaymentError('Image size must be less than 10 MB.');
      return;
    }
    try {
      const dataUrl = await compressImage(file);
      setPaymentProofs((prev) => ({
        ...prev,
        [slug]: { dataUrl, name: file.name, size: file.size },
      }));
      setPaymentError('');
    } catch {
      setPaymentError('Failed to process payment screenshot. Please try again.');
    }
  };

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

    /* ── Payment step validation ── */
    if (step === 5) {
      const payableSlugs = picked.filter((s) => s in EVENT_PAYMENT_QR);
      if (payableSlugs.length > 0) {
        // 1. Check all confirmed
        const unconfirmed = payableSlugs.filter((s) => !paymentConfirmed[s]);
        if (unconfirmed.length > 0) {
          setPaymentError(`Please confirm payment for: ${unconfirmed.map(s => events.find(e => e.slug === s)?.name || s).join(', ')}`);
          return;
        }

        // 2. Check 12-digit transaction IDs
        for (const slug of payableSlugs) {
          const txn = (transactionIds[slug] || '').trim();
          const eventName = events.find(e => e.slug === slug)?.name || slug;
          if (!txn) {
            setPaymentError(`Please enter the 12-digit UPI Transaction ID for ${eventName}`);
            return;
          }
          const check = validateUpiInput(txn, slug, transactionIds, payableSlugs);
          if (!check.valid) {
            setPaymentError(`${eventName}: ${check.message}`);
            return;
          }
        }

        // 3. Check for form-level duplicates
        const seenTxns = new Set<string>();
        for (const slug of payableSlugs) {
          const txn = (transactionIds[slug] || '').trim();
          const eventName = events.find(e => e.slug === slug)?.name || slug;
          if (seenTxns.has(txn)) {
            setPaymentError(`Duplicate Transaction ID: "${txn}" is used for multiple events. Each event must be paid separately.`);
            return;
          }
          seenTxns.add(txn);
        }

        // 4. Check for screenshot proofs
        const missingProofs = payableSlugs.filter((s) => !paymentProofs[s]);
        if (missingProofs.length > 0) {
          setPaymentError(`Please upload the payment receipt screenshot for: ${missingProofs.map(s => events.find(e => e.slug === s)?.name || s).join(', ')}`);
          return;
        }

        // 5. Server check for database duplicate
        setVerifyingPayments(true);
        try {
          for (const slug of payableSlugs) {
            const txn = (transactionIds[slug] || '').trim();
            const eventName = events.find(e => e.slug === slug)?.name || slug;
            try {
              const res = await apiPost<{ valid: boolean; message?: string }>('/api/check-transaction', {
                transactionId: txn,
              });
              if (res && !res.valid) {
                setPaymentError(`${eventName}: ${res.message || 'Duplicate Transaction ID detected in system.'}`);
                setVerifyingPayments(false);
                return;
              }
            } catch (checkErr: any) {
              const msg = checkErr?.message || '';
              if (msg && !msg.includes('<!DOCTYPE') && !msg.includes('JSON') && !msg.includes('HTML') && !msg.includes('Unexpected') && !msg.includes('non-JSON')) {
                setPaymentError(msg);
                setVerifyingPayments(false);
                return;
              }
              console.warn('Backend duplicate check unavailable during step verification:', msg);
            }
          }
        } finally {
          setVerifyingPayments(false);
        }

        setPaymentError('');
      }
    }

    if (ok) {
      setStep((s) => Math.min(7, s + 1));
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
      const payableSlugs = picked.filter((s) => s in EVENT_PAYMENT_QR);
      const paymentDetails = payableSlugs.map((slug) => ({
        event_slug: slug,
        event_name: events.find((e) => e.slug === slug)?.name || slug,
        coordinator: EVENT_PAYMENT_QR[slug]?.coordinatorName || '',
        upi_id: EVENT_PAYMENT_QR[slug]?.upiId || '',
        transaction_id: transactionIds[slug] || '',
        proof_name: paymentProofs[slug]?.name || '',
        proof_data: paymentProofs[slug]?.dataUrl || '',
      }));

      const data = await apiPost<{
        ok: boolean;
        player_tag: string;
        full_name: string;
        event_slugs: string[];
        payment_details?: any[];
        coordinators?: { event: string; phone: string; displayPhone: string }[];
      }>('/api/register', {
        ...values,
        payment_details: paymentDetails,
      });

      setSuccess({
        player_tag: data.player_tag,
        full_name: data.full_name,
        event_slugs: data.event_slugs,
        formData: values,
        coordinators: data.coordinators,
      });
      setStep(7);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Trigger instant WhatsApp dispatch for the first selected event
      if (data.event_slugs && data.event_slugs.length > 0) {
        const firstSlug = data.event_slugs[0];
        const firstDispatch = buildRegistrationWhatsAppUrl(firstSlug, {
          player_tag: data.player_tag,
          transaction_id: transactionIds[firstSlug],
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
  const progress = Math.round(((step + 1) / 8) * 100);

  return (
    <div>
      <div className="mb-8" aria-label="Registration progress">
        <div className="flex items-center justify-between">
          <p className="font-grotesk text-[11px] tracking-[0.3em] text-faint">STEP {Math.min(step + 1, 8)} / 08</p>
          <p className="font-grotesk text-[11px] tracking-[0.3em] text-neon">{progress}%</p>
        </div>
        <div className="mt-2 h-1 overflow-hidden bg-white/10" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <motion.div className="h-full bg-neon" animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} style={{ boxShadow: `0 0 12px rgba(var(--theme-glow-rgb),0.8)` }} />
        </div>
        <ol className="mt-4 hidden grid-cols-8 gap-1 md:grid">
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

          {/* ── STEP 5: UPI Payment QR Codes ── */}
          {step === 5 && (() => {
            const payableSlugs = picked.filter((s) => s in EVENT_PAYMENT_QR);
            const hasPayable = payableSlugs.length > 0;
            return (
              <div>
                <h2 className="font-display text-xl font-bold text-ivory sm:text-2xl">Payment via UPI</h2>
                <p className="mt-1 text-sm text-dim">
                  {hasPayable
                    ? 'Scan the QR code(s) below to pay the registration fee for your selected events. Pay the coordinator directly.'
                    : 'No UPI payment is required for your selected events. You may proceed to the next step.'}
                </p>

                {hasPayable && (
                  <div className="mt-6 grid gap-5 sm:grid-cols-2">
                    {payableSlugs.map((slug) => {
                      const qr = EVENT_PAYMENT_QR[slug];
                      const ev = events.find((e) => e.slug === slug);
                      return (
                        <motion.div
                          key={slug}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.35 }}
                          className="hud-border group relative overflow-hidden bg-panel/70 p-5 transition-all hover:border-neon/50 hover:shadow-[0_0_28px_rgba(237,27,118,0.18)]"
                        >
                          {/* Event Name Badge */}
                          <div className="mb-3 flex items-center justify-between">
                            <span className="font-grotesk text-[10px] font-bold tracking-[0.28em] text-neon uppercase">
                              {ev?.name || slug}
                            </span>
                            <span className="font-grotesk inline-flex items-center gap-1 rounded-sm border border-neon/30 bg-neon/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-neon uppercase">
                              <IndianRupee size={10} /> {ev?.fee || 'See fee'}
                            </span>
                          </div>

                          {/* QR Code Image */}
                          <div className="relative mx-auto aspect-[3/4] max-w-[280px] overflow-hidden rounded-lg border border-white/10 bg-white">
                            <img
                              src={qr.qrImage}
                              alt={`UPI QR Code for ${qr.coordinatorName}`}
                              className="h-full w-full object-contain"
                              loading="lazy"
                            />
                          </div>

                          {/* Coordinator Info */}
                          <div className="mt-3 text-center">
                            <p className="font-grotesk text-[11px] tracking-[0.2em] text-faint uppercase">Pay to Coordinator</p>
                            <p className="font-display mt-0.5 text-[15px] font-bold text-ivory">{qr.coordinatorName}</p>
                            <p className="font-grotesk mt-1 text-[11px] text-steel break-all">UPI: {qr.upiId}</p>
                          </div>

                          {/* Scan Instruction */}
                          <div className="mt-3 flex items-center justify-center gap-1.5 rounded-sm border border-white/10 bg-void/50 py-2 text-center">
                            <QrCode size={13} className="text-neon" />
                            <span className="font-grotesk text-[10px] font-semibold tracking-[0.18em] text-dim uppercase">Scan to pay with any UPI app</span>
                          </div>

                          {/* Payment Confirmation */}
                          <div className={`mt-4 border-t pt-4 ${paymentConfirmed[slug]
                              ? 'border-emerald-500/30'
                              : 'border-white/10'
                            }`}>
                            <label className="flex cursor-pointer items-start gap-3 text-[13px] text-dim">
                              <input
                                type="checkbox"
                                checked={!!paymentConfirmed[slug]}
                                onChange={(e) => {
                                  setPaymentConfirmed((prev) => ({ ...prev, [slug]: e.target.checked }));
                                  setPaymentError('');
                                }}
                                className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-500"
                              />
                              <span className={paymentConfirmed[slug] ? 'text-emerald-400 font-semibold' : 'text-dim'}>
                                {paymentConfirmed[slug] ? '✓ Payment completed for this arena' : 'I have completed payment for this arena'}
                              </span>
                            </label>

                            {paymentConfirmed[slug] && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                transition={{ duration: 0.25 }}
                                className="mt-4 space-y-4 border-t border-white/5 pt-4"
                              >
                                {/* 1. UPI Transaction ID Input */}
                                <div>
                                  <div className="flex items-center justify-between">
                                    <label className={labelCls}>UPI Reference / UTR ID (12 Digits) *</label>
                                    <span className={`font-mono text-[10.5px] font-bold ${(transactionIds[slug]?.length || 0) === 12
                                        ? (txnErrors[slug] ? 'text-neon' : 'text-emerald-400')
                                        : 'text-faint'
                                      }`}>
                                      {transactionIds[slug]?.length || 0} / 12 digits
                                    </span>
                                  </div>
                                  <div className="relative mt-1">
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      maxLength={12}
                                      value={transactionIds[slug] || ''}
                                      onChange={(e) => handleTxnChange(slug, e.target.value)}
                                      placeholder="e.g. 427012345678"
                                      className={`${inputCls} font-mono tracking-wider ${txnErrors[slug]
                                          ? 'border-neon/80 bg-neon/5'
                                          : txnSuccess[slug]
                                            ? 'border-emerald-500/80 bg-emerald-950/20'
                                            : ''
                                        }`}
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                                      {txnChecking[slug] && (
                                        <span className="flex items-center gap-1 text-[11px] text-faint">
                                          <Loader2 size={13} className="animate-spin text-neon" /> Checking...
                                        </span>
                                      )}
                                      {txnSuccess[slug] && !txnChecking[slug] && (
                                        <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                                          <CheckCircle size={15} />
                                        </span>
                                      )}
                                      {txnErrors[slug] && !txnChecking[slug] && (
                                        <span className="flex items-center gap-1 text-[11px] text-neon">
                                          <AlertCircle size={15} />
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Error or Success feedback */}
                                  {txnErrors[slug] ? (
                                    <p className="mt-1.5 flex items-center gap-1 text-[11px] text-neon font-medium" role="alert">
                                      <AlertCircle size={13} className="shrink-0" /> {txnErrors[slug]}
                                    </p>
                                  ) : txnSuccess[slug] ? (
                                    <p className="mt-1.5 flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                                      <CheckCircle size={13} className="shrink-0" /> Valid 12-digit UTR · Verified unique in registry
                                    </p>
                                  ) : (
                                    <p className="font-grotesk mt-1.5 text-[10.5px] text-faint">
                                      Enter the 12-digit numeric UPI Reference / UTR Number found in your payment app receipt (e.g. Google Pay, PhonePe, Paytm).
                                    </p>
                                  )}
                                </div>

                                {/* 2. Payment Screenshot Upload */}
                                <div>
                                  <label className={labelCls}>Upload Payment Screenshot / Receipt *</label>
                                  {paymentProofs[slug] ? (
                                    <div className="hud-border relative flex items-center justify-between gap-3 border-emerald-500/40 bg-emerald-950/20 p-3">
                                      <div className="flex items-center gap-3 overflow-hidden">
                                        <button
                                          type="button"
                                          onClick={() => setSelectedProofModal({
                                            src: paymentProofs[slug].dataUrl,
                                            title: `${ev?.name || slug} — Payment Proof`,
                                          })}
                                          className="group/img relative h-12 w-12 shrink-0 cursor-pointer overflow-hidden rounded border border-emerald-500/50 bg-black"
                                          title="Click to preview full screenshot"
                                        >
                                          <img
                                            src={paymentProofs[slug].dataUrl}
                                            alt="Receipt Preview"
                                            className="h-full w-full object-cover transition-transform group-hover/img:scale-110"
                                          />
                                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover/img:opacity-100">
                                            <Eye size={14} className="text-white" />
                                          </div>
                                        </button>
                                        <div className="overflow-hidden">
                                          <p className="truncate text-[12px] font-semibold text-emerald-400 flex items-center gap-1">
                                            <FileCheck size={13} className="shrink-0" /> {paymentProofs[slug].name}
                                          </p>
                                          <p className="font-mono text-[10.5px] text-faint">
                                            {(paymentProofs[slug].size / 1024).toFixed(1)} KB · Screenshot Attached
                                          </p>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() => setSelectedProofModal({
                                            src: paymentProofs[slug].dataUrl,
                                            title: `${ev?.name || slug} — Payment Proof`,
                                          })}
                                          className="cursor-pointer text-[11px] text-dim hover:text-ivory flex items-center gap-1"
                                        >
                                          <Eye size={13} /> View
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setPaymentProofs((prev) => {
                                              const copy = { ...prev };
                                              delete copy[slug];
                                              return copy;
                                            });
                                          }}
                                          className="cursor-pointer text-[11px] text-neon hover:underline flex items-center gap-1 ml-1"
                                        >
                                          <Trash2 size={13} /> Remove
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <label className="hud-border group flex cursor-pointer flex-col items-center justify-center border-dashed border-white/20 bg-void/60 p-4 transition-colors hover:border-neon/60 hover:bg-neon/5">
                                      <input
                                        type="file"
                                        accept="image/png, image/jpeg, image/jpg, image/webp"
                                        className="hidden"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) handleProofUpload(slug, file);
                                        }}
                                      />
                                      <Upload size={20} className="text-neon transition-transform group-hover:scale-110" />
                                      <p className="font-grotesk mt-2 text-[11px] font-bold tracking-wider text-ivory uppercase">
                                        Attach Payment Screenshot
                                      </p>
                                      <p className="font-grotesk mt-0.5 text-[10px] text-faint text-center">
                                        PNG, JPG, WebP up to 5MB · Receipt showing 12-digit UTR & amount
                                      </p>
                                    </label>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {hasPayable && (
                  <div className="hud-border glass mt-6 border-amber-500/30 bg-amber-500/10 p-4">
                    <div className="flex items-start gap-3">
                      <ShieldAlert size={20} className="shrink-0 text-amber-400 mt-0.5" />
                      <div>
                        <p className="font-grotesk text-[11px] font-bold tracking-widest text-amber-300 uppercase">
                          🔒 ANTI-FRAUD VERIFICATION ACTIVE
                        </p>
                        <p className="font-grotesk mt-1 text-[11.5px] leading-relaxed text-steel">
                          Every payable arena requires a <strong>genuine 12-digit UPI Reference / UTR number</strong> and an <strong>uploaded payment screenshot receipt</strong>. Duplicate reference numbers and dummy test IDs are rejected by the system. Student coordinators will verify all UTRs against their bank and UPI apps.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {paymentError && (
                  <p className="mt-4 flex items-center gap-2 text-[13px] text-neon" role="alert">
                    <AlertCircle size={16} className="shrink-0" /> {paymentError}
                  </p>
                )}
              </div>
            );
          })()}

          {/* ── STEP 6: Review & Confirm ── */}
          {step === 6 && (
            <div>
              <h2 className="font-display text-xl font-bold text-ivory sm:text-2xl">Review and confirm</h2>
              <p className="mt-1 text-sm text-dim">Verify your dossier and payment receipts before entering the registry.</p>

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

              {/* Payment Summary in Review step */}
              {picked.some((s) => s in EVENT_PAYMENT_QR) && (
                <div className="mt-6">
                  <p className="font-grotesk text-[11px] font-bold tracking-[0.25em] text-neon uppercase">
                    💳 Verified UPI Payments & Receipts
                  </p>
                  <div className="mt-2 divide-y divide-white/10 rounded-sm border border-white/10 bg-panel/60">
                    {picked
                      .filter((s) => s in EVENT_PAYMENT_QR)
                      .map((slug) => {
                        const qr = EVENT_PAYMENT_QR[slug];
                        const ev = events.find((e) => e.slug === slug);
                        const txn = transactionIds[slug];
                        const proof = paymentProofs[slug];
                        return (
                          <div key={slug} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-[13.5px] font-bold text-ivory">{ev?.name || slug}</p>
                              <p className="font-grotesk text-[11px] text-dim">
                                Paid to: <span className="text-steel">{qr.coordinatorName}</span> ({qr.upiId}) · <span className="text-neon">{ev?.fee}</span>
                              </p>
                              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                <span className="font-mono text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2.5 py-0.5 rounded">
                                  UTR: {txn}
                                </span>
                                <span className="font-grotesk text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded uppercase">
                                  Coordinator Verification Pending
                                </span>
                              </div>
                            </div>
                            {proof && (
                              <button
                                type="button"
                                onClick={() => setSelectedProofModal({ src: proof.dataUrl, title: `${ev?.name || slug} — Payment Receipt` })}
                                className="flex items-center gap-2 rounded border border-white/15 bg-black/40 p-2 cursor-pointer hover:border-emerald-500/50"
                                title="Click to view full screenshot"
                              >
                                <img src={proof.dataUrl} alt="Receipt thumbnail" className="h-10 w-10 object-cover rounded" />
                                <span className="text-[11px] text-dim hover:text-ivory flex items-center gap-1">
                                  <Eye size={12} /> View Proof
                                </span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              <label className="mt-5 flex cursor-pointer items-start gap-3 text-[13.5px] text-dim">
                <input type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-neon" {...register('agree_rules')} />
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

          {step === 7 && success && (
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

                  {/* Attachment Guidance Notice */}
                  {Object.keys(paymentProofs).length > 0 && (
                    <div className="mt-4 rounded-xs border border-amber-500/40 bg-amber-500/10 p-3.5 text-left">
                      <div className="flex items-start gap-2.5">
                        <Paperclip size={16} className="mt-0.5 shrink-0 text-amber-400" />
                        <div>
                          <p className="font-grotesk text-[11px] font-bold tracking-wide text-amber-300 uppercase">
                            Attach Your Payment Screenshot in WhatsApp
                          </p>
                          <p className="font-grotesk mt-0.5 text-[11.5px] leading-relaxed text-dim">
                            WhatsApp web links automatically load your text details, but cannot auto-attach image files. Please tap <strong className="text-ivory">📎 (attach)</strong> in your WhatsApp chat and attach your payment receipt before hitting send.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 space-y-2.5">
                    {success.event_slugs.map((slug) => {
                      const dispatch = buildRegistrationWhatsAppUrl(slug, {
                        player_tag: success.player_tag,
                        transaction_id: transactionIds[slug],
                        ...success.formData,
                      });
                      if (!dispatch) return null;
                      const proof = paymentProofs[slug];

                      return (
                        <div
                          key={slug}
                          className="border border-emerald-500/40 bg-emerald-500/10 p-3.5 transition-all hover:border-emerald-400"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="font-grotesk text-[10px] font-bold tracking-[0.18em] text-[#25D366] uppercase">
                                {dispatch.eventName} Coordinator
                              </p>
                              <p className="font-grotesk mt-0.5 text-[12px] font-semibold text-ivory">
                                📱 +91 {dispatch.displayPhone}
                              </p>
                              {transactionIds[slug] && (
                                <p className="font-mono text-[10.5px] text-emerald-400 mt-0.5">
                                  UTR: {transactionIds[slug]}
                                </p>
                              )}
                              {dispatch.receiptUrl && (
                                <p className="font-grotesk text-[9.5px] text-emerald-400/90 mt-1">
                                  ✓ Screenshot Link Embedded in WhatsApp Text
                                </p>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              {canShareFile && proof && (
                                <button
                                  type="button"
                                  onClick={() => handleShareWithReceipt(slug, dispatch)}
                                  className="font-grotesk inline-flex cursor-pointer items-center gap-1.5 bg-[#25D366] px-3.5 py-1.5 text-[11px] font-bold tracking-wider text-black uppercase transition-transform hover:scale-105 shadow-[0_0_12px_rgba(37,211,102,0.35)]"
                                  title="Directly attaches receipt screenshot in WhatsApp"
                                >
                                  <Share2 size={12} /> Share + Receipt
                                </button>
                              )}
                              <a
                                href={dispatch.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`font-grotesk inline-flex shrink-0 items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold tracking-wider uppercase transition-transform hover:scale-105 ${
                                  canShareFile && proof
                                    ? 'border border-emerald-400/50 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-500/20'
                                    : 'bg-[#25D366] text-black shadow-[0_0_12px_rgba(37,211,102,0.35)]'
                                }`}
                              >
                                <Send size={12} /> Open WhatsApp
                              </a>
                            </div>
                          </div>

                          {proof && (
                            <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2.5">
                              <button
                                type="button"
                                onClick={() => setSelectedProofModal({ src: proof.dataUrl, title: `${dispatch.eventName} — Payment Receipt` })}
                                className="inline-flex cursor-pointer items-center gap-1.5 font-grotesk text-[10.5px] font-medium text-dim transition-colors hover:text-ivory"
                              >
                                <img src={proof.dataUrl} alt="Thumbnail" className="h-6 w-6 rounded border border-white/20 object-cover" />
                                <span>View Receipt</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const a = document.createElement('a');
                                  a.href = proof.dataUrl;
                                  a.download = `payment-receipt-${slug}.jpg`;
                                  a.click();
                                }}
                                className="inline-flex cursor-pointer items-center gap-1 font-grotesk text-[10.5px] font-semibold text-emerald-400 transition-colors hover:text-emerald-300"
                              >
                                <Download size={11} /> Save Image
                              </button>
                            </div>
                          )}
                        </div>
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
                          const d = buildRegistrationWhatsAppUrl(slug, {
                            player_tag: success.player_tag,
                            transaction_id: transactionIds[slug],
                            ...success.formData,
                          });
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

      {step < 7 && (
        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={back}
            disabled={step === 0 || verifyingPayments}
            className="font-grotesk inline-flex cursor-pointer items-center justify-center gap-2 border border-white/15 px-7 py-3.5 text-[12px] font-bold tracking-[0.2em] text-dim uppercase transition-colors hover:text-ivory disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronLeft size={16} /> Back
          </button>
          {step < 6 ? (
            <button
              type="button"
              onClick={next}
              disabled={verifyingPayments}
              className="clip-btn font-grotesk inline-flex cursor-pointer items-center justify-center gap-2 bg-neon px-8 py-3.5 text-[12px] font-bold tracking-[0.2em] text-white uppercase hover:bg-crimson disabled:opacity-50"
            >
              {verifyingPayments ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Verifying UTR...
                </>
              ) : (
                <>
                  Continue <ChevronRight size={16} />
                </>
              )}
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

      {/* Screenshot Preview Modal */}
      {selectedProofModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
          <div className="hud-border relative max-h-[92vh] max-w-lg w-full bg-void p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <p className="font-grotesk text-[12px] font-bold text-ivory uppercase tracking-wider">
                {selectedProofModal.title}
              </p>
              <button
                type="button"
                onClick={() => setSelectedProofModal(null)}
                className="cursor-pointer text-dim hover:text-white p-1"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>
            <div className="mt-4 max-h-[70vh] overflow-auto flex items-center justify-center bg-black/60 rounded p-2">
              <img
                src={selectedProofModal.src}
                alt="Payment Receipt Large"
                className="max-h-[66vh] w-auto object-contain rounded"
              />
            </div>
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setSelectedProofModal(null)}
                className="font-grotesk border border-white/20 px-6 py-2 text-[11px] font-bold text-ivory uppercase tracking-wider hover:bg-white/10 cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
