import type { Appointment } from "./booking-store";
import { formatDateBR } from "./booking-store";
import { getSettings } from "./settings-store";

export function buildWhatsAppMessage(a: Appointment): string {
  const tpl = getSettings().whatsappTemplate;
  return tpl
    .replace(/\{nome\}/g, a.name)
    .replace(/\{tipo\}/g, a.type)
    .replace(/\{data\}/g, formatDateBR(a.date))
    .replace(/\{hora\}/g, a.time)
    .replace(/\{bairro\}/g, a.neighborhood || "—")
    .replace(/\{observacoes\}/g, a.notes || "—");
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
