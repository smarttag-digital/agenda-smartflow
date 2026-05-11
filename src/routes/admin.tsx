import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AdminAuthGate } from "@/components/AdminAuthGate";
import { AdminLayout } from "@/components/admin/AdminLayout";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Painel — SmartFlow Agenda" }] }),
  component: AdminShell,
});

function AdminShell() {
  return (
    <AdminAuthGate>
      {({ session, signOut }) => (
        <AdminLayout session={session} onSignOut={signOut}>
          <Outlet />
        </AdminLayout>
      )}
    </AdminAuthGate>
  );
}
