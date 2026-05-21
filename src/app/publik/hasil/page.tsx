import { firestore as prisma } from "@/lib/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";
import { PublikHasilExportPdfButton } from "@/components/publik-hasil-export-pdf-button";

type MatchResult = {
  id: string;
  babak: string;
  status: string;
  skor1?: number | null;
  skor2?: number | null;
  pemenangId?: string | null;
  atlet1?: { id: string; nama: string; perguruan?: { nama: string } | null } | null;
  atlet2?: { id: string; nama: string; perguruan?: { nama: string } | null } | null;
  pemenang?: { nama: string; perguruan?: { nama: string } | null } | null;
  kategori?: { nama: string } | null;
};

type JadwalResult = {
  id: string;
  nama: string;
  pertandingan: MatchResult[];
};

type MatchWithJadwal = MatchResult & {
  jadwalNama: string;
};

export default async function PublikHasilPage() {
  const jadwal = await prisma.jadwal.findMany({
    where: { status: "PUBLISHED" },
    include: {
      pertandingan: {
        where: { status: "SELESAI" },
        include: {
          atlet1: { include: { perguruan: { select: { nama: true } } } },
          atlet2: { include: { perguruan: { select: { nama: true } } } },
          pemenang: { include: { perguruan: { select: { nama: true } } } },
          kategori: true,
        },
        orderBy: { updatedAt: "desc" },
      },
    },
    orderBy: { tanggal: "desc" },
  }) as JadwalResult[];

  const allMatches: MatchWithJadwal[] = jadwal.flatMap((j: JadwalResult) =>
    j.pertandingan.map((p: MatchResult) => ({ ...p, jadwalNama: j.nama })),
  );

  const getTeamLabel = (peserta?: { nama: string; perguruan?: { nama: string } | null } | null) => (
    peserta?.perguruan?.nama ?? peserta?.nama ?? "BYE"
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Hasil & Laporan</h1>
          <p className="text-gray-500 mt-1">Rekap lengkap hasil pertandingan</p>
        </div>
        <PublikHasilExportPdfButton matches={allMatches} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Real Time List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Real Time List</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {allMatches.slice(0, 10).map((m: MatchWithJadwal) => (
              <div key={m.id} className={`flex items-center justify-between p-3 rounded-lg border text-sm ${
                m.status === "SELESAI" ? "bg-white" : "bg-amber-50 border-amber-200"
              }`}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">{m.babak.replace(/_/g, " ")}</Badge>
                    {m.kategori && <Badge className="bg-green-50 text-green-700 border-green-100 text-xs">{m.kategori.nama}</Badge>}
                  </div>
                  <div className="flex items-center gap-2 font-medium text-gray-700">
                    <span className={m.pemenangId === m.atlet1?.id ? "text-green-700 font-bold" : ""}>{getTeamLabel(m.atlet1)}</span>
                    <span className="text-gray-400 font-bold text-xs">VS</span>
                    <span className={m.pemenangId === m.atlet2?.id ? "text-green-700 font-bold" : ""}>{getTeamLabel(m.atlet2)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-800">{m.skor1 ?? 0} - {m.skor2 ?? 0}</div>
                  <Badge className={m.status === "SELESAI" ? "bg-green-100 text-green-700 text-xs" : "bg-amber-100 text-amber-700 text-xs"}>
                    {m.status === "SELESAI" ? "Selesai" : "Berlangsung"}
                  </Badge>
                </div>
              </div>
            ))}
            {allMatches.length === 0 && <p className="text-center text-gray-400 py-6">Belum ada hasil</p>}
          </CardContent>
        </Card>

        {/* Raril Results */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy size={16} className="text-yellow-500" /> Raril Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {jadwal.filter((j: JadwalResult) => j.pertandingan.some((p: MatchResult) => p.pemenangId)).map((j: JadwalResult) => {
              const final = j.pertandingan.find((p: MatchResult) => p.babak === "FINAL");
              const semis = j.pertandingan.filter((p: MatchResult) => p.babak === "SEMIFINAL");
              return (
                <div key={j.id} className="border rounded-lg overflow-hidden">
                  <div className="bg-green-600 text-white px-3 py-2 text-sm font-semibold">{j.nama}</div>
                  {final?.pemenang && (
                    <div className="p-3 bg-yellow-50 border-b border-yellow-100">
                      <div className="flex items-center gap-2">
                        <Trophy size={14} className="text-yellow-600" />
                        <span className="text-xs text-yellow-700 font-medium">Juara 1:</span>
                        <span className="text-sm font-bold text-yellow-800">{getTeamLabel(final.pemenang)}</span>
                      </div>
                    </div>
                  )}
                  <div className="p-3 space-y-1.5">
                    {j.pertandingan.slice(0, 4).map((p: MatchResult) => (
                      <div key={p.id} className="flex items-center justify-between text-xs text-gray-600">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs py-0">{p.babak.replace(/_/g, " ")}</Badge>
                          <span className={p.pemenangId === p.atlet1?.id ? "font-bold text-green-700" : ""}>{getTeamLabel(p.atlet1)}</span>
                          <span className="text-gray-400">vs</span>
                          <span className={p.pemenangId === p.atlet2?.id ? "font-bold text-green-700" : ""}>{getTeamLabel(p.atlet2)}</span>
                        </div>
                        <span className="font-medium">{p.skor1 ?? 0} - {p.skor2 ?? 0}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {jadwal.every((j: JadwalResult) => !j.pertandingan.some((p: MatchResult) => p.pemenangId)) && (
              <p className="text-center text-gray-400 py-6">Belum ada hasil final</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
