import { firestore as prisma } from "@/lib/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";

type MatchResult = {
  id: string;
  babak: string;
  skor1?: number | null;
  skor2?: number | null;
  pemenangId?: string | null;
  atlet1?: { id: string; nama: string; perguruan?: { nama: string } | null } | null;
  atlet2?: { id: string; nama: string; perguruan?: { nama: string } | null } | null;
  pemenang?: { nama: string; perguruan?: { nama: string } | null } | null;
  jadwal?: { nama: string } | null;
  kategori?: { nama: string } | null;
};

export default async function AdminHasilPage() {
  const pertandingan = await prisma.pertandingan.findMany({
    where: { status: "SELESAI" },
    include: {
      atlet1: { include: { perguruan: { select: { nama: true } } } },
      atlet2: { include: { perguruan: { select: { nama: true } } } },
      pemenang: { include: { perguruan: { select: { nama: true } } } },
      jadwal: true,
      kategori: true,
    },
    orderBy: { updatedAt: "desc" },
  }) as MatchResult[];

  const getPesertaLabel = (peserta?: { nama: string; perguruan?: { nama: string } | null } | null) => {
    if (!peserta) return "BYE";
    return peserta.perguruan?.nama ?? peserta.nama;
  };

  const getPemenangLabel = (peserta?: { nama: string; perguruan?: { nama: string } | null } | null) => {
    if (!peserta) return "-";
    return peserta.perguruan?.nama ?? peserta.nama;
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Hasil Pertandingan</h2>
        <p className="text-sm text-gray-500">Rekap semua pertandingan yang telah selesai</p>
      </div>

      {pertandingan.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-gray-400">Belum ada pertandingan selesai</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {pertandingan.map((p: MatchResult) => (
            <Card key={p.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{p.babak.replace(/_/g, " ")}</Badge>
                      {p.kategori && <Badge className="bg-blue-50 text-blue-700 text-xs border-blue-100">{p.kategori.nama}</Badge>}
                      <span className="text-xs text-gray-400">{p.jadwal?.nama ?? "Jadwal tidak tersedia"}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className={`text-sm font-medium ${p.pemenangId === p.atlet1?.id ? "text-green-700 font-bold" : "text-gray-600"}`}>
                        {getPesertaLabel(p.atlet1)}
                      </span>
                      <span className="text-gray-800 font-bold">{p.skor1 ?? 0} - {p.skor2 ?? 0}</span>
                      <span className={`text-sm font-medium ${p.pemenangId === p.atlet2?.id ? "text-green-700 font-bold" : "text-gray-600"}`}>
                        {getPesertaLabel(p.atlet2)}
                      </span>
                    </div>
                  </div>
                  {p.pemenang && (
                    <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 px-3 py-2 rounded-lg">
                      <Trophy size={16} className="text-yellow-500" />
                      <div>
                        <p className="text-xs text-yellow-600 font-medium">Pemenang</p>
                        <p className="text-sm font-bold text-yellow-800">{getPemenangLabel(p.pemenang)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
