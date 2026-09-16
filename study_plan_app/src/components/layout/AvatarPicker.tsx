"use client";

import { useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB upload cap
const OUTPUT_SIZE = 160; // px, square thumbnail

function isImageUrl(avatar: string | null) {
  return !!avatar && (avatar.startsWith("data:image") || avatar.startsWith("http"));
}

async function fileToSquareDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

  return canvas.toDataURL("image/jpeg", 0.85);
}

export function AvatarPicker({
  avatar,
  initial,
  onChange,
}: {
  avatar: string | null;
  initial: string;
  onChange: (avatar: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const hasPhoto = isImageUrl(avatar);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError("Image must be under 5MB.");
      return;
    }

    try {
      const dataUrl = await fileToSquareDataUrl(file);
      onChange(dataUrl);
    } catch {
      setError("Couldn't process that image.");
    }
  };

  return (
    <div className="group/avatar relative shrink-0">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        title="Change your photo"
        className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent/15 text-[13px] font-semibold text-accent transition-opacity hover:opacity-80"
      >
        {hasPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar!} alt="" className="h-full w-full object-cover" />
        ) : (
          initial
        )}

        <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover/avatar:opacity-100">
          <Camera size={14} className="text-white" />
        </span>
      </button>

      {hasPhoto && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onChange(null);
          }}
          title="Remove photo"
          className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-panel-border bg-[var(--sidebar)] text-muted opacity-0 shadow-sm transition-opacity hover:text-[var(--rose)] group-hover/avatar:opacity-100"
        >
          <Trash2 size={10} />
        </button>
      )}

      {error && (
        <p className="absolute bottom-full left-0 mb-1 w-40 rounded-md border border-panel-border bg-[var(--sidebar)] px-2 py-1 text-[11px] text-[var(--rose)] shadow-lg">
          {error}
        </p>
      )}
    </div>
  );
}
