import { nextAuth as auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import type { SessionUser } from "@/types/session";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  if ((session.user as SessionUser).role !== "ADMIN") redirect("/dashboard");

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-gray-50 w-full">
        <Sidebar role="ADMIN" />
        <SidebarInset className="flex flex-1 flex-col overflow-hidden">
        <Header userName={session.user?.name ?? "Admin"} role="ADMIN" />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
