"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { useGeoWeather } from "@/hooks/useGeoWeather";

export function TimeWidget() {
  const weather = useGeoWeather();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const timeZone = weather.timezone;

  const time = now
    ? new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZone,
      }).format(now)
    : "--:--:--";

  const dateLabel = now
    ? new Intl.DateTimeFormat("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        timeZone,
      }).format(now)
    : "";

  return (
    <div className="hover-glow flex h-full flex-col rounded-2xl border border-panel-border bg-panel p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-500">
          <Clock size={14} />
        </span>
        <h3 className="text-[19px] font-semibold text-foreground font-serif">Local Time</h3>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-1 py-2 text-center">
        <p className="text-[38px] font-light tabular-nums tracking-tight text-[var(--accent-strong)] font-serif">
          {time}
        </p>
        <p className="text-[13px] text-muted">{dateLabel}</p>
        {weather.place && <p className="mt-1 text-[11.5px] text-muted">{weather.place}</p>}
      </div>
    </div>
  );
}
