"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Check, ImagePlus } from "lucide-react";

const COVER_KEY_PREFIX = "study-plan-courses-cover";
const coverKey = (courseId: number) => `${COVER_KEY_PREFIX}:${courseId}`;
const OUTPUT_WIDTH = 1200;
const OUTPUT_HEIGHT = 300; // matches the banner's 4:1-ish aspect ratio

// Original artwork (drawn for this app, so fully license-free) — study-themed
// counterpart to the dashboard's weather covers.
const PRESET_COVERS = [
  { id: "open-book", label: "Open Book", src: "/covers/open-book.svg" },
  { id: "study-desk", label: "Study Desk", src: "/covers/study-desk.svg" },
  { id: "library-shelf", label: "Library", src: "/covers/library-shelf.svg" },
  { id: "graduation-cap", label: "Graduation", src: "/covers/graduation-cap.svg" },
];
const DEFAULT_COVER_ID = "open-book";

type CoverValue = { type: "preset"; id: string } | { type: "custom"; dataUrl: string };

function readCover(courseId: number): CoverValue {
  try {
    const raw = window.localStorage.getItem(coverKey(courseId));
    if (raw) return JSON.parse(raw) as CoverValue;
  } catch {
    /* ignore */
  }
  return { type: "preset", id: DEFAULT_COVER_ID };
}

function presetSrc(id: string): string {
  return PRESET_COVERS.find((c) => c.id === id)?.src ?? PRESET_COVERS[0].src;
}

function coverSrc(cover: CoverValue): string {
  return cover.type === "custom" ? cover.dataUrl : presetSrc(cover.id);
}

async function fileToBannerDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const targetRatio = OUTPUT_WIDTH / OUTPUT_HEIGHT;
  const srcRatio = bitmap.width / bitmap.height;

  // Center-crop to the banner's aspect ratio before downscaling, so custom
  // uploads fill the strip the same way the SVG presets do (object-cover).
  let sx = 0, sy = 0, sw = bitmap.width, sh = bitmap.height;
  if (srcRatio > targetRatio) {
    sw = bitmap.height * targetRatio;
    sx = (bitmap.width - sw) / 2;
  } else {
    sh = bitmap.width / targetRatio;
    sy = (bitmap.height - sh) / 2;
  }

  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_WIDTH;
  canvas.height = OUTPUT_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);

  return canvas.toDataURL("image/jpeg", 0.85);
}

export function CoursesCover({ courseId }: { courseId: number }) {
  const [cover, setCover] = useState<CoverValue>({ type: "preset", id: DEFAULT_COVER_ID });
  const [open, setOpen] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCover(readCover(courseId));
  }, [courseId]);

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
      window.localStorage.setItem(coverKey(courseId), JSON.stringify(next));
    } catch {
      setUploadError("That image is too large to save. Try a smaller one.");
    }
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setUploadError("Please choose an image file.");
      return;
    }
    try {
      const dataUrl = await fileToBannerDataUrl(file);
      saveCover({ type: "custom", dataUrl });
      setOpen(false);
    } catch {
      setUploadError("Couldn't process that image.");
    }
  };

  return (
    <div ref={containerRef} className="group relative -mx-4 -mt-2 mb-6 sm:-mx-8">
      <div className="relative h-32 w-full overflow-hidden rounded-b-2xl sm:h-44">
        {/* eslint-disable-next-line @next/next/no-img-element -- data: URLs from user uploads aren't Image-optimizable */}
        <img src={coverSrc(cover)} alt="" className="h-full w-full object-cover" />

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg border border-white/15 bg-black/40 px-3 py-1.5 text-[13px] font-medium text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/55 group-hover:opacity-100 sm:right-6"
        >
          <Camera size={14} />
          Change header
        </button>
      </div>

      {open && (
        <div className="absolute right-3 top-full z-20 mt-2 max-h-[70vh] w-72 overflow-y-auto rounded-xl border border-panel-border bg-[var(--sidebar)] p-3 shadow-2xl sm:right-6">
          <p className="mb-2 px-1 text-[11.5px] font-medium uppercase tracking-wider text-muted">
            Header
          </p>

          <div className="grid grid-cols-2 gap-2">
            {PRESET_COVERS.map((preset) => {
              const active = cover.type === "preset" && cover.id === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => saveCover({ type: "preset", id: preset.id })}
                  className={`group/thumb relative h-14 overflow-hidden rounded-lg border transition-colors ${
                    active
                      ? "border-[var(--accent-strong)]"
                      : "border-panel-border hover:border-[var(--overlay-strong)]"
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
