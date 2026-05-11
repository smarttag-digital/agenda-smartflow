// Client-side availability rules (localStorage). Backend integration later.
const KEY = "sf_agenda_availability_v1";

export type DayHours = { enabled: boolean; start: string; end: string };

export type Availability = {
  weeklyHours: DayHours[]; // index 0=Sun..6=Sat
  blockedDates: string[]; // yyyy-MM-dd
  blockedSlots: { date: string; time: string }[];
  interval: 15 | 30 | 60; // step between slots
  defaultDuration: number; // minutes
  dailyLimit: number; // max appointments per day
  minNoticeHours: number; // minimum hours of notice
  maxAdvanceDays: number; // max days ahead bookable
};

export const DEFAULT_AVAILABILITY: Availability = {
  weeklyHours: [
    { enabled: false, start: "09:00", end: "18:00" }, // Sun
    { enabled: true, start: "09:00", end: "18:00" }, // Mon
    { enabled: true, start: "09:00", end: "18:00" },
    { enabled: true, start: "09:00", end: "18:00" },
    { enabled: true, start: "09:00", end: "18:00" },
    { enabled: true, start: "09:00", end: "18:00" }, // Fri
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

export function getAvailability(): Availability {
  if (typeof window === "undefined") return DEFAULT_AVAILABILITY;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_AVAILABILITY;
    return { ...DEFAULT_AVAILABILITY, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_AVAILABILITY;
  }
}

export function saveAvailability(a: Availability) {
  localStorage.setItem(KEY, JSON.stringify(a));
}

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

export function getDayConfig(dateISO: string): DayHours | null {
  const a = getAvailability();
  if (a.blockedDates.includes(dateISO)) return null;
  const [y, m, d] = dateISO.split("-").map(Number);
  const wd = new Date(y, m - 1, d).getDay();
  const cfg = a.weeklyHours[wd];
  return cfg.enabled ? cfg : null;
}

export function isBlockedSlot(dateISO: string, time: string): boolean {
  const a = getAvailability();
  return a.blockedSlots.some((b) => b.date === dateISO && b.time === time);
}
