"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Check, CloudSun, ImagePlus } from "lucide-react";
import { useGeoWeather, type WeatherCondition } from "@/hooks/useGeoWeather";

const COVER_KEY = "study-plan-dashboard-cover";

// Original artwork (drawn for this app, so fully license-free) — same
// treatment as Notion's built-in cover gallery: a few good defaults plus
// room to upload your own.
const PRESET_COVERS = [
  { id: "sunny-sky", label: "Sunny", src: "/covers/sunny-sky.svg" },
  { id: "overcast-sky", label: "Overcast", src: "/covers/overcast-sky.svg" },
  { id: "rainy-sky", label: "Rainy", src: "/covers/rainy-sky.svg" },
  { id: "snowy-sky", label: "Snowy", src: "/covers/snowy-sky.svg" },
  { id: "amber-dawn", label: "Amber Dawn", src: "/covers/amber-dawn.svg" },
  { id: "deep-focus", label: "Deep Focus", src: "/covers/deep-focus.svg" },
  { id: "rose-bloom", label: "Rose Bloom", src: "/covers/rose-bloom.svg" },
  { id: "meadow-teal", label: "Meadow", src: "/covers/meadow-teal.svg" },
];
const DEFAULT_COVER_ID = "sunny-sky";

// Which preset stands in for each live weather condition when the cover is
// left on "auto".
const WEATHER_COVER_ID: Record<WeatherCondition, string> = {
  "clear-day": "sunny-sky",
  "clear-night": "deep-focus",
  cloudy: "overcast-sky",
  fog: "overcast-sky",
  drizzle: "rainy-sky",
  rain: "rainy-sky",
  thunder: "rainy-sky",
  snow: "snowy-sky",
};

type CoverValue =
  | { type: "auto" }
  | { type: "preset"; id: string }
  | { type: "custom"; dataUrl: string };

// Auto (follows the viewer's current weather) is the default until someone
// picks a specific cover or uploads their own.
function readCover(): CoverValue {
  try {
    const raw = window.localStorage.getItem(COVER_KEY);
    if (raw) return JSON.parse(raw) as CoverValue;
  } catch {
    /* ignore */
  }
  return { type: "auto" };
}

function presetSrc(id: string): string {
  return PRESET_COVERS.find((c) => c.id === id)?.src ?? PRESET_COVERS[0].src;
}

function coverSrc(cover: CoverValue, weatherCondition: WeatherCondition | null): string {
  if (cover.type === "custom") return cover.dataUrl;
  if (cover.type === "preset") return presetSrc(cover.id);
  return presetSrc(weatherCondition ? WEATHER_COVER_ID[weatherCondition] : DEFAULT_COVER_ID);
}

export function DashboardCover() {
  const weather = useGeoWeather();
  const [cover, setCover] = useState<CoverValue>({ type: "auto" });
  const [open, setOpen] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCover(readCover());
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const saveCover = (next: CoverValue) => {
    setCover(next);
    setUploadError(null);
    try {
      window.localStorage.setItem(COVER_KEY, JSON.stringify(next));
    } catch {
      setUploadError("That image is too large to save. Try a smaller one.");
    }
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setUploadError("Please choose an image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        saveCover({ type: "custom", dataUrl: reader.result });
        setOpen(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const isAuto = cover.type === "auto";

  return (
    // Not overflow-hidden here — only the image box below clips. The picker
    // popover is a sibling of that box so it can render its full height
    // instead of being cropped by the cover's own clipping.
    <div ref={containerRef} className="group relative -mx-4 -mt-2 mb-6 sm:-mx-8">
      <div className="relative h-40 w-full overflow-hidden sm:h-52">
        {/* eslint-disable-next-line @next/next/no-img-element -- data: URLs from user uploads aren't Image-optimizable */}
        <img src={coverSrc(cover, weather.condition)} alt="" className="h-full w-full object-cover" />

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg border border-white/15 bg-black/40 px-3 py-1.5 text-[13px] font-medium text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/55 group-hover:opacity-100 sm:right-6"
        >
          <Camera size={14} />
          Change cover
        </button>
      </div>

      {open && (
        <div className="absolute right-3 top-full z-20 mt-2 max-h-[70vh] w-72 overflow-y-auto rounded-xl border border-panel-border bg-[var(--sidebar)] p-3 shadow-2xl sm:right-6">
          <p className="mb-2 px-1 text-[11.5px] font-medium uppercase tracking-wider text-muted">
            Cover
          </p>

          <button
            type="button"
            onClick={() => saveCover({ type: "auto" })}
            className={`mb-2 flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left text-[13px] transition-colors ${
              isAuto
                ? "border-[var(--accent-strong)] bg-[var(--overlay)] text-foreground"
                : "border-panel-border text-[var(--text-secondary)] hover:bg-[var(--overlay)]"
            }`}
          >
            <CloudSun size={15} className="shrink-0 text-accent" />
            <span className="flex-1">Match current weather</span>
            {isAuto && <Check size={13} strokeWidth={3} className="shrink-0 text-[var(--accent-strong)]" />}
          </button>

          <div className="grid grid-cols-2 gap-2">
            {PRESET_COVERS.map((preset) => {
              const active = cover.type === "preset" && cover.id === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => saveCover({ type: "preset", id: preset.id })}
                  className={`group/thumb relative h-14 overflow-hidden rounded-lg border transition-colors ${
                    active ? "border-[var(--accent-strong)]" : "border-panel-border hover:border-[var(--overlay-strong)]"
                  }`}
                  title={preset.label}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preset.src} alt={preset.label} className="h-full w-full object-cover" />
                  {active && (
                    <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent-strong)] text-accent-foreground">
                      <Check size={11} strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-panel-border px-3 py-2 text-[13px] text-muted transition-colors hover:bg-[var(--overlay)] hover:text-foreground"
          >
            <ImagePlus size={14} />
            Upload your own
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
          {uploadError && <p className="mt-2 px-1 text-[12px] text-rose">{uploadError}</p>}
        </div>
      )}
    </div>
  );
}
