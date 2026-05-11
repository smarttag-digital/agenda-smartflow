import type { Appointment } from "./booking-store";
import { getSettings } from "./settings-store";
import { getAvailability } from "./availability-store";

function fmt(d: Date) {
  return d.toISOString().replace(/[-:]|\.\d{3}/g, "");
}

export function googleCalendarUrl(a: Appointment): string {
  const { eventTitle } = getSettings();
  const duration = getAvailability().defaultDuration;
  const start = new Date(`${a.date}T${a.time}:00`);
  const end = new Date(start.getTime() + duration * 60 * 1000);
  const description = [
    `Cliente: ${a.name}`,
    `Telefone: ${a.phone}`,
    `Tipo: ${a.type}`,
    a.neighborhood ? `Bairro/Condomínio: ${a.neighborhood}` : null,
    a.notes ? `Observações: ${a.notes}` : null,
    "",
    "Lembrete: 30 min antes",
  ]
    .filter(Boolean)
    .join("\n");

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    eventTitle,
  )}&dates=${fmt(start)}/${fmt(end)}&details=${encodeURIComponent(description)}&location=${encodeURIComponent(
    a.neighborhood ?? "",
  )}`;
}
