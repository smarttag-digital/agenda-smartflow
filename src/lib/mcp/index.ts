import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listAppointments from "./tools/list-appointments";
import updateAppointmentStatus from "./tools/update-appointment-status";
import getAvailability from "./tools/get-availability";

const projectRef = import.meta.env['VITE_SUPABASE_PROJECT_ID'] ?? "project-ref-unset";

export default defineMcp({
  name: "agenda-smartflow",
  title: "Agenda SmartFlow",
  version: "0.1.0",
  instructions:
    "Ferramentas da agenda da corretora Letícia Souza. Use `list_appointments` para consultar agendamentos, `update_appointment_status` para confirmar/cancelar e `get_availability` para ver as regras de horários.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listAppointments, updateAppointmentStatus, getAvailability],
});
