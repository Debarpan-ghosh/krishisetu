import React, { useState, useEffect, useRef, useCallback } from "react";
import { api } from "./api.js";
import {
  Mic, MapPin, ShieldCheck, Truck, QrCode, Leaf, Wallet, ChevronRight,
  Search, CheckCircle2, Sprout, ArrowRight, ArrowUp, ArrowDown,
  Globe2, Package, ShoppingCart, ArrowLeft, Loader2, BadgeCheck,
} from "lucide-react";

/* ============================================================
   KRISHISETU — Design tokens
   Soil-board aesthetic: dark earth surfaces, warm paper panels,
   turmeric + leaf accents, brick-red for trust/escrow moments.
   Signature element: the "Mandi Board" ticker — a nod to the
   physical rate-boards farmers already read at market gates,
   turned into the app's price-transparency thesis.
   ============================================================ */
const THEME = {
  soil: "#1E160C",
  soil2: "#2A2013",
  soil3: "#382B18",
  paper: "#F4ECD8",
  paper2: "#EBDFC0",
  ink: "#3f2d17",
  leaf: "#4B7A3D",
  leafDark: "#365B2C",
  leafLight: "#8DB279",
  turmeric: "#E2A33B",
  turmericDark: "#B97F24",
  brick: "#A8451F",
  brickLight: "#C96C46",
  cream: "#F4ECD8",
};

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700;9..144,900&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');`;

const GlobalStyle = () => (
  <style>{`
    ${FONT_IMPORT}
    .ks-root { font-family: 'IBM Plex Sans', sans-serif; color: ${THEME.ink}; }
    .ks-display { font-family: 'Fraunces', serif; }
    .ks-mono { font-family: 'IBM Plex Mono', monospace; }
    .ks-ticker-track { animation: ks-scroll 26s linear infinite; }
    .ks-ticker-track:hover { animation-play-state: paused; }
    @keyframes ks-scroll {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    @media (prefers-reduced-motion: reduce) {
      .ks-ticker-track { animation: none; }
    }
    .ks-focus:focus-visible {
      outline: 2px solid ${THEME.turmeric};
      outline-offset: 2px;
    }
    .ks-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
    .ks-scrollbar::-webkit-scrollbar-thumb { background: ${THEME.paper2}; border-radius: 999px; }
    .ks-pulse-ring {
      box-shadow: 0 0 0 0 rgba(226,163,59,0.55);
      animation: ks-pulse 1.6s cubic-bezier(0.4,0,0.6,1) infinite;
    }
    @keyframes ks-pulse {
      0% { box-shadow: 0 0 0 0 rgba(226,163,59,0.5); }
      70% { box-shadow: 0 0 0 18px rgba(226,163,59,0); }
      100% { box-shadow: 0 0 0 0 rgba(226,163,59,0); }
    }
    .ks-wave span {
      display: inline-block; width: 3px; margin: 0 2px; border-radius: 2px;
      background: ${THEME.turmeric}; animation: ks-wave 1s ease-in-out infinite;
    }
    .ks-wave span:nth-child(2){animation-delay:0.1s}
    .ks-wave span:nth-child(3){animation-delay:0.2s}
    .ks-wave span:nth-child(4){animation-delay:0.3s}
    .ks-wave span:nth-child(5){animation-delay:0.4s}
    @keyframes ks-wave { 0%,100%{height:6px} 50%{height:26px} }
  `}</style>
);

/* ---------------- Mock data ---------------- */
const TICKER = [
  { name: "Tomato", price: 18, dir: "up" },
  { name: "Onion", price: 22, dir: "down" },
  { name: "Potato", price: 15, dir: "flat" },
  { name: "Cauliflower", price: 25, dir: "up" },
  { name: "Brinjal", price: 20, dir: "down" },
  { name: "Spinach", price: 12, dir: "up" },
  { name: "Mango", price: 60, dir: "up" },
  { name: "Paddy (Rice)", price: 21, dir: "flat" },
];

