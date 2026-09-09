import { useState, useEffect, useRef, useMemo } from "react";

type Screen = "invite" | "details" | "rsvp" | "thanks" | "love-story";

interface Guest {
  id: string;
  name: string;
  attending: boolean;
  events: {
    mairie: boolean;
    eglise: boolean;
    soiree: boolean;
  };
  note: string;
  registeredAt: string;
}

const MUSIC_SRC = "/music/notre-musique.mp3";
const RSVP_API = "/api/rsvp";

async function submitRsvp(payload: {
  name: string;
  mairie: boolean;
  eglise: boolean;
  soiree: boolean;
  note: string;
}): Promise<{ guest: Guest; existing: boolean }> {
  const res = await fetch(RSVP_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Impossible d’enregistrer la confirmation.");
  }
  return data as { guest: Guest; existing: boolean };
}

const WEDDING = {
  bride: "Glenne",
  groom: "Luc",
  tagline: "L'évidence d'un nous",
  date: "4 Décembre 2026",
  dateIso: "2026-12-04",
  dateShort: "04.12.2026",
  civilTime: "14:00",
  soireeTime: "18:00",
  coutumier: "Pavillon Royal",
  coutumierDetail: "Akanda Pavés, après l'École les Kikinous",
  civil: "Mairie d'Akanda",
  soiree: "Pavillon Royal",
  soireeDetail: "Akanda Pavés, après l'École les Kikinous",
  flight: "LG041226",
  theme: "Raffiné Harmonieux",
  rsvpDeadline: "20 Août 2026",
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
        className="closed-envelope relative mx-auto block w-[min(82vw,480px)]"
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

function Countdown({ compact = false }: { compact?: boolean }) {
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
    <div className={compact ? "invite-footer-countdown" : "px-2 py-2"}>
      {!compact && (
        <p className="mb-5 text-center text-sm tracking-[0.28em] text-[#8c6b52]" style={fontSans}>
          {parts.done ? "C’est le grand jour" : "L’aventure commence dans"}
        </p>
      )}
      <div className={compact ? "invite-footer-countdown-grid" : "grid grid-cols-4 gap-2"}>
        {cells.map((cell) => (
          <div key={cell.label} className="text-center">
            <p
              className={
                compact
                  ? "invite-footer-countdown-value"
                  : "text-3xl font-semibold tabular-nums leading-none sm:text-4xl"
              }
              style={{
                ...fontSerif,
                color: cell.accent ? "#c45c32" : "#3b2a1f",
              }}
            >
              {String(cell.value).padStart(2, "0")}
            </p>
            <p
              className={
                compact
                  ? "invite-footer-countdown-label"
                  : "mt-2 text-[10px] uppercase tracking-[0.18em]"
              }
              style={{
                ...(compact ? fontSerif : fontSans),
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
    <div className="closed-splash flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <p
        className="mb-3 text-[11px] uppercase tracking-[0.38em] text-[#3b2a1f]"
        style={fontSans}
      >
        Vous êtes invité par
      </p>
      <h1 className="mb-12 text-5xl text-[#3b2a1f]" style={fontScript}>
        {WEDDING.bride} &amp; {WEDDING.groom}
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
  onOpenRsvp,
  onOpenLoveStory,
  onCloseEnvelope,
}: {
  playing: boolean;
  onToggleMusic: () => void;
  onOpenDetails: () => void;
  onOpenRsvp: () => void;
  onOpenLoveStory: () => void;
  onCloseEnvelope: () => void;
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

      <div className="invite-bottom-collage">
        <div className="invite-rsvp-row">
          <button
            type="button"
            className="invite-rsvp-entry"
            onClick={onOpenRsvp}
            aria-label="Confirmer sa présence"
          >
            <img
              src="/decor/rsvp-entry.png?v=2"
              alt="Rsvp — Confirmer"
              className="invite-rsvp-entry-img"
              draggable={false}
            />
          </button>
        </div>

        <div className="invite-love-row">
          <button
            type="button"
            className="invite-love-entry"
            onClick={onOpenLoveStory}
            aria-label="Voir notre Love Story"
          >
            <img
              src="/decor/love-story-entry.png?v=1"
              alt="Love Story — Cliquez ici"
              className="invite-love-entry-img"
              draggable={false}
            />
          </button>
        </div>
      </div>

      <footer className="invite-closing">
        <p className="invite-closing-kicker">Amoureusement vôtre,</p>
        <h2 className="invite-closing-names">
          {WEDDING.bride} &amp; {WEDDING.groom}
        </h2>
        <Countdown compact />
        <img
          src="/flowers/wax-seal.png"
          alt=""
          draggable={false}
          className="invite-closing-seal"
        />
        <button type="button" className="invite-closing-close" onClick={onCloseEnvelope}>
          Fermer l&apos;enveloppe
        </button>
      </footer>
    </div>
  );
}

function DetailsScreen({
  onBack,
}: {
  onBack: () => void;
}) {
  const programItems = [
    {
      time: WEDDING.civilTime,
      date: WEDDING.dateShort,
      title: "Mariage civil à la",
      place: WEDDING.civil,
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Mairie+d%27Akanda",
    },
    {
      time: WEDDING.soireeTime,
      date: WEDDING.dateShort,
      title: "Soirée au",
      place: WEDDING.soiree,
      detail: WEDDING.soireeDetail,
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Pavillon+Royal+Akanda",
    },
  ] as const;

  const palette = ["#ED8946", "#AD8330", "#F6F7EC"];

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
              {"detail" in item && item.detail && (
                <p className="mt-1 text-[15px] text-[#8c6b52]" style={fontSerif}>
                  {item.detail}
                </p>
              )}
              <a
                href={item.mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-[15px] font-medium text-[#8c6b52]"
                style={fontSerif}
              >
                <span aria-hidden>📍</span> S’y rendre
              </a>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-10 max-w-sm text-center">
          <p className="text-[12px] uppercase tracking-[0.22em] text-[#8c6b52]" style={fontSans}>
            Vol {WEDDING.flight} · Thème {WEDDING.theme}
          </p>
          <p className="mt-3 text-2xl text-[#3b2a1f]" style={fontScript}>
            {WEDDING.tagline}
          </p>
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
                boxShadow: c.toLowerCase() === "#f6f7ec" ? "inset 0 0 0 1px rgba(59,42,31,0.18)" : undefined,
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
          <p className="mb-2 text-[#3b2a1f]" style={fontSerif}>
            Tous vos cadeaux sont bienvenus, qu’ils soient matériels ou financiers.
            Nous exprimons d’avance notre gratitude pour votre geste.
          </p>
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
      </div>
    </div>
  );
}

function RsvpScreen({
  onBack,
  onDone,
  onContinueStory,
}: {
  onBack: () => void;
  onDone: () => void;
  onContinueStory: () => void;
}) {
  const [name, setName] = useState("");
  const [mairie, setMairie] = useState(false);
  const [eglise, setEglise] = useState(false);
  const [soiree, setSoiree] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Merci d’indiquer votre nom complet.");
      return;
    }
    if (!mairie && !eglise && !soiree) {
      setError("Merci de sélectionner au moins un événement.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await submitRsvp({
        name: trimmed,
        mairie,
        eglise,
        soiree,
        note: note.trim(),
      });
      onDone();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Impossible d’enregistrer la confirmation.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const eventOptions = [
    { key: "mairie", label: "Je serai à la mairie", checked: mairie, set: setMairie },
    { key: "eglise", label: "Je serai à l'église", checked: eglise, set: setEglise },
    { key: "soiree", label: "Je serai à la soirée", checked: soiree, set: setSoiree },
  ] as const;

  return (
    <div className="rsvp-screen mx-auto flex min-h-screen max-w-lg flex-col px-6 pb-12 pt-8">
      <button
        type="button"
        onClick={onBack}
        className="mb-8 self-center text-[12px] uppercase tracking-[0.35em] text-[#5c5a3a]"
        style={fontSerif}
      >
        Retour
      </button>

      <h1 className="mb-3 text-center text-[clamp(2.75rem,11vw,3.5rem)] leading-none text-[#8a8f58]" style={fontScript}>
        Veuillez Confirmer
      </h1>
      <p
        className="mb-10 text-center text-[12px] uppercase tracking-[0.18em] text-[#6b6e45]"
        style={fontSerif}
      >
        Votre présence avant le {WEDDING.rsvpDeadline}
      </p>

      <form onSubmit={handleSubmit} className="mx-auto w-full max-w-md flex-1">
        <label className="mb-2 block text-[15px] text-[#3b2a1f]" style={fontSerif}>
          Votre nom complet
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError("");
          }}
          className="mb-8 w-full border border-[#3b2a1f]/35 bg-white px-4 py-3.5 text-[17px] text-[#3b2a1f] focus:outline-none focus:ring-1 focus:ring-[#8a8f58]"
          style={fontSerif}
          autoFocus
        />

        <p className="mb-3 text-[15px] text-[#3b2a1f]" style={fontSerif}>
          À quel événement participerez-vous?*
        </p>
        <div className="mb-8 space-y-3">
          {eventOptions.map((opt) => (
            <label
              key={opt.key}
              className="flex cursor-pointer items-center gap-3 rounded-md bg-[#e8e6e0] px-4 py-3.5"
            >
              <input
                type="checkbox"
                checked={opt.checked}
                onChange={(e) => {
                  opt.set(e.target.checked);
                  setError("");
                }}
                className="h-4 w-4 accent-[#8a8f58]"
              />
              <span className="text-[16px] text-[#3b2a1f]" style={fontSerif}>
                {opt.label}
              </span>
            </label>
          ))}
        </div>

        <label className="mb-2 block text-[15px] leading-snug text-[#3b2a1f]" style={fontSerif}>
          Avez-vous une suggestion ou remarque quelconque, Veuillez la partager ci-dessous.
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={5}
          className="mb-8 w-full resize-y border border-[#3b2a1f]/35 bg-white px-4 py-3.5 text-[16px] text-[#3b2a1f] focus:outline-none focus:ring-1 focus:ring-[#8a8f58]"
          style={fontSerif}
        />

        {error && (
          <p className="mb-4 text-center text-sm text-destructive" style={fontSans}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mb-10 w-full rounded-md bg-[#8a8f58] py-4 text-[18px] text-[#2f2f1f] hover:bg-[#7a7f4c] disabled:opacity-60"
          style={fontSerif}
        >
          {loading ? "Enregistrement…" : "Soumettre"}
        </button>
      </form>

      <div className="mt-auto flex flex-col items-center">
        <img
          src="/flowers/wax-seal.png"
          alt=""
          draggable={false}
          className="h-[72px] w-[72px] object-contain"
          style={{ filter: "drop-shadow(0 4px 10px rgba(80,45,10,0.35))" }}
        />
        <button
          type="button"
          onClick={onContinueStory}
          className="mt-4 text-[12px] uppercase tracking-[0.28em] text-[#3b2a1f]"
          style={fontSerif}
        >
          Continuer vers Love Story
        </button>
      </div>
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

function LoveStoryScreen({
  onBack,
  onCloseEnvelope,
}: {
  onBack: () => void;
  onCloseEnvelope: () => void;
}) {
  return (
    <div className="love-story">
      <div className="love-story-bg" aria-hidden />

      <button type="button" className="love-story-back" onClick={onBack}>
        Retour
      </button>

      <h1 className="love-story-title">Love Story</h1>

      <div className="love-story-envelope">
        <div className="love-story-envelope-body">
          <div className="love-story-envelope-flap" aria-hidden />
          <div className="love-story-polaroid">
            <img
              src="/photos/love-story.jpg?v=1"
              alt={`${WEDDING.groom} et ${WEDDING.bride}`}
              draggable={false}
            />
          </div>
          <div className="love-story-heart" aria-hidden>
            <svg className="love-story-heart-shape" viewBox="0 0 100 90" aria-hidden>
              <defs>
                <linearGradient id="heartGold" x1="0.3" y1="0" x2="0.8" y2="1">
                  <stop offset="0%" stopColor="#f2e2b8" />
                  <stop offset="45%" stopColor="#d4af6a" />
                  <stop offset="100%" stopColor="#a8823f" />
                </linearGradient>
              </defs>
              <path
                fill="url(#heartGold)"
                d="M50 82 C50 82 8 54 8 28 C8 14 18 6 31 6 C40 6 46 12 50 20 C54 12 60 6 69 6 C82 6 92 14 92 28 C92 54 50 82 50 82 Z"
              />
              <path
                fill="none"
                stroke="rgba(255,255,255,0.45)"
                strokeWidth="1.4"
                d="M50 76 C50 76 14 52 14 30 C14 18 22 11 32 11 C40 11 45 16 50 24 C55 16 60 11 68 11 C78 11 86 18 86 30 C86 52 50 76 50 76 Z"
              />
            </svg>
            <span>I&apos;m getting married this year</span>
          </div>
        </div>
      </div>

      <div className="love-story-text">
        <p>Nous nous sommes rencontrés comme des inconnus et avons trouvé notre âme sœur.</p>
        <p>
          Ce qui a commencé par de simples conversations s&apos;est épanoui en un amour inattendu et
          unique. Malgré la distance et le passage des saisons, nos liens n&apos;ont fait que se
          renforcer. Nous avons appris que le foyer n&apos;est pas un lieu sur une carte, mais un
          sentiment que l&apos;on trouve dans les bras de l&apos;autre.
        </p>
        <p>À travers chaque étape de notre vie, nous nous choisissons, aujourd&apos;hui et pour toujours.</p>
      </div>

      <button type="button" className="love-story-close" onClick={onCloseEnvelope}>
        Fermer l&apos;enveloppe
      </button>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("invite");
  const [loveStoryFrom, setLoveStoryFrom] = useState<"invite" | "rsvp">("invite");
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

  const stopMusicAndClose = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setPlaying(false);
    setScreen("invite");
    setOpen(false);
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
            onOpenRsvp={() => setScreen("rsvp")}
            onOpenLoveStory={() => {
              setLoveStoryFrom("invite");
              setScreen("love-story");
            }}
            onCloseEnvelope={stopMusicAndClose}
          />
        )}
        {screen === "details" && (
          <DetailsScreen
            onBack={() => {
              setScreen("invite");
              setOpen(true);
            }}
          />
        )}
        {screen === "rsvp" && (
          <RsvpScreen
            onBack={() => {
              setScreen("invite");
              setOpen(true);
            }}
            onDone={() => setScreen("thanks")}
            onContinueStory={() => {
              setLoveStoryFrom("rsvp");
              setScreen("love-story");
            }}
          />
        )}
        {screen === "love-story" && (
          <LoveStoryScreen
            onBack={() => {
              setScreen(loveStoryFrom);
              if (loveStoryFrom === "invite") setOpen(true);
            }}
            onCloseEnvelope={stopMusicAndClose}
          />
        )}
        {screen === "thanks" && (
          <ThanksScreen
            onBack={() => {
              setScreen("invite");
              setOpen(true);
            }}
          />
        )}
        {musicHint && (
          <p className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#3b2a1f] px-4 py-2 text-xs text-white">
            {musicHint}
          </p>
        )}
      </div>
    </div>
  );
}
