"use client";

import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  Droplets,
  MapPin,
  Moon,
  Sun,
  Sunrise,
  Sunset,
  Thermometer,
  Umbrella,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { useGeoWeather, type WeatherCondition } from "@/hooks/useGeoWeather";

const CONDITION_META: Record<
  WeatherCondition,
  { label: string; Icon: LucideIcon; gradient: string; iconClass: string }
> = {
  "clear-day": { label: "Sunny", Icon: Sun, gradient: "from-[#fde68a] to-[#f6a934]", iconClass: "text-[#6b4408]" },
  "clear-night": { label: "Clear", Icon: Moon, gradient: "from-[#1a1030] to-[#0a0d1a]", iconClass: "text-[#cbd5e1]" },
  cloudy: { label: "Cloudy", Icon: Cloud, gradient: "from-slate-400 to-slate-600", iconClass: "text-white" },
  fog: { label: "Foggy", Icon: CloudFog, gradient: "from-slate-300 to-slate-500", iconClass: "text-white" },
  drizzle: { label: "Drizzle", Icon: CloudDrizzle, gradient: "from-sky-400 to-sky-600", iconClass: "text-white" },
  rain: { label: "Rainy", Icon: CloudRain, gradient: "from-sky-600 to-slate-800", iconClass: "text-white" },
  snow: { label: "Snowy", Icon: CloudSnow, gradient: "from-slate-100 to-sky-300", iconClass: "text-slate-700" },
  thunder: {
    label: "Thunderstorm",
    Icon: CloudLightning,
    gradient: "from-violet-700 to-slate-900",
    iconClass: "text-amber-300",
  },
};

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={13} className="shrink-0 text-muted" />
      <div className="min-w-0 leading-tight">
        <p className="truncate text-[12.5px] text-[var(--text-secondary)]">{value}</p>
        <p className="truncate text-[10px] uppercase tracking-wide text-muted">{label}</p>
      </div>
    </div>
  );
}

export function WeatherWidget() {
  const weather = useGeoWeather();
  const ready = weather.status === "ready" && weather.condition;
  const meta = ready ? CONDITION_META[weather.condition!] : null;

  return (
    <div className="hover-glow flex h-full flex-col overflow-hidden rounded-2xl border border-panel-border bg-panel shadow-sm">
      <div
        className={`flex h-20 shrink-0 items-center justify-center bg-gradient-to-br ${
          meta ? meta.gradient : "from-slate-400 to-slate-600"
        }`}
      >
        {meta ? (
          <meta.Icon size={30} className={meta.iconClass} />
        ) : (
          <Cloud size={26} className="text-white/70" />
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        {ready ? (
          <>
            <div className="flex items-baseline justify-between">
              <p className="text-[28px] font-medium leading-none text-foreground font-serif">
                {weather.temperature}&deg;
              </p>
              <p className="text-[13px] text-muted">{meta!.label}</p>
            </div>
            <div className="mt-1 flex items-center gap-2 text-[12px] text-muted">
              {weather.feelsLike != null && <span>Feels like {weather.feelsLike}&deg;</span>}
              {weather.high != null && weather.low != null && (
                <span>
                  &middot; H:{weather.high}&deg; L:{weather.low}&deg;
                </span>
              )}
            </div>

            <div className="my-3 grid grid-cols-2 gap-x-3 gap-y-2.5 border-y border-panel-border py-3">
              {weather.humidity != null && (
                <DetailItem icon={Droplets} label="Humidity" value={`${weather.humidity}%`} />
              )}
              {weather.windSpeed != null && (
                <DetailItem
                  icon={Wind}
                  label="Wind"
                  value={`${weather.windSpeed} km/h${weather.windDirection ? ` ${weather.windDirection}` : ""}`}
                />
              )}
              {weather.uvIndex != null && (
                <DetailItem icon={Thermometer} label="UV Index" value={`${weather.uvIndex}`} />
              )}
              {weather.precipitationToday != null && (
                <DetailItem icon={Umbrella} label="Precip." value={`${weather.precipitationToday} mm`} />
              )}
              {weather.sunrise && <DetailItem icon={Sunrise} label="Sunrise" value={weather.sunrise} />}
              {weather.sunset && <DetailItem icon={Sunset} label="Sunset" value={weather.sunset} />}
            </div>

            <p className="mt-auto flex items-center gap-1 text-[12px] text-muted">
              <MapPin size={11} />
              {weather.place}
              {weather.usingFallbackLocation && " (approx.)"}
            </p>
          </>
        ) : (
          <p className="flex flex-1 items-center justify-center text-center text-[13px] text-muted">
            {weather.status === "error"
              ? "Weather unavailable right now."
              : "Finding your weather…"}
          </p>
        )}
      </div>
    </div>
  );
}
