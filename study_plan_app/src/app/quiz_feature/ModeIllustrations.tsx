import { Ear } from "lucide-react";

// Keep in sync with the .pictogram-pen-1 / .pictogram-pen-2 offset-path
// values in globals.css.
const LINE_1_PATH = "M2 13 Q 8 10, 14 13 T 26 12";
const LINE_2_PATH = "M2 20 Q 7 23, 12 20 T 22 21";

type IllustrationMode = "flashcards" | "mcq" | "freetext" | "auditive" | "combination";

function FlashcardsIllustration() {
  return (
    <div className="relative h-8 w-12 text-accent" style={{ perspective: "220px" }}>
      <div className="absolute inset-0 translate-x-1.5 translate-y-1.5 rounded-md border border-current opacity-30" />
      <div className="pictogram-flip absolute inset-0 rounded-md border border-current bg-current/15" />
    </div>
  );
}

function MultipleChoiceIllustration() {
  return (
    <svg viewBox="0 0 56 32" className="h-8 w-14 text-accent" fill="none">
      {[0, 1, 2].map((row) => {
        const y = 3 + row * 10;
        return (
          <g key={row}>
            <rect
              x="1"
              y={y}
              width="8"
              height="8"
              rx="2"
              className="stroke-current opacity-60"
              strokeWidth="1.5"
            />
            <line
              x1="14"
              y1={y + 4}
              x2="50"
              y2={y + 4}
              className="stroke-current opacity-30"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            {row === 1 && (
              <path
                d={`M3 ${y + 4} l2 2 l4 -4`}
                className="pictogram-check stroke-current"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}

function FreeTextIllustration() {
  return (
    <svg viewBox="0 0 56 32" className="h-8 w-14 text-accent" fill="none">
      <line x1="2" y1="5" x2="24" y2="5" className="stroke-current opacity-40" strokeWidth="1.5" strokeLinecap="round" />
      <text x="29" y="8.5" className="fill-current font-serif text-[11px]">
        ?
      </text>
      <path d={LINE_1_PATH} className="pictogram-line-1 stroke-current opacity-70" strokeWidth="1.5" strokeLinecap="round" />
      <path d={LINE_2_PATH} className="pictogram-line-2 stroke-current opacity-70" strokeWidth="1.5" strokeLinecap="round" />
      <g className="pictogram-pen-1">
        <path d="M-1 -2 L 3 0 L -1 2 Z" className="fill-current" />
      </g>
      <g className="pictogram-pen-2">
        <path d="M-1 -2 L 3 0 L -1 2 Z" className="fill-current" />
      </g>

      {/* tacho-style gauge: dial is visible right away, needle climbs
          slowly toward the score in parallel with the writing */}
      <g className="pictogram-gauge">
        <path
          d="M41.25 28.5 A7.5 7.5 0 1 1 48.75 28.5"
          className="stroke-current opacity-25"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <line x1="45" y1="22" x2="45" y2="15.5" className="pictogram-needle stroke-current" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="45" cy="22" r="1.2" className="fill-current" />
        <text x="45" y="31" textAnchor="middle" className="fill-current opacity-60" style={{ fontSize: 5 }}>
          %
        </text>
      </g>
    </svg>
  );
}

function AuditiveIllustration() {
  return (
    <div className="flex h-8 w-16 items-center gap-1.5 text-accent">
      <Ear size={18} className="shrink-0" />
      {/* normal, standard-shaped sound-wave brackets (concave side facing
          the ear, same as any volume/wifi icon) — the "receiving" read
          comes from real motion: each one slides in from empty space
          toward the ear, closest arriving last */}
      <svg viewBox="0 0 32 24" className="h-6 w-10" fill="none">
        <path
          d="M8 16 Q 13 12, 8 8"
          className="pictogram-wave-1 stroke-current"
          strokeWidth="1.6"
          strokeLinecap="round"
          style={{ "--wave-rest-opacity": 0.75 } as React.CSSProperties}
        />
        <path
          d="M15 19 Q 22 12, 15 5"
          className="pictogram-wave-2 stroke-current"
          strokeWidth="1.6"
          strokeLinecap="round"
          style={{ "--wave-rest-opacity": 0.5 } as React.CSSProperties}
        />
        <path
          d="M22 22 Q 31 12, 22 2"
          className="pictogram-wave-3 stroke-current"
          strokeWidth="1.6"
          strokeLinecap="round"
          style={{ "--wave-rest-opacity": 0.3 } as React.CSSProperties}
        />
      </svg>
    </div>
  );
}

const COMBINATION_SHAPES = [
  { x: "-14px", y: "-8px", cls: "bg-accent" },
  { x: "14px", y: "-8px", cls: "bg-current opacity-70" },
  { x: "-14px", y: "8px", cls: "bg-current opacity-50" },
  { x: "14px", y: "8px", cls: "bg-current opacity-30" },
];

function CombinationIllustration() {
  return (
    <div className="relative h-8 w-14 text-accent">
      {COMBINATION_SHAPES.map((shape, i) => (
        <span
          key={i}
          style={
            {
              "--stack-from-x": shape.x,
              "--stack-from-y": shape.y,
              animationDelay: `${i * 0.08}s`,
            } as React.CSSProperties
          }
          className={`pictogram-stack absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-[4px] ${shape.cls}`}
        />
      ))}
    </div>
  );
}

export function ModeIllustration({ mode }: { mode: IllustrationMode }) {
  switch (mode) {
    case "flashcards":
      return <FlashcardsIllustration />;
    case "mcq":
      return <MultipleChoiceIllustration />;
    case "freetext":
      return <FreeTextIllustration />;
    case "auditive":
      return <AuditiveIllustration />;
    case "combination":
      return <CombinationIllustration />;
  }
}
