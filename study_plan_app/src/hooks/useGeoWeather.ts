"use client";

import { useSyncExternalStore } from "react";

// ---------------------------------------------------------------------------
// Shared location + weather store for the Time and Weather dashboard
// widgets. One geolocation request + one Open-Meteo call (free, no API key,
// CORS-enabled) feeds both widgets — same module-store + useSyncExternalStore
// shape as useAuth, so every caller stays in sync and we never fire
// the browser's location prompt twice.
// ---------------------------------------------------------------------------

const CACHE_KEY = "study-plan-weather-cache";
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
// Used only if geolocation is denied, unsupported, or times out.
const FALLBACK_COORDS = { latitude: 52.52, longitude: 13.405 }; // Berlin

export type WeatherCondition =
  | "clear-day"
  | "clear-night"
  | "cloudy"
  | "fog"
  | "drizzle"
  | "rain"
  | "snow"
  | "thunder";

export type GeoWeather = {
  status: "loading" | "ready" | "error";
  timezone: string; // IANA id, e.g. "Europe/Berlin"
  place: string; // derived from timezone, e.g. "Berlin"
  temperature: number | null;
  feelsLike: number | null;
  high: number | null;
  low: number | null;
  humidity: number | null; // %
  windSpeed: number | null; // km/h
  windDirection: string | null; // compass, e.g. "NW"
  precipitation: number | null; // mm falling right now
  precipitationToday: number | null; // mm total today
  uvIndex: number | null;
  sunrise: string | null; // "HH:MM"
  sunset: string | null; // "HH:MM"
  condition: WeatherCondition | null;
  usingFallbackLocation: boolean;
};

function placeFromTimezone(tz: string): string {
  const city = tz.split("/").pop() ?? tz;
  return city.replace(/_/g, " ");
}

function degreesToCompass(deg: number): string {
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return dirs[Math.round(deg / 22.5) % 16];
}

// Open-Meteo returns local time already (no offset suffix) when
// timezone=auto is set, e.g. "2026-09-13T06:32" -> "06:32".
function timeOfDay(iso?: string): string | null {
  if (!iso) return null;
  return iso.split("T")[1] ?? null;
}

const LOADING: GeoWeather = {
  status: "loading",
  timezone: typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC",
  place: "",
  temperature: null,
  feelsLike: null,
  high: null,
  low: null,
  humidity: null,
  windSpeed: null,
  windDirection: null,
  precipitation: null,
  precipitationToday: null,
  uvIndex: null,
  sunrise: null,
  sunset: null,
  condition: null,
  usingFallbackLocation: false,
};

function weatherCodeToCondition(code: number, isDay: boolean): WeatherCondition {
  if (code <= 1) return isDay ? "clear-day" : "clear-night";
  if (code <= 3) return "cloudy";
  if (code === 45 || code === 48) return "fog";
  if ([51, 53, 55, 56, 57].includes(code)) return "drizzle";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow";
  if ([95, 96, 99].includes(code)) return "thunder";
  return isDay ? "clear-day" : "clear-night";
}

let state: GeoWeather = LOADING;
let started = false;
const listeners = new Set<() => void>();

function setState(next: GeoWeather) {
  state = next;
  listeners.forEach((l) => l());
}

function loadCached(): GeoWeather | null {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { savedAt: number; data: GeoWeather };
    if (Date.now() - parsed.savedAt > CACHE_TTL_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function saveCache(data: GeoWeather) {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), data }));
  } catch {
    /* ignore */
  }
}

async function fetchWeather(latitude: number, longitude: number, usingFallbackLocation: boolean) {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,is_day` +
      `&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_sum` +
      `&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("weather request failed");
    const data = await res.json();

    const current = data.current ?? {};
    const daily = data.daily ?? {};
    const isDay = current.is_day === 1;
    const round = (n: unknown) => (typeof n === "number" ? Math.round(n) : null);

    const next: GeoWeather = {
      status: "ready",
      timezone: data.timezone ?? LOADING.timezone,
      place: placeFromTimezone(data.timezone ?? LOADING.timezone),
      temperature: round(current.temperature_2m),
      feelsLike: round(current.apparent_temperature),
      high: round(daily.temperature_2m_max?.[0]),
      low: round(daily.temperature_2m_min?.[0]),
      humidity: round(current.relative_humidity_2m),
      windSpeed: round(current.wind_speed_10m),
      windDirection:
        typeof current.wind_direction_10m === "number"
          ? degreesToCompass(current.wind_direction_10m)
          : null,
      precipitation: typeof current.precipitation === "number" ? current.precipitation : null,
      precipitationToday:
        typeof daily.precipitation_sum?.[0] === "number" ? daily.precipitation_sum[0] : null,
      uvIndex: round(daily.uv_index_max?.[0]),
      sunrise: timeOfDay(daily.sunrise?.[0]),
      sunset: timeOfDay(daily.sunset?.[0]),
      condition: weatherCodeToCondition(current.weather_code ?? 0, isDay),
      usingFallbackLocation,
    };
    setState(next);
    saveCache(next);
  } catch {
    setState({ ...state, status: "error" });
  }
}

function start() {
  if (started) return;
  started = true;

  const cached = loadCached();
  if (cached) setState(cached);

  if (typeof navigator === "undefined" || !navigator.geolocation) {
    fetchWeather(FALLBACK_COORDS.latitude, FALLBACK_COORDS.longitude, true);
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude, false),
    () => fetchWeather(FALLBACK_COORDS.latitude, FALLBACK_COORDS.longitude, true),
    { timeout: 8000, maximumAge: 10 * 60 * 1000 }
  );
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  start();
  return () => listeners.delete(cb);
}

function getSnapshot(): GeoWeather {
  return state;
}

function getServerSnapshot(): GeoWeather {
  return LOADING;
}

export function useGeoWeather() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
