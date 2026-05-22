import { firestore as prisma } from "@/lib/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Users, AlertTriangle, CheckCircle, School } from "lucide-react";

type RecentAtlet = {
  id: string;
  nama: string;
  status: string;
  perguruan: { nama: string };
};

export default async function AdminDashboardPage() {
  const [total, pending, verified, perguruan] = await Promise.all([
    prisma.atlet.count(),
    prisma.atlet.count({ where: { status: "PENDING" } }),
    prisma.atlet.count({ where: { status: "VERIFIED" } }),
    prisma.perguruan.count(),
  ]);

  const stats = [
    { label: "Total Pendaftar", value: total, icon: Users, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
    { label: "Belum Diverifikasi", value: pending, icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
    { label: "Terverifikasi", value: verified, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50", border: "border-green-100" },
    { label: "Total Perguruan", value: perguruan, icon: School, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" },
  ];

  const recentAtlet = await prisma.atlet.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { perguruan: { select: { nama: true } } },
  }) as RecentAtlet[];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Dashboard Admin</h2>
        <p className="text-gray-500 mt-1">Panel Pengelola Sistem Pertandingan</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className={`border ${s.border}`}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`${s.bg} p-3 rounded-lg`}>
                <s.icon className={`${s.color} h-6 w-6`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-gray-500 leading-tight mt-0.5">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-gray-700 mb-3">Pendaftar Terbaru</h3>
          <div className="space-y-2">
            {recentAtlet.map((a: RecentAtlet) => (
              <div key={a.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium">{a.nama}</p>
                  <p className="text-xs text-gray-500">{a.perguruan.nama}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  a.status === "VERIFIED" ? "bg-green-100 text-green-700" :
                  a.status === "REJECTED" ? "bg-red-100 text-red-700" :
                  "bg-amber-100 text-amber-700"
                }`}>
                  {a.status === "VERIFIED" ? "Terverifikasi" : a.status === "REJECTED" ? "Ditolak" : "Belum Diverifikasi"}
                </span>
              </div>
            ))}
            {recentAtlet.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Belum ada pendaftar</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
