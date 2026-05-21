"use client";

import { Bell, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { logoutAction } from "@/lib/actions/auth";
import { useRouter } from "next/navigation";

interface HeaderProps {
  userName: string;
  role: "ADMIN" | "PERGURUAN";
}

export function Header({ userName, role }: HeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await logoutAction();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="h-14 border-b bg-white flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-gray-500" />
        <h1 className="font-semibold text-gray-800">Dashboard</h1>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="text-gray-500">
          <Bell size={18} />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-2 py-1 outline-none hover:bg-accent focus-visible:bg-accent">
            <Avatar className="h-8 w-8">
              <AvatarFallback
                className={role === "ADMIN" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}
              >
                {userName?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium leading-none">{userName}</p>
              <p className={`text-xs mt-0.5 ${role === "ADMIN" ? "text-amber-600" : "text-blue-600"}`}>
                {role}
              </p>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem className="gap-2">
              <User size={14} /> Profil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 text-red-600" onClick={handleLogout}>
              <LogOut size={14} /> Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
