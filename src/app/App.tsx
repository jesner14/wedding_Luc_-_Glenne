import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import QRCode from "qrcode";

// ─── Types ────────────────────────────────────────────────────────────────────

type Screen = "invitation" | "register" | "qrcode" | "scanner" | "table";

interface Guest {
  id: string;
  name: string;
  table: number | null;
  registeredAt: string;
}

interface SweetMessage {
  id: string;
  name: string;
  text: string;
  createdAt: string;
}

// ─── Mock DB (localStorage) ──────────────────────────────────────────────────

const DB_KEY = "wedding_guests";
const MESSAGES_KEY = "wedding_sweet_messages";

function loadGuests(): Record<string, Guest> {
  try {
    return JSON.parse(localStorage.getItem(DB_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveGuest(guest: Guest) {
  const db = loadGuests();
  db[guest.id] = guest;
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function findGuestById(id: string): Guest | null {
  return loadGuests()[id] ?? null;
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

function loadMessages(): SweetMessage[] {
  try {
    const raw = JSON.parse(localStorage.getItem(MESSAGES_KEY) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function saveMessage(message: SweetMessage) {
  const list = loadMessages();
  list.unshift(message);
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(list));
}

// ─── Wedding details (billet Luc & Glenne) ───────────────────────────────────

const WEDDING = {
  bride: "Glenne",
  groom: "Luc",
  tagline: "L'évidence d'un nous",
  date: "4 Décembre 2026",
  dateIso: "2026-12-04",
  dateDisplay: "2026/12/04",
  civilPlace: "Mairie d'Akanda",
  civilTime: "14:00",
  receptionPlace: "Pavillon Royal",
  receptionTime: "18:00",
  flight: "LG041226",
  theme: "Raffiné Harmonieux",
};

const COUPLE_PHOTOS = [
  "/photos/couple-1.png",
  "/photos/couple-2.png",
  "/photos/couple-3.png",
];

const fontSans = { fontFamily: "'Outfit', sans-serif" } as const;
const fontScript = { fontFamily: "'Great Vibes', cursive" } as const;
const fontSerif = { fontFamily: "'Cormorant Garamond', serif" } as const;

// ─── Photo carousel ───────────────────────────────────────────────────────────

function PhotoCarousel({
  photos,
  className = "",
  overlay,
}: {
  photos: string[];
  className?: string;
  overlay?: React.ReactNode;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const go = useCallback(
    (next: number) => {
      setIndex((next + photos.length) % photos.length);
    },
    [photos.length]
  );

  useEffect(() => {
    if (paused || photos.length <= 1) return;
    const id = window.setInterval(() => go(index + 1), 4200);
    return () => window.clearInterval(id);
  }, [index, paused, photos.length, go]);

  return (
    <div
      className={`relative overflow-hidden bg-[#3a2418] ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0].clientX;
        setPaused(true);
      }}
      onTouchEnd={(e) => {
        if (touchStartX.current == null) return;
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(dx) > 40) go(dx < 0 ? index + 1 : index - 1);
        touchStartX.current = null;
        setPaused(false);
      }}
    >
      {photos.map((src, i) => (
        <img
          key={src}
          src={src}
          alt={`Luc & Glenne — photo ${i + 1}`}
          className="absolute inset-0 h-full w-full object-contain object-top transition-opacity duration-700 ease-out"
          style={{
            opacity: i === index ? 1 : 0,
            transition: "opacity 0.7s ease",
          }}
          draggable={false}
        />
      ))}

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(58,36,24,0.15) 0%, rgba(58,36,24,0.05) 40%, rgba(58,36,24,0.72) 100%)",
        }}
      />

      {overlay}

      <div className="absolute bottom-4 left-0 right-0 z-10 flex justify-center gap-2">
        {photos.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Photo ${i + 1}`}
            onClick={() => setIndex(i)}
            className="h-1.5 rounded-full transition-all duration-300"
            style={{
              width: i === index ? 22 : 8,
              background: i === index ? "#fff" : "rgba(255,255,255,0.45)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function Divider() {
  return (
    <div className="my-6 flex items-center gap-3">
      <div className="h-px flex-1 bg-[#e07040]/25" />
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-[#e07040]/70">
        <path
          d="M12 2 L13.5 8 L20 8 L14.5 12 L16.5 18 L12 14.5 L7.5 18 L9.5 12 L4 8 L10.5 8 Z"
          fill="currentColor"
        />
      </svg>
      <div className="h-px flex-1 bg-[#e07040]/25" />
    </div>
  );
}

function PlaneIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
    </svg>
  );
}

function getCountdownParts(target: Date) {
  const diff = Math.max(0, target.getTime() - Date.now());
  const totalSec = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSec / 86400),
    hours: Math.floor((totalSec % 86400) / 3600),
    minutes: Math.floor((totalSec % 3600) / 60),
    seconds: totalSec % 60,
    done: diff === 0,
  };
}

function Countdown() {
  const target = useMemo(
    () => new Date(`${WEDDING.dateIso}T${WEDDING.civilTime}:00`),
    []
  );
  const [parts, setParts] = useState(() => getCountdownParts(target));

  useEffect(() => {
    const id = window.setInterval(() => setParts(getCountdownParts(target)), 1000);
    return () => window.clearInterval(id);
  }, [target]);

  const cells = [
    { value: parts.days, label: "Jours" },
    { value: parts.hours, label: "Heures" },
    { value: parts.minutes, label: "Minutes" },
    { value: parts.seconds, label: "Sec" },
  ];

  return (
    <div className="bg-[#e07040] px-5 pb-8 pt-7 text-white">
      <p className="mb-5 text-center text-2xl text-white" style={fontScript}>
        {parts.done ? "C’est le grand jour !" : "L’aventure commence dans…"}
      </p>
      <div className="mx-auto grid max-w-sm grid-cols-4 gap-2">
        {cells.map((cell) => (
          <div key={cell.label} className="text-center">
            <p
              className="text-3xl font-semibold tabular-nums leading-none tracking-tight sm:text-4xl"
              style={fontSerif}
            >
              {String(cell.value).padStart(2, "0")}
            </p>
            <p
              className="mt-2 text-[10px] uppercase tracking-[0.2em] text-white/85"
              style={{ ...fontSans, fontWeight: 400 }}
            >
              {cell.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Screens ──────────────────────────────────────────────────────────────────

function InvitationScreen({ onRsvp, onScan }: { onRsvp: () => void; onScan: () => void }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col bg-background">
      <PhotoCarousel
        photos={COUPLE_PHOTOS}
        className="aspect-[3/4] w-full max-h-[85vh]"
        overlay={
          <div className="absolute inset-x-0 bottom-10 z-10 px-6 text-center text-white">
            <p
              className="mb-2 text-[11px] font-light uppercase tracking-[0.35em] text-white/80"
              style={fontSans}
            >
              Vous êtes invité(e)
            </p>
            <h1 className="text-5xl leading-none text-white drop-shadow-sm" style={fontScript}>
              {WEDDING.groom}
              <span className="mx-2 text-3xl text-white/80">&</span>
              {WEDDING.bride}
            </h1>
            <p className="mt-3 text-lg italic text-[#ffd4bc]" style={fontScript}>
              {WEDDING.tagline}
            </p>
          </div>
        }
      />

      <Countdown />

      {/* Ticket style block */}
      <div className="relative overflow-hidden bg-white px-5 pb-10 pt-8">
        <div className="absolute left-0 top-0 h-full w-1.5 bg-[#e07040]" />

        <div className="mb-6 flex items-center justify-center gap-2 text-[#e07040]">
          <span className="h-px w-8 border-t border-dashed border-[#e07040]/50" />
          <PlaneIcon className="h-4 w-4" />
          <span className="h-px w-8 border-t border-dashed border-[#e07040]/50" />
        </div>

        <p
          className="mb-6 text-center text-2xl text-[#e07040]"
          style={fontScript}
        >
          {WEDDING.tagline}
        </p>

        <div className="grid grid-cols-2 gap-x-4 gap-y-5">
          <TicketField label="Lieu mariage civil" value={WEDDING.civilPlace} />
          <TicketField label="Vol" value={WEDDING.flight} />
          <TicketField label="Lieu soirée" value={WEDDING.receptionPlace} />
          <TicketField label="Thème" value={WEDDING.theme} />
          <TicketField label="Date" value={WEDDING.dateDisplay} />
          <TicketField label="Heure soirée" value={WEDDING.receptionTime} />
          <TicketField label="Heure mairie" value={WEDDING.civilTime} />
        </div>

        <Divider />

        <p
          className="mb-6 text-center text-sm leading-relaxed text-muted-foreground"
          style={{ ...fontSans, fontWeight: 300 }}
        >
          Confirmez votre présence pour recevoir votre QR code. Le jour J, un scan à l’entrée
          indiquera votre table.
        </p>

        <button
          onClick={onRsvp}
          className="w-full bg-[#e07040] py-4 text-sm uppercase tracking-[0.2em] text-white transition-all hover:bg-[#c85a2c] active:scale-[0.98]"
          style={{ ...fontSans, fontWeight: 500 }}
        >
          Confirmer ma présence
        </button>

        <button
          onClick={onScan}
          className="mt-3 w-full border border-[#e07040]/40 py-4 text-sm uppercase tracking-[0.2em] text-[#e07040] transition-all hover:bg-[#fff1e8] active:scale-[0.98]"
          style={{ ...fontSans, fontWeight: 500 }}
        >
          Scanner un QR code
        </button>

        <p
          className="mt-8 text-center text-xs text-muted-foreground"
          style={fontSans}
        >
          {WEDDING.groom} &amp; {WEDDING.bride} — {WEDDING.date}
        </p>
      </div>

      {/* Gallery strip */}
      <section className="border-t border-[#e07040]/15 bg-[#fff5ee] px-5 py-8">
        <p
          className="mb-1 text-center text-[11px] uppercase tracking-[0.3em] text-[#e07040]"
          style={fontSans}
        >
          Nos souvenirs
        </p>
        <h2 className="mb-5 text-center text-3xl text-[#3a2418]" style={fontScript}>
          Luc &amp; Glenne
        </h2>
        <PhotoCarousel photos={COUPLE_PHOTOS} className="aspect-[3/4] w-full rounded-sm" />
      </section>

      <MotsDouxSection />
    </div>
  );
}

function TicketField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p
        className="mb-0.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
        style={{ ...fontSans, fontWeight: 300 }}
      >
        {label}
      </p>
      <p className="text-[15px] font-semibold uppercase tracking-wide text-[#3a2418]" style={fontSans}>
        {value}
      </p>
    </div>
  );
}

function formatMessageDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
  } catch {
    return "";
  }
}

function MotsDouxSection() {
  const [messages, setMessages] = useState<SweetMessage[]>([]);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [toast, setToast] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setMessages(loadMessages());
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(false), 2800);
    return () => window.clearTimeout(id);
  }, [toast]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    const t = text.trim();
    if (!n || !t) {
      setError("Indiquez votre nom et un petit mot.");
      return;
    }
    const message: SweetMessage = {
      id: generateId(),
      name: n,
      text: t,
      createdAt: new Date().toISOString(),
    };
    saveMessage(message);
    setMessages(loadMessages());
    setText("");
    setError("");
    setToast(true);
  };

  return (
    <section className="border-t border-[#e07040]/15 bg-white px-5 py-10">
      <h2 className="mb-6 text-center text-4xl text-[#3a2418]" style={fontScript}>
        Mots doux
      </h2>

      <form
        onSubmit={handleSubmit}
        className="mb-6 rounded-2xl border border-[#e07040]/20 bg-[#fffaf6] px-4 pb-4 pt-5 shadow-[0_8px_30px_rgba(58,36,24,0.06)]"
      >
        <div className="mb-3 flex justify-center text-[#e07040]">
          <PlaneIcon className="h-6 w-6" />
        </div>
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError("");
          }}
          placeholder="Votre prénom"
          className="mb-3 w-full border border-[#e07040]/25 bg-white px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-[#e07040]"
          style={fontSans}
        />
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setError("");
          }}
          placeholder="Écrivez un mot doux pour Luc & Glenne…"
          rows={3}
          className="mb-3 w-full resize-none border border-[#e07040]/25 bg-white px-4 py-3 text-base leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-[#e07040]"
          style={fontSerif}
        />
        {error && (
          <p className="mb-2 text-xs text-destructive" style={fontSans}>
            {error}
          </p>
        )}
        <button
          type="submit"
          className="w-full bg-[#e07040] py-3.5 text-sm uppercase tracking-[0.18em] text-white transition-all hover:bg-[#c85a2c] active:scale-[0.98]"
          style={{ ...fontSans, fontWeight: 500 }}
        >
          Envoyer
        </button>
      </form>

      <p
        className="mb-4 text-center text-[11px] uppercase tracking-[0.25em] text-muted-foreground"
        style={fontSans}
      >
        {messages.length} message{messages.length !== 1 ? "s" : ""}
      </p>

      <div className="space-y-3">
        {messages.length === 0 ? (
          <p
            className="py-6 text-center text-sm text-muted-foreground"
            style={{ ...fontSans, fontWeight: 300 }}
          >
            Soyez le premier à laisser un mot doux.
          </p>
        ) : (
          messages.map((m) => (
            <article
              key={m.id}
              className="rounded-2xl border border-[#e07040]/12 bg-[#fffaf6] px-4 py-4"
            >
              <p className="mb-3 text-[17px] leading-relaxed text-[#3a2418]" style={fontSerif}>
                {m.text}
              </p>
              <div className="flex items-center justify-between gap-3">
                <p
                  className="text-[11px] uppercase tracking-[0.18em] text-[#e07040]"
                  style={{ ...fontSans, fontWeight: 500 }}
                >
                  {m.name}
                </p>
                <p className="text-xs text-muted-foreground" style={fontSans}>
                  {formatMessageDate(m.createdAt)}
                </p>
              </div>
            </article>
          ))
        )}
      </div>

      {toast && (
        <div
          className="fixed bottom-6 left-1/2 z-50 flex max-w-[90vw] -translate-x-1/2 items-center gap-2 rounded-full bg-[#3a2418]/92 px-5 py-3 text-sm text-white shadow-lg"
          style={fontSans}
          role="status"
        >
          <span className="text-[#e07040]">✓</span>
          Message envoyé au livre d’or ✨
        </div>
      )}
    </section>
  );
}

function RegisterScreen({ onBack, onDone }: { onBack: () => void; onDone: (guest: Guest) => void }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Merci d'indiquer votre nom complet.");
      return;
    }
    setLoading(true);

    const db = loadGuests();
    const existing = Object.values(db).find(
      (g) => g.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (existing) {
      setLoading(false);
      onDone(existing);
      return;
    }

    const guest: Guest = {
      id: generateId(),
      name: trimmed,
      table: null,
      registeredAt: new Date().toISOString(),
    };
    saveGuest(guest);
    await new Promise((r) => setTimeout(r, 600));
    setLoading(false);
    onDone(guest);
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col bg-background">
      <div className="relative overflow-hidden bg-[#e07040] px-6 pb-10 pt-14 text-center text-white">
        <p
          className="mb-2 text-[11px] uppercase tracking-[0.3em] text-white/80"
          style={{ ...fontSans, fontWeight: 300 }}
        >
          Confirmation de présence
        </p>
        <h2 className="text-4xl" style={fontScript}>
          Votre invitation
        </h2>
        <p className="mt-2 text-sm text-white/85" style={fontSans}>
          {WEDDING.groom} &amp; {WEDDING.bride}
        </p>
      </div>

      <div className="mx-auto w-full max-w-sm flex-1 px-6 py-8">
        <p
          className="mb-8 text-center text-sm leading-relaxed text-muted-foreground"
          style={{ ...fontSans, fontWeight: 300 }}
        >
          Renseignez votre nom tel qu’il apparaît sur votre invitation. Un QR code personnel vous
          sera remis.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              className="mb-2 block text-[11px] uppercase tracking-[0.2em] text-muted-foreground"
              style={{ ...fontSans, fontWeight: 300 }}
            >
              Nom complet
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              placeholder="ex. Marie Dupont"
              className="w-full border border-border bg-input-background px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-[#e07040]"
              style={fontSerif}
              autoFocus
            />
            {error && (
              <p className="mt-1 text-xs text-destructive" style={fontSans}>
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#e07040] py-4 text-sm uppercase tracking-[0.2em] text-white transition-all hover:bg-[#c85a2c] active:scale-[0.98] disabled:opacity-60"
            style={{ ...fontSans, fontWeight: 500 }}
          >
            {loading ? "Enregistrement…" : "Obtenir mon QR code"}
          </button>
        </form>

        <button
          onClick={onBack}
          className="mt-4 w-full py-3 text-sm uppercase tracking-widest text-muted-foreground transition-opacity hover:opacity-70"
          style={{ ...fontSans, fontWeight: 300 }}
        >
          ← Retour
        </button>
      </div>
    </div>
  );
}

function QRCodeScreen({ guest, onBack }: { guest: Guest; onBack: () => void }) {
  const [dataUrl, setDataUrl] = useState("");

  useEffect(() => {
    const qrData = JSON.stringify({
      id: guest.id,
      name: guest.name,
      table: guest.table,
      vol: WEDDING.flight,
    });
    QRCode.toDataURL(qrData, {
      width: 260,
      margin: 2,
      color: { dark: "#3a2418", light: "#fffaf6" },
      errorCorrectionLevel: "M",
    }).then(setDataUrl);
  }, [guest]);

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `invitation-${guest.name.replace(/\s+/g, "-")}.png`;
    a.click();
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col bg-background">
      <div className="bg-[#e07040] px-6 pb-10 pt-14 text-center text-white">
        <p
          className="mb-2 text-[11px] uppercase tracking-[0.3em] text-white/80"
          style={{ ...fontSans, fontWeight: 300 }}
        >
          Votre invitation personnelle
        </p>
        <h2 className="mb-1 text-4xl" style={fontScript}>
          {guest.name}
        </h2>
        <p className="text-xs tracking-widest text-white/70" style={fontSans}>
          #{guest.id}
          {guest.table ? ` · Table ${guest.table}` : ""}
        </p>
      </div>

      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center px-6 py-8">
        {dataUrl ? (
          <div className="flex w-full flex-col items-center gap-6">
            <div className="border border-[#e07040]/25 bg-white p-4 shadow-sm">
              <div className="relative">
                <img src={dataUrl} alt={`QR code de ${guest.name}`} className="block h-56 w-56" />
                <div className="pointer-events-none absolute -left-1 -top-1 h-5 w-5 border-l-2 border-t-2 border-[#e07040]" />
                <div className="pointer-events-none absolute -right-1 -top-1 h-5 w-5 border-r-2 border-t-2 border-[#e07040]" />
                <div className="pointer-events-none absolute -bottom-1 -left-1 h-5 w-5 border-b-2 border-l-2 border-[#e07040]" />
                <div className="pointer-events-none absolute -bottom-1 -right-1 h-5 w-5 border-b-2 border-r-2 border-[#e07040]" />
              </div>
            </div>

            <p
              className="text-center text-sm leading-relaxed text-muted-foreground"
              style={{ ...fontSans, fontWeight: 300 }}
            >
              {guest.table
                ? `Présentez ce QR code à l’entrée — Table ${guest.table}.`
                : "Présentez ce QR code à l’entrée le jour du mariage pour connaître votre table."}
            </p>

            <Divider />

            <div className="w-full space-y-3">
              <button
                onClick={handleDownload}
                className="w-full bg-[#e07040] py-4 text-sm uppercase tracking-[0.2em] text-white transition-all hover:bg-[#c85a2c] active:scale-[0.98]"
                style={{ ...fontSans, fontWeight: 500 }}
              >
                Télécharger mon QR code
              </button>
              <button
                onClick={onBack}
                className="w-full py-3 text-sm uppercase tracking-widest text-muted-foreground transition-opacity hover:opacity-70"
                style={{ ...fontSans, fontWeight: 300 }}
              >
                ← Retour à l’invitation
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#e07040]/30 border-t-[#e07040]" />
          </div>
        )}
      </div>
    </div>
  );
}

function ScannerScreen({ onBack, onFound }: { onBack: () => void; onFound: (guest: Guest) => void }) {
  const [manualId, setManualId] = useState("");
  const [error, setError] = useState("");

  const handleManual = () => {
    const trimmed = manualId.trim().toUpperCase();
    if (!trimmed) {
      setError("Entrez un identifiant valide.");
      return;
    }
    const guest = findGuestById(trimmed);
    if (!guest) {
      setError("Aucun invité trouvé avec cet identifiant.");
      return;
    }
    onFound(guest);
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col bg-background">
      <div className="bg-[#e07040] px-6 pb-10 pt-14 text-center text-white">
        <p
          className="mb-2 text-[11px] uppercase tracking-[0.3em] text-white/80"
          style={{ ...fontSans, fontWeight: 300 }}
        >
          Accueil invités
        </p>
        <h2 className="text-4xl" style={fontScript}>
          Scanner un QR code
        </h2>
      </div>

      <div className="mx-auto w-full max-w-sm flex-1 px-6 py-8">
        <div className="relative mb-6 flex aspect-square w-full items-center justify-center overflow-hidden border border-[#e07040]/25 bg-[#fff5ee]">
          <div className="absolute inset-4 border border-[#e07040]/20" />
          <div className="absolute left-4 top-4 h-6 w-6 border-l-2 border-t-2 border-[#e07040]" />
          <div className="absolute right-4 top-4 h-6 w-6 border-r-2 border-t-2 border-[#e07040]" />
          <div className="absolute bottom-4 left-4 h-6 w-6 border-b-2 border-l-2 border-[#e07040]" />
          <div className="absolute bottom-4 right-4 h-6 w-6 border-b-2 border-r-2 border-[#e07040]" />
          <div className="px-8 text-center">
            <PlaneIcon className="mx-auto mb-3 h-8 w-8 text-[#e07040]/60" />
            <p
              className="text-xs leading-relaxed text-muted-foreground"
              style={{ ...fontSans, fontWeight: 300 }}
            >
              Caméra non disponible en mode web. Utilisez l’identifiant manuel ci-dessous.
            </p>
          </div>
        </div>

        <p
          className="mb-4 text-center text-[11px] uppercase tracking-[0.2em] text-muted-foreground"
          style={{ ...fontSans, fontWeight: 300 }}
        >
          Ou entrez l’identifiant manuellement
        </p>

        <div className="space-y-3">
          <input
            type="text"
            value={manualId}
            onChange={(e) => {
              setManualId(e.target.value.toUpperCase());
              setError("");
            }}
            placeholder="ex. A3BC1D2E"
            maxLength={10}
            className="w-full border border-border bg-input-background px-4 py-3 text-center tracking-widest text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-[#e07040]"
            style={fontSerif}
          />
          {error && (
            <p className="text-xs text-destructive" style={fontSans}>
              {error}
            </p>
          )}
          <button
            onClick={handleManual}
            className="w-full bg-[#e07040] py-4 text-sm uppercase tracking-[0.2em] text-white transition-all hover:bg-[#c85a2c] active:scale-[0.98]"
            style={{ ...fontSans, fontWeight: 500 }}
          >
            Rechercher l’invité
          </button>
        </div>

        <button
          onClick={onBack}
          className="mt-4 w-full py-3 text-sm uppercase tracking-widest text-muted-foreground transition-opacity hover:opacity-70"
          style={{ ...fontSans, fontWeight: 300 }}
        >
          ← Retour
        </button>

        <GuestList />
      </div>
    </div>
  );
}

function GuestList() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tableInput, setTableInput] = useState("");
  const [open, setOpen] = useState(false);

  const reload = () => setGuests(Object.values(loadGuests()));

  useEffect(() => {
    reload();
  }, [open]);

  const handleAssignTable = (id: string) => {
    const num = parseInt(tableInput);
    if (isNaN(num) || num < 1) return;
    const db = loadGuests();
    if (db[id]) {
      db[id].table = num;
      localStorage.setItem(DB_KEY, JSON.stringify(db));
      reload();
      setEditingId(null);
      setTableInput("");
    }
  };

  return (
    <div className="mt-8">
      <button
        onClick={() => setOpen(!open)}
        className="w-full border border-[#e07040]/25 py-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:bg-[#fff1e8]"
        style={{ ...fontSans, fontWeight: 300 }}
      >
        {open ? "Masquer" : "Gérer"} la liste des invités
      </button>

      {open && (
        <div className="mt-4 space-y-3">
          {guests.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground" style={fontSans}>
              Aucun invité enregistré.
            </p>
          ) : (
            guests.map((g) => (
              <div key={g.id} className="border border-[#e07040]/20 bg-white p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm text-foreground" style={fontSerif}>
                      {g.name}
                    </p>
                    <p
                      className="text-xs text-muted-foreground"
                      style={{ ...fontSans, fontWeight: 300 }}
                    >
                      #{g.id}
                    </p>
                  </div>
                  <div className="text-right">
                    {g.table ? (
                      <button
                        onClick={() => {
                          setEditingId(g.id);
                          setTableInput(String(g.table));
                        }}
                        className="border border-[#e07040]/40 px-2 py-1 text-xs text-[#e07040] transition-colors hover:bg-[#fff1e8]"
                        style={fontSans}
                      >
                        Table {g.table}
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingId(g.id);
                          setTableInput("");
                        }}
                        className="border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary"
                        style={fontSans}
                      >
                        Assigner table
                      </button>
                    )}
                  </div>
                </div>
                {editingId === g.id && (
                  <div className="mt-2 flex gap-2">
                    <input
                      type="number"
                      min="1"
                      value={tableInput}
                      onChange={(e) => setTableInput(e.target.value)}
                      placeholder="N° table"
                      className="flex-1 border border-border bg-input-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#e07040]"
                      style={fontSans}
                      autoFocus
                    />
                    <button
                      onClick={() => handleAssignTable(g.id)}
                      className="bg-[#e07040] px-3 py-1 text-xs text-white hover:bg-[#c85a2c]"
                      style={fontSans}
                    >
                      OK
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-secondary"
                      style={fontSans}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function TableScreen({ guest, onBack }: { guest: Guest; onBack: () => void }) {
  const tableNumber = guest.table;

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col bg-background">
      <div className="bg-[#e07040] px-6 pb-10 pt-16 text-center text-white">
        <p
          className="mb-3 text-[11px] uppercase tracking-[0.3em] text-white/80"
          style={{ ...fontSans, fontWeight: 300 }}
        >
          Bienvenue
        </p>
        <h2 className="mb-2 text-5xl" style={fontScript}>
          {guest.name}
        </h2>
        <p className="text-xs tracking-widest text-white/65" style={fontSans}>
          #{guest.id}
        </p>
      </div>

      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center px-6 py-10">
        {tableNumber ? (
          <>
            <p
              className="mb-4 text-center text-sm uppercase tracking-[0.2em] text-muted-foreground"
              style={{ ...fontSans, fontWeight: 300 }}
            >
              Votre place est à la
            </p>

            <div className="relative mb-6 flex h-52 w-52 flex-col items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-[#e07040]/30" />
              <div className="absolute inset-3 rounded-full border border-[#e07040]/20" />
              <p
                className="mb-1 text-[11px] uppercase tracking-[0.3em] text-[#e07040]"
                style={{ ...fontSans, fontWeight: 300 }}
              >
                Table
              </p>
              <p className="text-7xl font-semibold leading-none text-[#e07040]" style={fontSerif}>
                {tableNumber}
              </p>
            </div>

            <p
              className="text-center text-sm leading-relaxed text-muted-foreground"
              style={{ ...fontSans, fontWeight: 300 }}
            >
              Notre équipe vous accompagnera jusqu’à votre table. Belle soirée !
            </p>
          </>
        ) : (
          <div className="mb-6 flex h-48 w-48 flex-col items-center justify-center border border-[#e07040]/25">
            <PlaneIcon className="mb-3 h-8 w-8 text-[#e07040]/50" />
            <p
              className="px-4 text-center text-xs leading-relaxed text-muted-foreground"
              style={{ ...fontSans, fontWeight: 300 }}
            >
              Votre table n’a pas encore été assignée. Présentez-vous à l’accueil.
            </p>
          </div>
        )}

        <Divider />

        <div
          className="space-y-1 text-center text-xs text-muted-foreground"
          style={{ ...fontSans, fontWeight: 300 }}
        >
          <p>
            {WEDDING.groom} &amp; {WEDDING.bride}
          </p>
          <p>
            {WEDDING.date} · {WEDDING.receptionTime}
          </p>
          <p>{WEDDING.receptionPlace}</p>
        </div>

        <button
          onClick={onBack}
          className="mt-8 border border-[#e07040]/25 px-8 py-3 text-sm uppercase tracking-widest text-muted-foreground transition-opacity hover:opacity-70"
          style={{ ...fontSans, fontWeight: 300 }}
        >
          ← Retour
        </button>
      </div>
    </div>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState<Screen>("invitation");
  const [currentGuest, setCurrentGuest] = useState<Guest | null>(null);

  const go = (s: Screen) => setScreen(s);

  return (
    <div className="min-h-screen bg-background" style={fontSans}>
      {screen === "invitation" && (
        <InvitationScreen onRsvp={() => go("register")} onScan={() => go("scanner")} />
      )}
      {screen === "register" && (
        <RegisterScreen
          onBack={() => go("invitation")}
          onDone={(guest) => {
            setCurrentGuest(guest);
            go("qrcode");
          }}
        />
      )}
      {screen === "qrcode" && currentGuest && (
        <QRCodeScreen guest={currentGuest} onBack={() => go("invitation")} />
      )}
      {screen === "scanner" && (
        <ScannerScreen
          onBack={() => go("invitation")}
          onFound={(guest) => {
            setCurrentGuest(guest);
            go("table");
          }}
        />
      )}
      {screen === "table" && currentGuest && (
        <TableScreen guest={currentGuest} onBack={() => go("scanner")} />
      )}
    </div>
  );
}
