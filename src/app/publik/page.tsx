import { firestore as prisma } from "@/lib/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Clock } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

type JadwalKategoriSummary = {
  id: string;
  kategori: { nama: string };
};

type JadwalPublicSummary = {
  id: string;
  nama: string;
  tanggal: string | Date;
  lokasi: string;
  jadwalKategori: JadwalKategoriSummary[];
  pertandingan: Array<unknown>;
};

export default async function PublikJadwalPage() {
  const jadwal = await prisma.jadwal.findMany({
    where: { status: "PUBLISHED" },
    include: {
      jadwalKategori: { include: { kategori: true } },
      pertandingan: true,
    },
    orderBy: { tanggal: "asc" },
  }) as JadwalPublicSummary[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Jadwal Pertandingan</h1>
        <p className="text-gray-500 mt-1">Jadwal resmi pertandingan yang telah dipublikasikan</p>
      </div>

      {jadwal.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-gray-400">
            <Calendar className="mx-auto mb-3 text-gray-300" size={44} />
            <p>Belum ada jadwal yang dipublikasikan</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {jadwal.map((j: JadwalPublicSummary) => (
            <Card key={j.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <h3 className="font-bold text-lg text-gray-800">{j.nama}</h3>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-green-600" />
                        {format(new Date(j.tanggal), "EEEE, dd MMMM yyyy", { locale: id })}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock size={14} className="text-green-600" />
                        {format(new Date(j.tanggal), "HH:mm")} WIB
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-green-600" />
                        {j.lokasi}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap mt-1">
                      <span className="text-xs text-gray-500">Kategori:</span>
                      {j.jadwalKategori.length > 0 ? j.jadwalKategori.map((jk: JadwalKategoriSummary) => (
                        <Badge key={jk.id} variant="outline" className="text-xs border-green-200 text-green-700">{jk.kategori.nama}</Badge>
                      )) : <span className="text-xs text-gray-400">-</span>}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{j.pertandingan.length}</div>
                    <div className="text-xs text-gray-500">Pertandingan</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
