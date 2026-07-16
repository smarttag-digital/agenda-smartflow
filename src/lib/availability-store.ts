// Availability rules — now persisted in the database (`availability_config`).
// This module keeps only the types and pure helpers used by both admin and public pages.

export type DayHours = { enabled: boolean; start: string; end: string };

export type Availability = {
  weeklyHours: DayHours[]; // index 0=Sun..6=Sat
  blockedDates: string[]; // yyyy-MM-dd
  blockedSlots: { date: string; time: string }[];
  interval: 15 | 30 | 60;
  defaultDuration: number;
  dailyLimit: number;
  minNoticeHours: number;
  maxAdvanceDays: number;
};

export const DEFAULT_AVAILABILITY: Availability = {
  weeklyHours: [
    { enabled: false, start: "09:00", end: "18:00" }, // Sun
    { enabled: true, start: "09:00", end: "18:00" },  // Mon
    { enabled: true, start: "09:00", end: "18:00" },
    { enabled: true, start: "09:00", end: "18:00" },
    { enabled: true, start: "09:00", end: "18:00" },
    { enabled: true, start: "09:00", end: "18:00" },  // Fri
    { enabled: false, start: "09:00", end: "13:00" }, // Sat
  ],
  blockedDates: [],
  blockedSlots: [],
  interval: 30,
  defaultDuration: 60,
  dailyLimit: 8,
  minNoticeHours: 2,
  maxAdvanceDays: 30,
};

export function generateTimeSlots(start: string, end: string, interval: number): string[] {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  const out: string[] = [];
  for (let m = startMin; m + interval <= endMin + 1; m += interval) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    out.push(`${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`);
  }
  return out;
}

export function getDayConfig(a: Availability, dateISO: string): DayHours | null {
  if (a.blockedDates.includes(dateISO)) return null;
  const [y, m, d] = dateISO.split("-").map(Number);
  const wd = new Date(y, m - 1, d).getDay();
  const cfg = a.weeklyHours[wd];
  return cfg && cfg.enabled ? cfg : null;
}

export function isBlockedSlot(a: Availability, dateISO: string, time: string): boolean {
  return a.blockedSlots.some((b) => b.date === dateISO && b.time === time);
}
