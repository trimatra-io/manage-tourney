import { nextAuth as auth } from "@/lib/auth";
import { firestore } from "@/lib/firestore";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, Calendar, Trophy } from "lucide-react";
import Link from "next/link";
import type { SessionUser } from "@/types/session";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const perguruanId = (session.user as SessionUser).perguruanId;

  const [totalAtlet, terverifikasi, pending, pelatih] = await Promise.all([
    firestore.atlet.count({ where: { perguruanId } }),
    firestore.atlet.count({ where: { perguruanId, status: "VERIFIED" } }),
    firestore.atlet.count({ where: { perguruanId, status: "PENDING" } }),
    firestore.pelatih.count({ where: { perguruanId } }),
  ]);

  const perguruan = await firestore.perguruan.findUnique({
    where: { id: perguruanId },
    select: { nama: true },
  });

  const stats = [
    { label: "Total Atlet", value: totalAtlet, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Terverifikasi", value: terverifikasi, icon: UserCheck, color: "text-green-600", bg: "bg-green-50" },
    { label: "Pending Review", value: pending, icon: Calendar, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Total Pelatih", value: pelatih, icon: Trophy, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Selamat Datang</h2>
        <p className="text-gray-500 mt-1">{perguruan?.nama ?? "Perguruan Anda"}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`${s.bg} p-3 rounded-lg`}>
                <s.icon className={`${s.color} h-6 w-6`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-sm text-gray-500">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Menu Cepat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { href: "/dashboard/atlet", label: "Tambah Data Atlet", color: "bg-blue-600" },
              { href: "/dashboard/pelatih", label: "Tambah Data Pelatih", color: "bg-purple-600" },
              { href: "/dashboard/jadwal", label: "Lihat Jadwal", color: "bg-amber-600" },
              { href: "/dashboard/hasil", label: "Lihat Hasil", color: "bg-green-600" },
            ].map((m) => (
              <Link key={m.href} href={m.href}
                className={`block ${m.color} text-white text-center py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity`}
              >
                {m.label}
              </Link>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informasi Status Atlet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Terverifikasi", count: terverifikasi, color: "bg-green-500" },
              { label: "Pending", count: pending, color: "bg-amber-400" },
              { label: "Total", count: totalAtlet, color: "bg-blue-500" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className={`h-3 rounded-full ${item.color}`}
                  style={{ width: `${totalAtlet > 0 ? (item.count / totalAtlet) * 100 : 0}%`, minWidth: "8px", maxWidth: "100%" }} />
                <span className="text-sm text-gray-600">{item.label}: <strong>{item.count}</strong></span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
