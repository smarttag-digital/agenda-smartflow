const KEY = "sf_agenda_settings_v1";

export type Theme = "light" | "dark" | "system";

export type Settings = {
  theme: Theme;
  whatsappNumber: string; // digits only (with country code)
  whatsappTemplate: string;
  notifyEmail: boolean;
  notifyWhatsapp: boolean;
  remind30min: boolean;
  syncGoogleCalendar: boolean;
  eventTitle: string;
};

export const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  whatsappNumber: "5515997546750",
  whatsappTemplate:
    "Olá {nome}! Confirmando seu agendamento SmartFlow:\n\n• {tipo}\n• {data} às {hora}\n• {bairro}\n\nObs: {observacoes}",
  notifyEmail: true,
  notifyWhatsapp: true,
  remind30min: true,
  syncGoogleCalendar: true,
  eventTitle: "Visita ao imóvel • Corretora Letícia Souza",
};

export function getSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: Settings) {
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function applyTheme(theme: Theme) {
  if (typeof window === "undefined") return;
  const root = document.documentElement;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const dark = theme === "dark" || (theme === "system" && prefersDark);
  root.classList.toggle("dark", dark);
}
