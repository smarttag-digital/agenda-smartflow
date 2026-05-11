import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, CalendarRange, ListChecks, Clock4, Settings, LogOut } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/Logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { Session } from "@supabase/supabase-js";

type NavItem = { to: string; label: string; icon: any; exact?: boolean };
const ITEMS: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/agenda", label: "Agenda", icon: CalendarRange },
  { to: "/admin/agendamentos", label: "Agendamentos", icon: ListChecks },
  { to: "/admin/disponibilidade", label: "Disponibilidade", icon: Clock4 },
  { to: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

export function AdminSidebar({ session, onSignOut }: { session: Session; onSignOut: () => Promise<void> }) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const path = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (to: string, exact?: boolean) => (exact ? path === to : path.startsWith(to));

  const user = session.user;
  const name = (user.user_metadata?.full_name as string) || user.email?.split("@")[0] || "Admin";
  const avatar = user.user_metadata?.avatar_url as string | undefined;
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b">
        <Link to="/admin" className="flex items-center gap-2 px-2 py-1.5">
          <Logo size={28} />
          {!collapsed && (
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-tight">SmartFlow</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Agenda</p>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Painel</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {ITEMS.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton asChild isActive={isActive(item.to, item.exact)} tooltip={item.label}>
                    <Link to={item.to} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-2">
        <div className={`flex items-center gap-2 rounded-lg p-1.5 ${collapsed ? "justify-center" : ""}`}>
          <Avatar className="h-8 w-8">
            {avatar && <AvatarImage src={avatar} alt={name} />}
            <AvatarFallback className="bg-brand-gradient text-[10px] text-white">{initials}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium">{name}</p>
              <p className="truncate text-[10px] text-muted-foreground">{user.email}</p>
            </div>
          )}
          {!collapsed && (
            <Button onClick={onSignOut} variant="ghost" size="icon" className="h-7 w-7" aria-label="Sair">
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
