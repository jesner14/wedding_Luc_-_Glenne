import { useState, useEffect, useRef, useMemo } from "react";

type Screen = "invite" | "details" | "rsvp" | "thanks";

interface Guest {
  id: string;
  name: string;
  attending: boolean;
  registeredAt: string;
}

const DB_KEY = "wedding_guests";
const GUEST_LIMIT = 200;
const MUSIC_SRC = "/music/notre-musique.m4a";

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

function generateId(): string {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

const WEDDING = {
  bride: "Glenne",
  groom: "Luc",
  date: "4 Décembre 2026",
  dateIso: "2026-12-04",
  civilTime: "14:00",
  coutumier: "Pavillon Royal",
  coutumierDetail: "Akanda Pavés, après l'École les Kikinous",
  civil: "Mairie d'Akanda",
  soiree: "Pavillon Royal",
  soireeDetail: "Akanda Pavés, après l'École les Kikinous",
};

const COUPLE_PHOTOS = [
  "/photos/couple-1.png",
  "/photos/couple-2.png",
  "/photos/couple-3.png",
];

const fontSans = { fontFamily: "'Outfit', sans-serif" } as const;
const fontScript = { fontFamily: "'Great Vibes', cursive" } as const;
const fontSerif = { fontFamily: "'Cormorant Garamond', serif" } as const;

function Envelope({
  open,
  onOpen,
  playing,
  onToggleMusic,
}: {
  open: boolean;
  onOpen: () => void;
  playing?: boolean;
  onToggleMusic?: () => void;
}) {
  if (!open) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="relative mx-auto block w-[min(88vw,320px)]"
        aria-label="Ouvrir l'enveloppe"
      >
        <svg viewBox="0 0 320 230" className="h-auto w-full drop-shadow-xl" aria-hidden>
          <rect x="18" y="58" width="284" height="154" rx="4" fill="#c45c32" />
          <rect x="18" y="58" width="284" height="154" rx="4" fill="url(#closedBody)" />
          <polygon points="18,58 160,196 302,58" fill="#d36a3c" />
          <polygon points="18,58 160,188 302,58" fill="url(#closedFlap)" />
          <image href="/flowers/wax-seal.png" x="115" y="143" width="90" height="90" />
          <defs>
            <linearGradient id="closedBody" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#e07a4a" />
              <stop offset="55%" stopColor="#c45c32" />
              <stop offset="100%" stopColor="#9e3f1f" />
            </linearGradient>
            <linearGradient id="closedFlap" x1="0.5" y1="0" x2="0.5" y2="1">
              <stop offset="0%" stopColor="#e89262" />
              <stop offset="100%" stopColor="#b14a28" />
            </linearGradient>
          </defs>
        </svg>
      </button>
    );
  }

  return (
    <div className="envelope-open relative mx-auto w-full">
      <div className="envelope-open-stack">
        <img
          src="/decor/envelope-haut.png"
          alt=""
          draggable={false}
          className="envelope-haut"
        />

        <button
          type="button"
          onClick={onToggleMusic}
          className="envelope-vinyl-inside"
          aria-label={playing ? "Mettre la musique en pause" : "Jouer notre musique"}
        >
          <span className="envelope-vinyl-rotate spin-slow">
            <span className="envelope-vinyl-disc" />
            <svg className="envelope-vinyl-arc" viewBox="0 0 100 100" aria-hidden>
              <defs>
                <path id="vinyl-text-path-open" d="M 50,50 m -36,0 a 36,36 0 1,1 72,0" />
              </defs>
              <text fill="#fff" fontSize="5.6" letterSpacing="1.1" fontFamily="Cormorant Garamond, serif">
                <textPath href="#vinyl-text-path-open" startOffset="14%">
                  JOUER NOTRE MUSIQUE
                </textPath>
              </text>
            </svg>
            <span className="envelope-vinyl-center">{playing ? "❚❚" : "♪"}</span>
          </span>
        </button>

        <img
          src="/decor/envelope-bas.png"
          alt=""
          draggable={false}
          className="envelope-bas"
        />

      </div>

      <EnvelopeCollage />

      <img
        src="/flowers/wax-seal.png"
        alt=""
        draggable={false}
        className="envelope-open-seal"
      />
    </div>
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
  const target = useMemo(() => new Date(`${WEDDING.dateIso}T${WEDDING.civilTime}:00`), []);
  const [parts, setParts] = useState(() => getCountdownParts(target));

  useEffect(() => {
    const id = window.setInterval(() => setParts(getCountdownParts(target)), 1000);
    return () => window.clearInterval(id);
  }, [target]);

  const cells = [
    { value: parts.days, label: "Jours", accent: false },
    { value: parts.hours, label: "Heures", accent: false },
    { value: parts.minutes, label: "Minutes", accent: false },
    { value: parts.seconds, label: "Secondes", accent: true },
  ];

  return (
    <div className="px-2 py-2">
      <p className="mb-5 text-center text-sm tracking-[0.28em] text-[#8c6b52]" style={fontSans}>
        {parts.done ? "C’est le grand jour" : "L’aventure commence dans"}
      </p>
      <div className="grid grid-cols-4 gap-2">
        {cells.map((cell) => (
          <div key={cell.label} className="text-center">
            <p
              className="text-3xl font-semibold tabular-nums leading-none sm:text-4xl"
              style={{
                ...fontSerif,
                color: cell.accent ? "#c45c32" : "#3b2a1f",
              }}
            >
              {String(cell.value).padStart(2, "0")}
            </p>
            <p
              className="mt-2 text-[10px] uppercase tracking-[0.18em]"
              style={{
                ...fontSans,
                color: cell.accent ? "#c45c32" : "#8c6b52",
              }}
            >
              {cell.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PhotoShowcase({ onDetailsClick }: { onDetailsClick: () => void }) {
  const [index, setIndex] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => {
      // Animation plus fluide : on fade-out, on change la photo, puis on fade-in.
      setFading(true);
      window.setTimeout(() => {
        setIndex((i) => (i + 1) % COUPLE_PHOTOS.length);
      }, 260);
      window.setTimeout(() => setFading(false), 900);
    }, 4500);
    return () => window.clearInterval(id);
  }, []);

  const backPhoto = COUPLE_PHOTOS[index];
  const frontPhoto = COUPLE_PHOTOS[(index + 1) % COUPLE_PHOTOS.length];

  return (
    <div className="photo-showcase">
      <div className={`photo-tray-wrap ${fading ? "is-fading" : ""}`}>
        <div className="silver-tray">
          <div className="silver-tray-rim" />
        </div>
        <img src="/decor/lily-white.png" alt="" draggable={false} className="tray-lily tray-lily-top" />
        <img src="/decor/lily-white.png" alt="" draggable={false} className="tray-lily tray-lily-bottom" />
        <img
          src={backPhoto}
          alt=""
          className="tray-polaroid tray-polaroid-back"
        />
        <img
          src={frontPhoto}
          alt=""
          className="tray-polaroid tray-polaroid-front"
        />
      </div>

      <button type="button" className="details-badge" onClick={onDetailsClick}>
        <span className="details-badge-shape" />
        <span className="details-badge-border" />
        <span className="details-badge-title">Les Détails</span>
        <span className="details-badge-cta">Cliquez ici</span>
        <svg viewBox="0 0 80 56" className="details-badge-cupid" aria-hidden>
          <path
            d="M12 44c8-10 18-16 30-18 6-1 12 0 18 3M58 12c-4 6-10 10-17 11"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <circle cx="58" cy="10" r="4" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <path
            d="M22 30c2-8 10-14 20-14 8 0 14 4 18 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.3"
          />
        </svg>
      </button>
    </div>
  );
}

function CupidIcon({ className = "invitation-cupid" }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 56" className={className} aria-hidden>
      <path
        d="M12 44c8-10 18-16 30-18 6-1 12 0 18 3M58 12c-4 6-10 10-17 11"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx="58" cy="10" r="4" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M22 30c2-8 10-14 20-14 8 0 14 4 18 10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path d="M8 42l6-4 4 6" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function EnvelopeCollage() {
  return (
    <div className="envelope-collage" aria-hidden={false}>
      <img
        src="/decor/invite-card.png?v=2"
        alt="Invitation Luc et Glenne"
        className="collage-invite-card"
        draggable={false}
      />
      <img
        src="/photos/invite-photo.png?v=2"
        alt=""
        className="collage-invite-photo"
        draggable={false}
      />
    </div>
  );
}

function InvitationLetter() {
  return (
    <article className="invitation-card">
      <div className="invitation-card-inner text-center">
        <p className="invitation-quote">
          Parce que certains liens ne se choisissent pas, ils s’imposent…
        </p>
        <p className="invitation-kicker">
          Rejoignez-nous pour célébrer le mariage de
        </p>
        <h2 className="invitation-names">
          {WEDDING.groom} &amp; {WEDDING.bride}
        </h2>
        <div className="invitation-body">
          <p>ont la joie de vous inviter à célébrer l’évidence d’un nous.</p>
          <p>
            Une union née de la paix, bâtie avec douceur, guidée dans le silence et la
            prière.
          </p>
          <p>
            Un lien simple et solide, béni par Dieu, où deux chemins se confondent pour
            n’en former qu’un.
          </p>
          <p>
            Nous serions bénis et ravis de partager ce nouveau chapitre de notre vie avec
            vous.
          </p>
        </div>
        <CupidIcon />
      </div>
    </article>
  );
}

function Venue({
  label,
  place,
  detail,
}: {
  label: string;
  place: string;
  detail?: string;
}) {
  return (
    <div className="text-center">
      <p
        className="mb-1 text-[10px] uppercase tracking-[0.28em] text-[#c6a15b]"
        style={fontSans}
      >
        {label}
      </p>
      <p className="text-xl text-[#3b2a1f]" style={fontSerif}>
        {place}
      </p>
      {detail && (
        <p className="mt-1 text-sm leading-relaxed text-[#8c6b52]" style={fontSans}>
          {detail}
        </p>
      )}
    </div>
  );
}

function ClosedSplash({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <p
        className="mb-3 text-[11px] uppercase tracking-[0.38em] text-[#3b2a1f]"
        style={fontSans}
      >
        Vous êtes invité par
      </p>
      <h1 className="mb-12 text-5xl text-[#3b2a1f]" style={fontScript}>
        {WEDDING.groom} &amp; {WEDDING.bride}
      </h1>
      <Envelope open={false} onOpen={onOpen} />
      <button
        type="button"
        onClick={onOpen}
        className="mt-12 text-[12px] uppercase tracking-[0.32em] text-[#3b2a1f]"
        style={fontSans}
      >
        Ouvrir l’enveloppe
      </button>
    </div>
  );
}

function OpenedInvitation({
  playing,
  onToggleMusic,
  onOpenDetails,
}: {
  playing: boolean;
  onToggleMusic: () => void;
  onOpenDetails: () => void;
}) {
  return (
    <div className="invite-open px-4 pb-10 pt-6">
      <p
        className="mb-2 text-center text-[11px] uppercase tracking-[0.32em] text-[#8c6b52]"
        style={fontSans}
      >
        Amoureusement vôtre
      </p>
      <h1 className="mb-6 text-center text-[clamp(2.5rem,10vw,3.25rem)] text-[#3b2a1f]" style={fontScript}>
        {WEDDING.groom} &amp; {WEDDING.bride}
      </h1>

      <div className="envelope-hero">
        <Envelope open onOpen={() => {}} playing={playing} onToggleMusic={onToggleMusic} />
        <p
          className="mt-4 text-center text-[11px] uppercase tracking-[0.28em] text-[#c6a15b]"
          style={fontSans}
        >
          {playing ? "Musique en cours" : "Touchez le vinyle"}
        </p>
      </div>

      <div className="invite-showcase-row">
        <button
          type="button"
          className="invite-showcase-combined"
          onClick={onOpenDetails}
          aria-label="Voir les détails du mariage"
        >
          <img
            src="/decor/showcase-details.png?v=1"
            alt="Photos des mariés et accès aux détails"
            className="invite-showcase-combined-img"
            draggable={false}
          />
        </button>
      </div>
    </div>
  );
}

function DetailsScreen({
  onBack,
  onGoRsvp,
}: {
  onBack: () => void;
  onGoRsvp: () => void;
}) {
  const programItems = [
    {
      time: "12:00",
      date: "27.08.2026",
      title: "Mariage Civil à la mairie de",
      place: "Yaoundé I, Mballa II",
      icon: "civil",
    },
    {
      time: "15:00",
      date: "27.08.2026",
      title: "Mariage religieux à EEC",
      place: "Manguier",
      icon: "religious",
    },
    {
      time: "19:00",
      date: "27.08.2026",
      title: "Soirée dansante à la Vallée",
      place: "Verte, Fouguerolles",
      icon: "party",
    },
  ] as const;

  const faq = [
    {
      q: "Y a-t-il des parkings disponibles ?",
      a: "Pour les invités qui viennent en voiture, des parkings gratuits sont aménagés sur place avec accès facile aux différents lieux de cérémonie.",
    },
    {
      q: "Les enfants sont-ils conviés ?",
      a: "Nous adorons vos petits ! Cependant c’est exclusivement entre adultes car les multiples déplacements et ambiances ne sont pas favorables à leur présence.",
    },
    {
      q: "Les photos et vidéos sont-elles autorisées pendant la cérémonie ?",
      a: "N’hésitez pas à en prendre mais veuillez faire attention à nos photographes.",
    },
  ] as const;

  const palette = ["#8a523f", "#c46238", "#8a8f58", "#c7a05d", "#e9d9c4"];

  return (
    <div className="px-6 pb-10 pt-8">
      <button
        type="button"
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-[11px] uppercase tracking-[0.32em] text-[#3b2a1f]"
        style={fontSans}
      >
        Retour
      </button>

      <h1 className="mb-10 text-center text-5xl text-[#3b2a1f]" style={fontScript}>
        Les Détails
      </h1>

      <div className="mx-auto mb-10 max-w-md text-center">
        <p className="text-[#3b2a1f]" style={fontSerif}>
          Nous avons hâte de célébrer ce jour si spécial avec vous !
        </p>
        <p className="mt-1 text-[#3b2a1f]" style={fontSerif}>
          Voici tout ce que vous devez savoir pour profiter pleinement de
          l’événement.
        </p>
      </div>

      {/* J - 0 header */}
      <div className="mb-10">
        <p className="mb-4 text-center text-xs uppercase tracking-[0.32em] text-[#8c6b52]" style={fontSans}>
          JOUR J MOINS
        </p>
        <Countdown />
      </div>

      <section className="mb-10">
        <h2 className="mb-4 text-center text-4xl text-[#7a5c48]" style={fontScript}>
          Au programme
        </h2>
        <div className="space-y-8">
          {programItems.map((item, idx) => (
            <div key={idx} className="text-center">
              <p className="mb-3 text-[#7a5c48]" style={fontSerif}>
                {item.date} | {item.time}
              </p>
              <p className="text-[18px] text-[#3b2a1f]" style={fontSans}>
                {item.title}
              </p>
              <p className="text-[18px] text-[#3b2a1f]" style={fontSans}>
                {item.place}
              </p>
              <button
                type="button"
                className="mt-4 inline-flex items-center gap-2 text-[15px] font-medium text-[#8c6b52]"
                style={fontSerif}
                onClick={() => {}}
              >
                <span aria-hidden>📍</span> S’y rendre
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-2 text-center text-4xl text-[#7a5c48]" style={fontScript}>
          Dress Code
        </h2>
        <p className="mx-auto max-w-sm text-center text-[#3b2a1f]" style={fontSerif}>
          Une tenue conforme est exigée. N’hésitez pas à vous inspirer de cette palette.
        </p>
        <div className="mx-auto mt-6 flex w-full max-w-sm items-center justify-center gap-3">
          {palette.map((c) => (
            <div
              key={c}
              className="h-16 w-16 rounded-[2px]"
              style={{
                background: c,
                borderTopLeftRadius: 6,
                borderTopRightRadius: 6,
                clipPath: "polygon(0 0, 100% 0, 100% 68%, 50% 100%, 0 68%)",
              }}
            />
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-5 text-center text-4xl text-[#7a5c48]" style={fontScript}>
          Guide Cadeaux
        </h2>
        <div className="mx-auto max-w-sm rounded-[20px] bg-[#f7f1e8] px-6 py-8 text-center shadow-[0_18px_40px_rgba(59,42,31,0.08)]">
          <p className="mb-6 text-[#3b2a1f]" style={fontSerif}>
            Tous vos cadeaux sont bienvenus, qu’ils soient matériels ou financiers.
            Nous exprimons d’avance notre gratitude pour votre geste.
          </p>
          <button
            type="button"
            className="mx-auto mt-2 block w-full max-w-xs rounded-full bg-[#c45c32] py-4 text-center text-white"
            style={fontSans}
            onClick={onGoRsvp}
          >
            RSVP
          </button>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-6 text-center text-4xl text-[#7a5c48]" style={fontScript}>
          Foire à Questions
        </h2>
        <div className="space-y-8">
          {faq.map((item, idx) => (
            <div key={idx}>
              <p className="text-center text-[17px] font-semibold text-[#7a5c48]" style={fontSans}>
                {item.q}
              </p>
              <p className="mt-3 text-center text-[16px] leading-relaxed text-[#3b2a1f]" style={fontSans}>
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="mx-auto mb-6 mt-8 flex flex-col items-center justify-center">
        <img
          src="/flowers/wax-seal.png"
          alt=""
          draggable={false}
          className="h-20 w-20 rounded-full object-contain"
          style={{ filter: "drop-shadow(0 4px 10px rgba(80,45,10,0.35))" }}
        />
        <p className="mt-2 text-center text-[13px] uppercase tracking-[0.32em] text-[#3b2a1f]" style={fontSans}>
          Continuer vers RSVP
        </p>
        <button
          type="button"
          onClick={onGoRsvp}
          className="mt-4 w-full max-w-xs rounded-full bg-[#c45c32] py-4 text-white"
          style={fontSans}
        >
          Continuer
        </button>
      </div>
    </div>
  );
}

function RsvpScreen({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Merci d’indiquer votre nom complet.");
      return;
    }

    const db = loadGuests();
    const existing = Object.values(db).find(
      (g) => g.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (existing) {
      onDone();
      return;
    }
    if (Object.keys(db).length >= GUEST_LIMIT) {
      setError("Les confirmations sont closes (200 invités).");
      return;
    }

    setLoading(true);
    saveGuest({
      id: generateId(),
      name: trimmed,
      attending: true,
      registeredAt: new Date().toISOString(),
    });
    await new Promise((r) => setTimeout(r, 450));
    setLoading(false);
    onDone();
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col">
      <div className="bg-[#c45c32] px-6 pb-10 pt-14 text-center text-[#fffaf3]">
        <p className="mb-2 text-[11px] uppercase tracking-[0.3em] text-white/80" style={fontSans}>
          Confirmation de présence
        </p>
        <h2 className="text-4xl" style={fontScript}>
          {WEDDING.groom} &amp; {WEDDING.bride}
        </h2>
      </div>
      <form onSubmit={handleSubmit} className="mx-auto w-full max-w-sm flex-1 px-6 py-8">
        <p className="mb-6 text-center text-sm leading-relaxed text-[#8c6b52]" style={fontSans}>
          Confirmez votre venue au mariage du 4 décembre 2026.
        </p>
        <label className="mb-2 block text-[11px] uppercase tracking-[0.2em] text-[#8c6b52]" style={fontSans}>
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
          className="mb-3 w-full border border-[#c45c32]/25 bg-[#f3e9dc] px-4 py-3 text-[#3b2a1f] placeholder:text-[#8c6b52]/50 focus:outline-none focus:ring-1 focus:ring-[#c6a15b]"
          style={fontSerif}
          autoFocus
        />
        {error && (
          <p className="mb-3 text-xs text-destructive" style={fontSans}>
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#c45c32] py-4 text-sm uppercase tracking-[0.18em] text-white hover:bg-[#9e3f1f] disabled:opacity-60"
          style={fontSans}
        >
          {loading ? "Enregistrement…" : "Confirmer ma présence"}
        </button>
        <button
          type="button"
          onClick={onBack}
          className="mt-4 w-full py-3 text-sm uppercase tracking-widest text-[#8c6b52]"
          style={fontSans}
        >
          ← Retour
        </button>
      </form>
    </div>
  );
}

function ThanksScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-8 text-center">
      <p className="mb-3 text-[11px] uppercase tracking-[0.3em] text-[#c6a15b]" style={fontSans}>
        Luc &amp; Glenne
      </p>
      <h2 className="mb-4 text-5xl text-[#c45c32]" style={fontScript}>
        Merci pour votre confirmation !!
      </h2>
      <p className="mb-8 max-w-sm text-[17px] leading-relaxed text-[#3b2a1f]" style={fontSerif}>
        Nous avons hâte de célébrer ce jour avec vous.
      </p>
      <button
        type="button"
        onClick={onBack}
        className="text-[11px] uppercase tracking-[0.28em] text-[#3b2a1f]"
        style={fontSans}
      >
        Retour à l’invitation
      </button>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("invite");
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [musicHint, setMusicHint] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(MUSIC_SRC);
    audio.loop = true;
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  const toggleMusic = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    try {
      await audio.play();
      setPlaying(true);
      setMusicHint("");
    } catch {
      setMusicHint("Envoie-moi le fichier audio, je le brancherai ici.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f1e8]" style={fontSans}>
      <div className="mx-auto min-h-screen max-w-xl">
        {screen === "invite" && !open && <ClosedSplash onOpen={() => setOpen(true)} />}
        {screen === "invite" && open && (
          <OpenedInvitation
            playing={playing}
            onToggleMusic={toggleMusic}
            onOpenDetails={() => setScreen("details")}
          />
        )}
        {screen === "details" && (
          <DetailsScreen
            onBack={() => {
              setScreen("invite");
              setOpen(true);
            }}
            onGoRsvp={() => setScreen("rsvp")}
          />
        )}
        {screen === "rsvp" && (
          <RsvpScreen onBack={() => setScreen("invite")} onDone={() => setScreen("thanks")} />
        )}
        {screen === "thanks" && <ThanksScreen onBack={() => setScreen("invite")} />}
        {musicHint && (
          <p className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#3b2a1f] px-4 py-2 text-xs text-white">
            {musicHint}
          </p>
        )}
      </div>
    </div>
  );
}
