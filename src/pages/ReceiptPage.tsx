import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ShieldCheck, CheckCircle2, Download, ExternalLink,
  Copy, Check, Clock, AlertTriangle, Eye, Printer, MessageCircle,
  FileCheck2, IndianRupee, ZoomIn, X, Upload
} from 'lucide-react';
import { EVENT_WHATSAPP_HANDLERS, EVENT_CREW } from '../data/content';
import { OFFICIAL_EVENTS } from '../data/eventsData';

export default function ReceiptPage() {
  const [params] = useSearchParams();
  const tag = (params.get('tag') || '').trim();
  const slug = (params.get('slug') || '').trim();
  const txn = (params.get('txn') || params.get('id') || '').trim();

  const [copied, setCopied] = useState(false);
  const [copiedTxn, setCopiedTxn] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [receiptData, setReceiptData] = useState<{
    player_tag: string;
    full_name?: string;
    event_slug?: string;
    event_name?: string;
    transaction_id?: string;
    proof_name?: string;
    proof_data?: string;
    college?: string;
    department?: string;
    phone?: string;
    timestamp?: string;
  } | null>(null);

  useEffect(() => {
    // 1. Check local browser storage (instant match for registrant)
    let found = false;
    try {
      if (tag) {
        const stored = localStorage.getItem(`intelletto_receipt_${tag}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          const payment = (parsed.paymentDetails || []).find((p: any) => !slug || p.event_slug === slug) || parsed.paymentDetails?.[0];
          setReceiptData({
            player_tag: parsed.player_tag || tag,
            full_name: parsed.full_name || parsed.formData?.full_name,
            event_slug: payment?.event_slug || slug,
            event_name: payment?.event_name,
            transaction_id: payment?.transaction_id || txn,
            proof_name: payment?.proof_name,
            proof_data: payment?.proof_data,
            college: parsed.formData?.college,
            department: parsed.formData?.department,
            phone: parsed.formData?.phone,
            timestamp: parsed.timestamp,
          });
          found = true;
        }
      }

      if (!found && txn) {
        const storedTxn = localStorage.getItem(`intelletto_receipt_txn_${txn}`);
        if (storedTxn) {
          const parsed = JSON.parse(storedTxn);
          const payment = (parsed.paymentDetails || []).find((p: any) => p.transaction_id === txn) || parsed.paymentDetails?.[0];
          setReceiptData({
            player_tag: parsed.player_tag || tag,
            full_name: parsed.full_name || parsed.formData?.full_name,
            event_slug: payment?.event_slug || slug,
            event_name: payment?.event_name,
            transaction_id: payment?.transaction_id || txn,
            proof_name: payment?.proof_name,
            proof_data: payment?.proof_data,
            college: parsed.formData?.college,
            department: parsed.formData?.department,
            phone: parsed.formData?.phone,
            timestamp: parsed.timestamp,
          });
          found = true;
        }
      }

      if (!found) {
        const latest = localStorage.getItem('intelletto_latest_receipt');
        if (latest) {
          const parsed = JSON.parse(latest);
          if (!tag || parsed.player_tag?.toUpperCase() === tag.toUpperCase()) {
            const payment = (parsed.paymentDetails || []).find((p: any) => !slug || p.event_slug === slug) || parsed.paymentDetails?.[0];
            setReceiptData({
              player_tag: parsed.player_tag || tag,
              full_name: parsed.full_name || parsed.formData?.full_name,
              event_slug: payment?.event_slug || slug,
              event_name: payment?.event_name,
              transaction_id: payment?.transaction_id || txn,
              proof_name: payment?.proof_name,
              proof_data: payment?.proof_data,
              college: parsed.formData?.college,
              department: parsed.formData?.department,
              phone: parsed.formData?.phone,
              timestamp: parsed.timestamp,
            });
            found = true;
          }
        }
      }
    } catch (e) {
      console.warn('Error reading from localStorage:', e);
    }

    // If proof found locally, sync to cloud in background so other devices (mobile) can see it!
    if (found && receiptData?.proof_data) {
      fetch('/api/receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_tag: receiptData.player_tag || tag,
          full_name: receiptData.full_name,
          college: receiptData.college,
          department: receiptData.department,
          event_slug: receiptData.event_slug || slug,
          event_name: receiptData.event_name,
          transaction_id: receiptData.transaction_id || txn,
          proof_name: receiptData.proof_name,
          proof_data: receiptData.proof_data,
        }),
      }).catch(() => {});
    }

    // 2. Fetch from backend JSON API (crucial for mobile devices or external viewers)
    if (!receiptData?.proof_data) {
      fetch(`/api/receipt?tag=${encodeURIComponent(tag)}&slug=${encodeURIComponent(slug)}&txn=${encodeURIComponent(txn)}&format=json`)
        .then((res) => {
          if (!res.ok) throw new Error('API unavailable');
          return res.json();
        })
        .then((data) => {
          if (data && data.proof_data) {
            setReceiptData((prev) => ({
              ...prev,
              ...data,
            }));
            // Cache on this device (mobile) so subsequent views are instant!
            try {
              localStorage.setItem(`intelletto_receipt_${data.player_tag}`, JSON.stringify({
                player_tag: data.player_tag,
                full_name: data.full_name,
                paymentDetails: [{
                  event_slug: data.event_slug,
                  event_name: data.event_name,
                  transaction_id: data.transaction_id,
                  proof_data: data.proof_data,
                  proof_name: data.proof_name,
                }],
              }));
            } catch {}
          }
        })
        .catch(() => {
          // Graceful fallback to query params
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [tag, slug, txn, receiptData?.proof_data]);

  const targetSlug = slug || receiptData?.event_slug || 'prompt-clash';
  const eventInfo = OFFICIAL_EVENTS.find((e) => e.slug === targetSlug);
  const eventName = receiptData?.event_name || eventInfo?.name || EVENT_WHATSAPP_HANDLERS[targetSlug]?.event || 'Arena Event';
  const handler = EVENT_WHATSAPP_HANDLERS[targetSlug];
  const crew = EVENT_CREW[targetSlug];

  const displayTag = tag || receiptData?.player_tag || 'IN26-REG';
  const displayTxn = txn || receiptData?.transaction_id || '12-Digit Reference';

  const copyTag = () => {
    navigator.clipboard?.writeText(displayTag);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyTxn = () => {
    navigator.clipboard?.writeText(displayTxn);
    setCopiedTxn(true);
    setTimeout(() => setCopiedTxn(false), 2000);
  };

  const downloadScreenshot = () => {
    if (!receiptData?.proof_data) return;
    const a = document.createElement('a');
    a.href = receiptData.proof_data;
    a.download = `receipt-${displayTag}-${targetSlug}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDeviceUpload = (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 1200;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) { h = Math.round((h * maxDim) / w); w = maxDim; }
          else { w = Math.round((w * maxDim) / h); h = maxDim; }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setReceiptData((prev) => ({
            ...prev,
            player_tag: displayTag,
            event_slug: targetSlug,
            event_name: eventName,
            transaction_id: displayTxn,
            proof_data: dataUrl,
          }));

          // Cache locally on this device
          try {
            localStorage.setItem(`intelletto_receipt_${displayTag}`, JSON.stringify({
              player_tag: displayTag,
              paymentDetails: [{
                event_slug: targetSlug,
                event_name: eventName,
                transaction_id: displayTxn,
                proof_data: dataUrl,
              }],
            }));
          } catch {}

          // Sync to TiDB Cloud
          fetch('/api/receipt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              player_tag: displayTag,
              event_slug: targetSlug,
              event_name: eventName,
              transaction_id: displayTxn,
              proof_data: dataUrl,
            }),
          }).catch(() => {});
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="relative min-h-screen overflow-hidden pt-28 pb-24 md:pt-32">
      {/* Background Ambience */}
      <div className="bg-arena-grid absolute inset-0 opacity-50" aria-hidden="true" />
      <div className="absolute -top-20 left-1/2 h-[380px] w-[720px] -translate-x-1/2 rounded-full bg-neon/10 blur-[150px]" aria-hidden="true" />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link to="/" className="font-grotesk inline-flex items-center gap-2 text-[12px] tracking-[0.25em] text-dim uppercase hover:text-neon transition-colors">
            <ArrowLeft size={15} /> Back to Portal
          </Link>
          <span className="font-grotesk flex items-center gap-2 text-[11px] tracking-[0.2em] text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> OFFICIAL AUDIT PORTAL
          </span>
        </div>

        {/* Title Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mt-8 text-center sm:text-left">
          <p className="font-grotesk flex items-center justify-center sm:justify-start gap-3 text-[11px] font-semibold tracking-[0.4em] text-neon">
            <span className="inline-block h-px w-10 bg-neon" aria-hidden="true" />
            PAYMENT PROOF VERIFICATION
          </p>
          <h1 className="font-display mt-3 text-3xl font-black text-ivory sm:text-4xl">
            Arena Registration <span className="text-neon text-glow-pink">Receipt.</span>
          </h1>
          <p className="mt-2 text-[14px] text-dim max-w-2xl">
            Official payment verification protocol for INTELLETTO-26. Organizers verify all UPI Reference numbers and attached bank screenshots.
          </p>
        </motion.div>

        {/* Main Content Grid */}
        <div className="mt-8 grid gap-8 lg:grid-cols-12">
          {/* Left Column: Dossier Details */}
          <div className="space-y-6 lg:col-span-5">
            {/* Player Tag & Status Card */}
            <div className="hud-border bg-abyss/90 p-6 relative overflow-hidden backdrop-blur-md">
              <div className="absolute top-0 right-0 h-24 w-24 bg-neon/10 rounded-full blur-2xl pointer-events-none" />

              <p className="font-grotesk text-[10.5px] uppercase tracking-[0.3em] text-faint">Assigned Player Tag</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="font-mono text-3xl font-black text-neon tracking-wider">{displayTag}</span>
                <button
                  type="button"
                  onClick={copyTag}
                  className="flex items-center gap-1.5 text-[11px] font-grotesk text-dim hover:text-ivory px-2.5 py-1.5 rounded bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
                >
                  {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>

              <div className="mt-6 pt-5 border-t border-white/10 space-y-4">
                <div>
                  <p className="font-grotesk text-[10px] uppercase tracking-[0.25em] text-faint">Arena Entry</p>
                  <p className="font-display text-lg font-bold text-ivory mt-0.5">{eventName}</p>
                </div>

                <div>
                  <p className="font-grotesk text-[10px] uppercase tracking-[0.25em] text-faint">Status</p>
                  <div className="mt-1 flex items-center gap-2 text-amber-400 text-xs font-grotesk font-semibold">
                    <Clock size={14} className="animate-spin" />
                    <span>Payment Pending Verification</span>
                  </div>
                </div>

                {receiptData?.full_name && (
                  <div>
                    <p className="font-grotesk text-[10px] uppercase tracking-[0.25em] text-faint">Player Name</p>
                    <p className="font-sans text-sm font-semibold text-ivory mt-0.5">{receiptData.full_name}</p>
                  </div>
                )}

                {receiptData?.college && (
                  <div>
                    <p className="font-grotesk text-[10px] uppercase tracking-[0.25em] text-faint">Institution</p>
                    <p className="font-sans text-xs text-dim mt-0.5">{receiptData.college} · {receiptData.department || ''}</p>
                  </div>
                )}
              </div>
            </div>

            {/* UTR Reference Box */}
            <div className="hud-border bg-panel/80 p-5 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <p className="font-grotesk text-[10.5px] uppercase tracking-[0.25em] text-neon flex items-center gap-2">
                  <ShieldCheck size={14} /> 12-Digit UPI Reference (UTR)
                </p>
                <button
                  type="button"
                  onClick={copyTxn}
                  className="text-faint hover:text-ivory transition-colors"
                  title="Copy UTR"
                >
                  {copiedTxn ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                </button>
              </div>
              <p className="font-mono text-xl font-bold text-ivory tracking-widest mt-2 bg-void/80 px-3 py-2 rounded border border-white/5 select-all">
                {displayTxn}
              </p>
              <p className="text-[11.5px] text-faint mt-2">
                This transaction reference will be verified against the official department bank statement before slot confirmation.
              </p>
            </div>

            {/* Coordinator Assistance */}
            {handler && (
              <div className="hud-border bg-void/60 p-5">
                <p className="font-grotesk text-[10.5px] uppercase tracking-[0.25em] text-faint">Assigned Coordinator</p>
                <div className="mt-2 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-ivory">{crew?.coordinators?.[0] || 'Arena Coordinator'}</p>
                    <p className="text-xs text-dim">{handler.displayPhone}</p>
                  </div>
                  <a
                    href={`https://wa.me/${handler.phone}?text=${encodeURIComponent(`Hello Coordinator, inquiry regarding INTELLETTO-26 Player Tag: ${displayTag} for ${eventName}. UTR: ${displayTxn}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-grotesk font-semibold hover:bg-emerald-500/30 transition-colors"
                  >
                    <MessageCircle size={14} /> WhatsApp
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Screenshot Viewer */}
          <div className="lg:col-span-7">
            <div className="hud-border bg-abyss/90 p-6 backdrop-blur-md">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <FileCheck2 className="text-neon" size={18} />
                  <span className="font-grotesk text-xs uppercase tracking-[0.25em] text-ivory font-bold">
                    Attached Payment Screenshot
                  </span>
                </div>
                {receiptData?.proof_data && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setZoomOpen(true)}
                      className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-dim hover:text-ivory transition-colors"
                      title="Enlarge Screenshot"
                    >
                      <ZoomIn size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={downloadScreenshot}
                      className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-dim hover:text-ivory transition-colors"
                      title="Download Image"
                    >
                      <Download size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-dim hover:text-ivory transition-colors"
                      title="Print Proof"
                    >
                      <Printer size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Image / Fallback Container */}
              <div className="mt-5">
                {receiptData?.proof_data ? (
                  <div className="relative group rounded-lg overflow-hidden border border-white/10 bg-void flex items-center justify-center min-h-[380px] max-h-[580px]">
                    <img
                      src={receiptData.proof_data}
                      alt={`Payment Receipt Proof for ${displayTag}`}
                      className="w-full h-auto max-h-[580px] object-contain cursor-pointer transition-transform duration-300 group-hover:scale-[1.01]"
                      onClick={() => setZoomOpen(true)}
                    />
                    <div
                      onClick={() => setZoomOpen(true)}
                      className="absolute inset-0 bg-void/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer pointer-events-none"
                    >
                      <span className="bg-abyss/90 border border-white/20 text-ivory px-4 py-2 rounded-full text-xs font-grotesk tracking-wider flex items-center gap-2 shadow-xl">
                        <ZoomIn size={14} className="text-neon" /> Click to enlarge full screen
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-white/15 bg-void/50 p-8 text-center min-h-[360px] flex flex-col items-center justify-center">
                    <div className="h-14 w-14 rounded-full bg-neon/10 flex items-center justify-center text-neon mb-4">
                      <FileCheck2 size={28} />
                    </div>
                    <p className="font-grotesk text-sm font-bold text-ivory uppercase tracking-wider">
                      Payment Screenshot Registered
                    </p>
                    <p className="text-xs text-dim max-w-md mt-2 leading-relaxed">
                      The payment screenshot for Player Tag <span className="text-neon font-mono">{displayTag}</span> was saved during registration.
                    </p>
                    <div className="mt-5 p-3 rounded bg-white/5 border border-white/10 max-w-sm w-full text-left text-xs">
                      <p className="font-grotesk text-[10px] tracking-wider text-faint uppercase">Transaction Verification</p>
                      <p className="font-mono text-neon font-bold mt-1">UTR: {displayTxn}</p>
                      <p className="text-[11px] text-dim mt-1">Status: Pending Coordinator Statement Match</p>
                    </div>
                    {handler && (
                      <a
                        href={`https://wa.me/${handler.phone}?text=${encodeURIComponent(`Hello Coordinator, here is my payment screenshot for INTELLETTO-26.\nArena: ${eventName}\nPlayer Tag: ${displayTag}\nUTR: ${displayTxn}`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded bg-neon text-abyss font-grotesk text-xs font-bold tracking-wider hover:opacity-90 transition-opacity"
                      >
                        <MessageCircle size={15} /> Send Screenshot Directly via WhatsApp
                      </a>
                    )}
                    <label className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded bg-white/10 text-ivory border border-white/20 font-grotesk text-xs font-semibold tracking-wider hover:bg-white/20 cursor-pointer transition-colors">
                      <Upload size={14} className="text-neon" /> Upload Screenshot from this Phone
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleDeviceUpload(file);
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Bottom Verification Note */}
              <div className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-[11px] text-faint gap-3">
                <span className="flex items-center gap-1.5 text-dim">
                  <ShieldCheck size={14} className="text-emerald-400" />
                  Anti-Fraud System Active · Department of AI & ML
                </span>
                <span className="font-mono">
                  {receiptData?.timestamp ? new Date(receiptData.timestamp).toLocaleDateString() : 'INTELLETTO-26'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full-Screen Zoom Lightbox Modal */}
      <AnimatePresence>
        {zoomOpen && receiptData?.proof_data && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
            onClick={() => setZoomOpen(false)}
          >
            <button
              type="button"
              onClick={() => setZoomOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
              title="Close Full Screen"
            >
              <X size={20} />
            </button>
            <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
              <img
                src={receiptData.proof_data}
                alt="Enlarged Payment Screenshot"
                className="max-w-full max-h-[82vh] object-contain rounded-lg shadow-2xl border border-white/20"
              />
              <div className="mt-4 flex items-center gap-4 text-xs font-grotesk tracking-wider">
                <button
                  type="button"
                  onClick={downloadScreenshot}
                  className="px-4 py-2 rounded bg-neon text-abyss font-bold flex items-center gap-2 hover:opacity-90"
                >
                  <Download size={14} /> Download Image
                </button>
                <button
                  type="button"
                  onClick={() => setZoomOpen(false)}
                  className="px-4 py-2 rounded bg-white/10 text-ivory hover:bg-white/20"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
