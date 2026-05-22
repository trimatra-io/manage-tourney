import { firestore as prisma } from "@/lib/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

type JadwalKategoriSummary = {
  id: string;
  kategori: { nama: string };
};

type JadwalSummary = {
  id: string;
  nama: string;
  tanggal: string | Date;
  lokasi: string;
  jadwalKategori: JadwalKategoriSummary[];
};

export default async function JadwalDashboardPage() {
  const jadwal = await prisma.jadwal.findMany({
    where: { status: "PUBLISHED" },
    include: { jadwalKategori: { include: { kategori: true } } },
    orderBy: { tanggal: "asc" },
  }) as JadwalSummary[];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Jadwal Pertandingan</h2>
        <p className="text-sm text-gray-500">Jadwal yang telah dipublikasikan admin</p>
      </div>

      {jadwal.length === 0 ? (
        <Card>
          <CardContent className="py-14 text-center text-gray-400">
            <Calendar className="mx-auto mb-2 text-gray-300" size={40} />
            Belum ada jadwal yang dipublikasikan
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {jadwal.map((j: JadwalSummary) => (
            <Card key={j.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  {j.nama}
                  <Badge className="bg-green-100 text-green-700 border-green-200">Dipublikasikan</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar size={14} />
                  {format(new Date(j.tanggal), "EEEE, dd MMMM yyyy", { locale: id })}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin size={14} /> {j.lokasi}
                </div>
                {j.jadwalKategori.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {j.jadwalKategori.map((jk: JadwalKategoriSummary) => (
                      <Badge key={jk.id} variant="outline" className="text-xs">{jk.kategori.nama}</Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
