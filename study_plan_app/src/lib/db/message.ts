import { getStreakByUserId } from "./streak";
import { getUserById } from "./user";

const STREAK_THRESHOLD = 3;

// Liste möglicher Nachrichten pro Kategorie - aktuell je eine, aber so lassen
// sich später leicht weitere Varianten pro Kategorie ergänzen (wird dann
// zufällig ausgewählt).
const MESSAGES = {
  streak: (name: string) => [`Keep going, ${name}!`],
  morning: (name: string) => [`Good morning, ${name}.`],
  midday: (name: string) => [`Hello, ${name}.`],
  evening: (name: string) => [`Good evening, ${name}.`],
};

function pickCategory(streak: number, hour: number): keyof typeof MESSAGES {
  if (streak > STREAK_THRESHOLD) return "streak";
  if (hour < 12) return "morning";
  if (hour < 18) return "midday";
  return "evening";
}

export async function getTodaysMessage(uid : number, date: string) {
  const [streakData, user] = await Promise.all([
    getStreakByUserId(uid),
    getUserById(uid),
  ]);

  const name = user?.name ?? "there";
  const hour = new Date().getHours();
  const category = pickCategory(streakData.currentStreak, hour);
  const candidates = MESSAGES[category](name);

  return candidates[Math.floor(Math.random() * candidates.length)];
}