const STATS = [
  { value: "74.8%", label: "rural smartphone household ownership" },
  { value: "2.12L+", label: "Gram Panchayats on BharatNet broadband" },
  { value: "215%", label: "surge in Agri-FoodTech investment" },
  { value: "0%", label: "commission charged to farmers" },
];

const LANGUAGES = [
  { code: "bn", label: "বাংলা", name: "Bengali", sample: "আজকে ২০০ কেজি টমেটোর দাম কত?" },
  { code: "hi", label: "हिंदी", name: "Hindi", sample: "आज 200 किलो टमाटर का भाव क्या है?" },
  { code: "mr", label: "मराठी", name: "Marathi", sample: "आज 200 किलो टोमॅटोचा भाव काय आहे?" },
];

const SEED_LISTINGS = [
  { id: 1, crop: "Tomato", emoji: "🍅", farmer: "Abir Mondal", village: "Hooghly, WB", qty: 180, price: 17, distance: "6 km", freshness: "Harvested today" },
  { id: 2, crop: "Potato", emoji: "🥔", farmer: "Sunita Devi", village: "Nadia, WB", qty: 320, price: 14, distance: "11 km", freshness: "Harvested yesterday" },
  { id: 3, crop: "Cauliflower", emoji: "🥦", farmer: "Rakesh Sharma", village: "Bardhaman, WB", qty: 90, price: 24, distance: "9 km", freshness: "Harvested today" },
  { id: 4, crop: "Brinjal", emoji: "🍆", farmer: "Meena Roy", village: "Hooghly, WB", qty: 140, price: 19, distance: "4 km", freshness: "Harvested today" },
];

const ORDER_STEPS = [
  { key: "placed", title: "Order placed", icon: Package, note: "Buyer confirms cart" },
  { key: "escrow", title: "Payment held in escrow", icon: Wallet, note: "Funds locked, not yet released" },
  { key: "accepted", title: "Farmer accepts & prepares", icon: Sprout, note: "Produce packed at farm-gate" },
  { key: "transit", title: "Cold-chain pickup & transit", icon: Truck, note: "Live GPS route to buyer" },
  { key: "delivered", title: "Delivered & QR verified", icon: QrCode, note: "Buyer scans to confirm quality" },
  { key: "released", title: "Funds released to farmer", icon: ShieldCheck, note: "Escrow settles instantly" },
];

/* ---------------- Small building blocks ---------------- */
function Pill({ children, tone = "paper" }) {
  const styles = {
    paper: { background: THEME.paper2, color: THEME.ink },
    leaf: { background: THEME.leaf, color: THEME.cream },
    turmeric: { background: THEME.turmeric, color: THEME.soil },
    brick: { background: THEME.brick, color: THEME.cream },
  }[tone];
  return (
    <span
      className="ks-mono inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium tracking-wide"
      style={styles}
    >
      {children}
    </span>
  );
}

