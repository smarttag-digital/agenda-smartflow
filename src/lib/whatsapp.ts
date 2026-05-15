import type { Appointment } from "./booking-store";
import { formatDateBR } from "./booking-store";
import { getSettings } from "./settings-store";

export function buildWhatsAppMessage(a: Appointment): string {
  const tpl = getSettings().whatsappTemplate;
  const firstName = a.name.trim().split(/\s+/)[0] || a.name;
  const raw = tpl
    .replace(/\{nome\}/g, firstName)
    .replace(/\{tipo\}/g, a.type)
    .replace(/\{data\}/g, formatDateBR(a.date))
    .replace(/\{hora\}/g, a.time)
    .replace(/\{bairro\}/g, a.neighborhood?.trim() || "")
    .replace(/\{observacoes\}/g, a.notes?.trim() || "");
  // Drop lines that became empty placeholders (e.g. "• ", "Obs: ")
  return raw
    .split("\n")
    .filter((line) => !/^\s*(?:•|Obs:)\s*$/.test(line))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Open chat with the *client's* phone using business template. */
export function clientWhatsAppUrl(a: Appointment): string {
  const phone = a.phone.replace(/\D/g, "");
  return `https://wa.me/55${phone}?text=${encodeURIComponent(buildWhatsAppMessage(a))}`;
}

/** Open the company commercial WhatsApp. */
export function businessWhatsAppUrl(message?: string): string {
  const number = getSettings().whatsappNumber.replace(/\D/g, "");
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${number}${text}`;
}
