"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Sidebar as AppSidebarRoot,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Calendar,
  Trophy,
  ShieldCheck,
  Database,
  GitBranch,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const perguruanNav: NavItem[] = [
  { href: "/dashboard", label: "Beranda", icon: <LayoutDashboard size={18} /> },
  { href: "/dashboard/atlet", label: "Input Data Atlet", icon: <Users size={18} /> },
  { href: "/dashboard/pelatih", label: "Data Pelatih", icon: <UserCheck size={18} /> },
  { href: "/dashboard/jadwal", label: "Jadwal", icon: <Calendar size={18} /> },
  { href: "/dashboard/hasil", label: "Hasil", icon: <Trophy size={18} /> },
];

const adminNav: NavItem[] = [
  { href: "/admin", label: "Beranda", icon: <LayoutDashboard size={18} /> },
  { href: "/admin/verifikasi", label: "Input Data Atlet", icon: <ShieldCheck size={18} /> },
  { href: "/admin/database", label: "Database", icon: <Database size={18} /> },
  { href: "/admin/jadwal", label: "Jadwal", icon: <Calendar size={18} /> },
  { href: "/admin/bagan", label: "Bagan", icon: <GitBranch size={18} /> },
  { href: "/admin/hasil", label: "Hasil", icon: <Trophy size={18} /> },
];

export function Sidebar({ role }: { role: "ADMIN" | "PERGURUAN" }) {
  const pathname = usePathname();
  const { open } = useSidebar();
  const items = role === "ADMIN" ? adminNav : perguruanNav;

  return (
    <AppSidebarRoot collapsible="icon" className="border-gray-200 bg-white">
      <SidebarHeader
        className={cn(
          "flex min-h-16 items-center gap-2 border-b px-4 py-4 font-bold text-sm",
          role === "ADMIN" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"
        )}
      >
        <Trophy size={20} />
        {open && <span>Sistem Pertandingan</span>}
      </SidebarHeader>
      <SidebarContent className="py-3">
        <SidebarGroup>
          {open && <SidebarGroupLabel>{role === "ADMIN" ? "Menu Admin" : "Menu Perguruan"}</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    component={Link}
                    href={item.href}
                    isActive={pathname === item.href}
                    className={cn(
                      !open && "justify-center px-2",
                      pathname === item.href
                        ? role === "ADMIN"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-blue-100 text-blue-800"
                        : "text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    {item.icon}
                    {open && item.label}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-gray-200 text-xs text-gray-500">
        {open ? `${role} panel` : role.charAt(0)}
      </SidebarFooter>
    </AppSidebarRoot>
  );
}