function Button({ children, onClick, variant = "primary", className = "", icon: Icon, type = "button", disabled }) {
  const base = "ks-focus inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition-transform duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: { background: THEME.turmeric, color: THEME.soil },
    dark: { background: THEME.soil, color: THEME.paper },
    leaf: { background: THEME.leaf, color: THEME.cream },
    outline: { background: "transparent", color: THEME.ink, border: `1.5px solid ${THEME.ink}` },
    ghost: { background: "transparent", color: THEME.paper },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${className}`} style={variants[variant]}>
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
}

function SectionEyebrow({ children }) {
  return (
    <div className="ks-mono mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.2em]" style={{ color: THEME.leafDark }}>
      <span className="h-px w-8" style={{ background: THEME.leafDark }} />
      {children}
    </div>
  );
}

/* ---------------- Mandi ticker (signature element) ---------------- */
function MandiTicker() {
  const row = [...TICKER, ...TICKER];
  return (
    <div className="overflow-hidden border-y" style={{ background: THEME.soil2, borderColor: THEME.soil3 }}>
      <div className="flex items-center">
        <div className="ks-mono z-10 flex shrink-0 items-center gap-2 px-4 py-2 text-xs font-semibold" style={{ background: THEME.turmeric, color: THEME.soil }}>
          <Globe2 size={14} /> MANDI BOARD · LIVE
        </div>
        <div className="ks-scrollbar overflow-hidden">
          <div className="ks-ticker-track flex w-max items-center gap-8 whitespace-nowrap py-2 pl-8">
            {row.map((t, i) => (
              <div key={i} className="ks-mono flex items-center gap-2 text-sm" style={{ color: THEME.paper }}>
                <span className="opacity-70">{t.name}</span>
                <span className="font-semibold">₹{t.price}/kg</span>
                {t.dir === "up" && <ArrowUp size={13} style={{ color: THEME.leafLight }} />}
                {t.dir === "down" && <ArrowDown size={13} style={{ color: THEME.brickLight }} />}
                <span className="mx-2 opacity-30">|</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Nav ---------------- */
function NavBar({ view, setView }) {
  const items = [
    { key: "landing", label: "Home" },
    { key: "farmer", label: "Sell Produce" },
    { key: "marketplace", label: "Marketplace" },
    { key: "tracking", label: "Track Order" },
  ];
  return (
    <div className="sticky top-0 z-30" style={{ background: THEME.soil }}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <button onClick={() => setView("landing")} className="ks-focus flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: THEME.leaf }}>
            <Leaf size={18} color={THEME.cream} />
          </div>
          <span className="ks-display text-xl font-semibold" style={{ color: THEME.paper }}>KrishiSetu</span>
        </button>
        <nav className="hidden items-center gap-1 md:flex">
          {items.map((it) => (
            <button
              key={it.key}
              onClick={() => setView(it.key)}
              className="ks-focus rounded-md px-4 py-2 text-sm font-medium transition-colors"
              style={{
                color: view === it.key ? THEME.soil : THEME.paper,
                background: view === it.key ? THEME.turmeric : "transparent",
              }}
            >
              {it.label}
            </button>
          ))}
        </nav>
        <Button variant="leaf" icon={ArrowRight} onClick={() => setView("marketplace")} className="hidden sm:inline-flex">
          Browse Produce
        </Button>
      </div>
    </div>
  );
}

/* ---------------- Landing ---------------- */
function Landing({ setView }) {
  return (
    <div>
      <section className="px-6 pb-20 pt-16" style={{ background: THEME.soil }}>
        <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-2 md:items-center">
          <div>
            <SectionEyebrowDark>SIH26033 · Agri-Marketplace</SectionEyebrowDark>
            <h1 className="ks-display text-4xl font-semibold leading-tight sm:text-5xl" style={{ color: THEME.paper }}>
              Every rupee earned in the field, <span style={{ color: THEME.turmeric }}>straight to the farmer.</span>
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed" style={{ color: THEME.paper2 }}>
              KrishiSetu connects farmers directly to local buyers by voice — in Bengali, Hindi and Marathi —
              with prices set in the open and payments released only after verified delivery.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="primary" icon={Mic} onClick={() => setView("farmer")}>I&apos;m a Farmer — List Produce</Button>
              <Button variant="ghost" icon={ShoppingCart} onClick={() => setView("marketplace")}
                className="border" >
                <span style={{ border: `1.5px solid ${THEME.paper2}`, position: "absolute" }} />
                I&apos;m a Buyer — Browse Market
              </Button>
            </div>
            <div className="mt-8 flex items-center gap-4 text-xs" style={{ color: THEME.paper2 }}>
              <Pill tone="leaf"><ShieldCheck size={12} /> Escrow-secured</Pill>
              <Pill tone="turmeric"><Mic size={12} /> Voice-first</Pill>
              <Pill tone="paper"><Truck size={12} /> Cold-chain tracked</Pill>
            </div>
          </div>
          <HeroBoard />
        </div>
      </section>
      <MandiTicker />
      <section className="px-6 py-14" style={{ background: THEME.paper }}>
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="rounded-xl p-5" style={{ background: THEME.paper2 }}>
              <div className="ks-display text-3xl font-semibold" style={{ color: THEME.brick }}>{s.value}</div>
              <div className="mt-1 text-xs leading-snug" style={{ color: THEME.ink }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>
      <section className="px-6 py-16" style={{ background: THEME.paper2 }}>
        <div className="mx-auto max-w-6xl">
          <SectionEyebrow>How it removes the middlemen</SectionEyebrow>
          <h2 className="ks-display text-3xl font-semibold" style={{ color: THEME.ink }}>Three roles, one transparent chain</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              { icon: Mic, title: "Speak your listing", body: "A farmer taps the mic and says the crop, quantity and price in their own language — no typing required." },
              { icon: ShoppingCart, title: "Buyer orders directly", body: "Urban retailers and shoppers browse verified local listings and pay into escrow at checkout." },
              { icon: ShieldCheck, title: "Delivery releases funds", icon2: QrCode, body: "A QR scan on delivery confirms quality and instantly releases payment to the farmer's account." },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl p-6" style={{ background: THEME.paper }}>
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full" style={{ background: THEME.leaf }}>
                  <f.icon size={20} color={THEME.cream} />
                </div>
                <div className="ks-display text-lg font-semibold" style={{ color: THEME.ink }}>{f.title}</div>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: THEME.ink, opacity: 0.75 }}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionEyebrowDark({ children }) {
  return (
    <div className="ks-mono mb-4 flex items-center gap-2 text-xs uppercase tracking-[0.2em]" style={{ color: THEME.turmeric }}>
      <span className="h-px w-8" style={{ background: THEME.turmeric }} />
      {children}
    </div>
  );
}

function HeroBoard() {
  return (
    <div className="relative rounded-2xl p-6" style={{ background: THEME.soil2, border: `1px solid ${THEME.soil3}` }}>
      <div className="ks-mono mb-4 flex items-center justify-between text-xs" style={{ color: THEME.paper2 }}>
        <span>TODAY&apos;S RATE BOARD</span>
        <span className="flex items-center gap-1" style={{ color: THEME.leafLight }}>
          <span className="h-2 w-2 rounded-full" style={{ background: THEME.leafLight }} /> LIVE
        </span>
      </div>
      <div className="space-y-2">
        {TICKER.slice(0, 5).map((t) => (
          <div key={t.name} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: THEME.soil3 }}>
            <span className="text-sm" style={{ color: THEME.paper }}>{t.name}</span>
            <span className="ks-mono flex items-center gap-1 text-sm font-semibold" style={{ color: t.dir === "down" ? THEME.brickLight : THEME.leafLight }}>
              ₹{t.price}/kg {t.dir === "up" && <ArrowUp size={12} />}{t.dir === "down" && <ArrowDown size={12} />}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: THEME.turmeric }}>
        <BadgeCheck size={16} color={THEME.soil} />
        <span className="text-xs font-medium" style={{ color: THEME.soil }}>Prices sourced from local mandi data, refreshed daily.</span>
      </div>
    </div>
  );
}

/* ---------------- Farmer voice-listing flow ---------------- */
function FarmerFlow({ onPost }) {
  const [lang, setLang] = useState(LANGUAGES[0]);
  const [stage, setStage] = useState("idle"); // idle -> listening -> processing -> ready -> posted
  const [transcript, setTranscript] = useState("");
  const [listing, setListing] = useState(null);
  const [postError, setPostError] = useState(null);
  const timers = useRef([]);

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  useEffect(() => () => clearTimers(), []);

  const startRecording = () => {
    clearTimers();
    setStage("listening");
    setTranscript("");
    let i = 0;
    const full = lang.sample;
    const typeTimer = setInterval(() => {
      i += 1;
      setTranscript(full.slice(0, i));
      if (i >= full.length) clearInterval(typeTimer);
    }, 45);
    timers.current.push(typeTimer);

    timers.current.push(setTimeout(() => {
      setStage("processing");
    }, full.length * 45 + 400));

    timers.current.push(setTimeout(() => {
      setListing({
        crop: "Tomato",
        qty: 200,
        suggestedPrice: 18,
        village: "Hooghly, West Bengal",
      });
      setStage("ready");
    }, full.length * 45 + 1600));
  };

  const reset = () => { clearTimers(); setStage("idle"); setTranscript(""); setListing(null); };

  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <SectionEyebrow>Farmer · Voice-first listing</SectionEyebrow>
      <h1 className="ks-display text-3xl font-semibold" style={{ color: THEME.ink }}>Speak your produce onto the market</h1>
      <p className="mt-2 max-w-xl text-sm" style={{ color: THEME.ink, opacity: 0.7 }}>
        No typing, no forms. Choose your language and describe what you&apos;re selling — the assistant builds the listing for you.
      </p>

      <div className="mt-8 flex gap-2">
        {LANGUAGES.map((l) => (
          <button
            key={l.code}
            onClick={() => { setLang(l); reset(); }}
            className="ks-focus rounded-full px-4 py-2 text-sm font-medium transition-colors"
            style={{
              background: lang.code === l.code ? THEME.leaf : THEME.paper2,
              color: lang.code === l.code ? THEME.cream : THEME.ink,
            }}
          >
            {l.label} <span className="opacity-70">· {l.name}</span>
          </button>
        ))}
      </div>

      <div className="mt-8 rounded-2xl p-8" style={{ background: THEME.soil }}>
        <div className="flex flex-col items-center text-center">
          <button
            onClick={stage === "idle" || stage === "ready" ? startRecording : undefined}
            className={`ks-focus flex h-20 w-20 items-center justify-center rounded-full transition-transform active:scale-95 ${stage === "listening" ? "ks-pulse-ring" : ""}`}
            style={{ background: stage === "listening" ? THEME.brick : THEME.turmeric }}
            aria-label="Tap to speak your listing"
          >
            <Mic size={30} color={THEME.soil} />
          </button>

          <div className="mt-5 min-h-[1.5rem] text-sm font-medium" style={{ color: THEME.paper }}>
            {stage === "idle" && "Tap to speak your listing"}
            {stage === "listening" && `Listening in ${lang.name}…`}
            {stage === "processing" && "Converting speech to a structured listing…"}
            {(stage === "ready" || stage === "posted") && "Here&apos;s what I heard"}
          </div>

          {stage === "listening" && (
            <div className="ks-wave mt-4 flex h-8 items-end">
              <span /><span /><span /><span /><span />
            </div>
          )}

          {stage === "processing" && (
            <Loader2 className="mt-4 animate-spin" size={22} color={THEME.turmeric} />
          )}

          {transcript && (stage === "listening" || stage === "processing" || stage === "ready" || stage === "posted") && (
            <div className="ks-display mt-5 max-w-md rounded-lg px-4 py-3 text-lg" style={{ background: THEME.soil2, color: THEME.paper }}>
              &quot;{transcript}&quot;
            </div>
          )}
        </div>

        {listing && (stage === "ready" || stage === "posted") && (
          <div className="mt-6 rounded-xl p-5" style={{ background: THEME.paper }}>
            <div className="flex items-start justify-between">
              <div>
                <div className="ks-mono text-xs uppercase tracking-wide" style={{ color: THEME.leafDark }}>AI-drafted listing</div>
                <div className="ks-display mt-1 text-xl font-semibold" style={{ color: THEME.ink }}>🍅 {listing.crop} · {listing.qty} kg</div>
                <div className="mt-1 flex items-center gap-1 text-xs" style={{ color: THEME.ink, opacity: 0.7 }}>
                  <MapPin size={12} /> {listing.village}
                </div>
              </div>
              <div className="text-right">
                <div className="ks-mono text-2xl font-semibold" style={{ color: THEME.brick }}>₹{listing.suggestedPrice}<span className="text-sm">/kg</span></div>
                <div className="text-xs" style={{ color: THEME.ink, opacity: 0.6 }}>suggested from today&apos;s mandi rate</div>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              {stage === "ready" && (
                <>
                  <Button
                    variant="leaf"
                    icon={CheckCircle2}
                    onClick={async () => {
                      setPostError(null);
                      try {
                        await onPost(listing);
                        setStage("posted");
                      } catch (err) {
                        setPostError(err.message || "Could not publish listing. Is the backend running?");
                      }
                    }}
                  >
                    Post to marketplace
                  </Button>
                  <Button variant="outline" onClick={reset}>Re-record</Button>
                </>
              )}
              {stage === "posted" && (
                <Pill tone="leaf"><CheckCircle2 size={14} /> Live on the marketplace now</Pill>
              )}
              {postError && (
                <div className="w-full rounded-lg px-4 py-2 text-xs" style={{ background: THEME.brick, color: THEME.cream }}>
                  {postError}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- Marketplace ---------------- */
function ListingCard({ listing, onBuy, buying }) {
  const [qty, setQty] = useState(Math.min(10, listing.qty));

  // Reset the selected quantity whenever the listing's available stock
  // changes (e.g. after a purchase reduces it) — keeps it clamped to
  // whatever's still in stock, defaulting to a partial amount rather
  // than the whole batch.
  useEffect(() => {
    setQty((prev) => Math.min(prev, listing.qty) || Math.min(10, listing.qty));
  }, [listing.qty]);

  const clampQty = (val) => {
    const n = Number(val) || 1;
    return Math.max(1, Math.min(listing.qty, n));
  };

  return (
    <div className="flex flex-col rounded-2xl p-5" style={{ background: THEME.paper2 }}>
      <div className="flex items-start justify-between">
        <div className="text-3xl">{listing.emoji}</div>
        <Pill tone="leaf">{listing.freshness}</Pill>
      </div>
      <div className="ks-display mt-3 text-lg font-semibold" style={{ color: THEME.ink }}>{listing.crop}</div>
      <div className="mt-1 text-xs" style={{ color: THEME.ink, opacity: 0.7 }}>{listing.farmer} · {listing.village}</div>
      <div className="mt-1 flex items-center gap-1 text-xs" style={{ color: THEME.ink, opacity: 0.6 }}>
        <MapPin size={12} /> {listing.distance} away · {listing.qty} kg available
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="ks-mono text-xl font-semibold" style={{ color: THEME.brick }}>₹{listing.price}<span className="text-sm">/kg</span></div>
        <div className="ks-focus flex items-center rounded-lg" style={{ background: THEME.paper }}>
          <input
            type="number"
            min={1}
            max={listing.qty}
            value={qty}
            onChange={(e) => setQty(clampQty(e.target.value))}
            className="w-14 bg-transparent px-2 py-1 text-sm outline-none"
            style={{ color: THEME.ink }}
            aria-label={`Quantity of ${listing.crop} in kg`}
          />
          <span className="pr-2 text-xs" style={{ color: THEME.ink, opacity: 0.6 }}>kg</span>
        </div>
      </div>
      <Button
        variant="dark"
        icon={buying ? Loader2 : ShoppingCart}
        disabled={buying || listing.qty < 1}
        onClick={() => onBuy(listing, qty)}
        className="mt-3 w-full"
      >
        {buying ? "Placing order…" : listing.qty < 1 ? "Sold out" : `Buy ${qty} kg`}
      </Button>
    </div>
  );
}

function Marketplace({ listings, onBuy, loading, error }) {
  const [query, setQuery] = useState("");
  const [buyingId, setBuyingId] = useState(null);
  const [buyError, setBuyError] = useState(null);
  const filtered = listings.filter((l) => l.crop.toLowerCase().includes(query.toLowerCase()));

  const handleBuyClick = async (listing, quantity) => {
    setBuyingId(listing.id);
    setBuyError(null);
    try {
      await onBuy(listing, quantity);
    } catch (err) {
      setBuyError(err.message || "Could not place order. Is the backend running?");
    } finally {
      setBuyingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <SectionEyebrow>Marketplace · Farm-gate to your cart</SectionEyebrow>
          <h1 className="ks-display text-3xl font-semibold" style={{ color: THEME.ink }}>Fresh listings near you</h1>
        </div>
        <div className="ks-focus flex items-center gap-2 rounded-lg px-4 py-2" style={{ background: THEME.paper2 }}>
          <Search size={16} style={{ color: THEME.ink, opacity: 0.6 }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search produce…"
            className="bg-transparent text-sm outline-none"
            style={{ color: THEME.ink }}
          />
        </div>
      </div>

      {(error || buyError) && (
        <div className="mt-6 rounded-lg px-4 py-3 text-sm" style={{ background: THEME.brick, color: THEME.cream }}>
          {buyError || error}
        </div>
      )}

      {loading ? (
        <div className="mt-10 text-center text-sm" style={{ color: THEME.ink, opacity: 0.6 }}>
          Loading listings…
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((l) => (
            <ListingCard key={l.id} listing={l} onBuy={handleBuyClick} buying={buyingId === l.id} />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full rounded-2xl p-8 text-center text-sm" style={{ background: THEME.paper2, color: THEME.ink }}>
              No produce matches &quot;{query}&quot; right now.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------------- Order tracking / escrow ---------------- */
// Backend order states: escrow_locked -> in_transit -> qr_verified -> funds_released.
// A real order arrives already in escrow_locked, so the first two UI steps
// (placed, escrow) are shown as done immediately; only steps 2-5 trigger
// real API calls against that state machine.
function OrderTracking({ order, onBack }) {
  const [stepIndex, setStepIndex] = useState(order ? 2 : ORDER_STEPS.length - 1);
  const [advancing, setAdvancing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setStepIndex(order ? 2 : ORDER_STEPS.length - 1);
    setError(null);
  }, [order]);

  const advance = async () => {
    if (!order) return;
    setAdvancing(true);
    setError(null);
    try {
      if (stepIndex === 2) {
        await api.updateOrderStatus(order.id, { status: "in_transit" });
      } else if (stepIndex === 3) {
        await api.updateOrderStatus(order.id, {
          status: "qr_verified",
          qr_verification_code: order.qr_code,
        });
      } else if (stepIndex === 4) {
        await api.updateOrderStatus(order.id, {
          status: "funds_released",
          qr_verification_code: order.qr_code,
        });
      }
      setStepIndex((i) => Math.min(i + 1, ORDER_STEPS.length - 1));
    } catch (err) {
      setError(err.message || "Could not update order. Is the backend running?");
    } finally {
      setAdvancing(false);
    }
  };

  if (!order) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <Package size={36} className="mx-auto" style={{ color: THEME.leaf }} />
        <h2 className="ks-display mt-4 text-2xl font-semibold" style={{ color: THEME.ink }}>No active order yet</h2>
        <p className="mt-2 text-sm" style={{ color: THEME.ink, opacity: 0.7 }}>
          Buy something from the marketplace to see the escrow-to-delivery timeline in action.
        </p>
      </div>
    );
  }

  const done = stepIndex >= ORDER_STEPS.length - 1;

  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <button onClick={onBack} className="ks-focus mb-6 flex items-center gap-1 text-sm font-medium" style={{ color: THEME.leafDark }}>
        <ArrowLeft size={14} /> Back to marketplace
      </button>
      <SectionEyebrow>Order · Escrow protected</SectionEyebrow>
      <h1 className="ks-display text-3xl font-semibold" style={{ color: THEME.ink }}>
        {order.emoji} {order.quantity} kg {order.crop} from {order.farmer}
      </h1>
      <p className="mt-1 text-sm" style={{ color: THEME.ink, opacity: 0.7 }}>
        Total: <span className="ks-mono font-semibold">₹{order.total_amount}</span> · held in escrow until delivery is verified.
      </p>

      <div className="mt-8 rounded-2xl p-6" style={{ background: THEME.soil }}>
        <ol className="space-y-0">
          {ORDER_STEPS.map((step, i) => {
            const state = i < stepIndex ? "done" : i === stepIndex ? "active" : "pending";
            const Icon = step.icon;
            return (
              <li key={step.key} className="relative flex gap-4 pb-8 last:pb-0">
                {i !== ORDER_STEPS.length - 1 && (
                  <span
                    className="absolute left-[19px] top-10 h-full w-px"
                    style={{ background: state === "done" ? THEME.leaf : THEME.soil3 }}
                  />
                )}
                <div
                  className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                  style={{
                    background: state === "pending" ? THEME.soil3 : state === "active" ? THEME.turmeric : THEME.leaf,
                  }}
                >
                  <Icon size={18} color={state === "pending" ? THEME.paper2 : THEME.soil} />
                </div>
                <div>
                  <div className="text-sm font-semibold" style={{ color: state === "pending" ? THEME.paper2 : THEME.paper }}>
                    {step.title}
                  </div>
                  <div className="text-xs" style={{ color: THEME.paper2, opacity: 0.8 }}>{step.note}</div>
                </div>
              </li>
            );
          })}
        </ol>

        {error && (
          <div className="mb-4 rounded-lg px-4 py-2 text-xs" style={{ background: THEME.brick, color: THEME.cream }}>
            {error}
          </div>
        )}

        <div className="mt-4 flex items-center gap-3">
          {!done ? (
            <Button variant="primary" icon={advancing ? Loader2 : ChevronRight} disabled={advancing} onClick={advance}>
              {advancing ? "Updating…" : "Simulate next step"}
            </Button>
          ) : (
            <Pill tone="leaf"><CheckCircle2 size={14} /> Funds released — order complete</Pill>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Footer ---------------- */
function Footer() {
  return (
    <footer className="px-6 py-10" style={{ background: THEME.soil }}>
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-xs sm:flex-row" style={{ color: THEME.paper2 }}>
        <span>KrishiSetu — Team INFOSIX · Smart India Hackathon 2026 · SIH26033</span>
        <span className="ks-mono">Frontend demo build</span>
      </div>
    </footer>
  );
}

/* ---------------- App root ---------------- */
export default function App() {
  const [view, setView] = useState("landing");
  const [listings, setListings] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [listingsError, setListingsError] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getListings()
      .then((data) => {
        if (!cancelled) {
          setListings(data.listings);
          setListingsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          // Backend not reachable — fall back to demo data so the UI
          // still works when presenting without the API running.
          setListings(SEED_LISTINGS);
          setListingsError("Showing offline demo data — backend API is not reachable.");
          setListingsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handlePost = useCallback(async (listing) => {
    const res = await api.createListing({
      crop: listing.crop,
      qty: listing.qty,
      suggestedPrice: listing.suggestedPrice,
      village: listing.village,
      farmer_name: "You (new listing)",
      emoji: "🍅",
    });
    setListings((prev) => [res.listing, ...prev]);
  }, []);

  const handleBuy = useCallback(async (listing, quantity) => {
    const res = await api.createOrder({
      listing_id: listing.id,
      quantity,
      buyer_name: "Demo Buyer",
    });
    setActiveOrder({ ...res.order, emoji: listing.emoji });
    setListings((prev) =>
      prev
        .map((l) => (l.id === listing.id ? { ...l, qty: l.qty - quantity } : l))
        .filter((l) => l.qty > 0)
    );
    setView("tracking");
  }, []);

  return (
    <div className="ks-root min-h-screen" style={{ background: THEME.paper }}>
      <GlobalStyle />
      <NavBar view={view} setView={setView} />
      {view === "landing" && <Landing setView={setView} />}
      {view === "farmer" && <FarmerFlow onPost={handlePost} />}
      {view === "marketplace" && (
        <Marketplace listings={listings} onBuy={handleBuy} loading={listingsLoading} error={listingsError} />
      )}
      {view === "tracking" && <OrderTracking order={activeOrder} onBack={() => setView("marketplace")} />}
      <Footer />
    </div>
  );
}
