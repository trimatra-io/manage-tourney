import { nextAuth as auth } from "@/lib/auth";
import { firestore } from "@/lib/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";
import type { SessionUser } from "@/types/session";

type MatchSummary = {
  id: string;
  babak: string;
  skor1?: number | null;
  skor2?: number | null;
  pemenangId?: string | null;
  atlet1?: { id: string; nama: string; perguruanId?: string; perguruan?: { nama: string } | null } | null;
  atlet2?: { id: string; nama: string; perguruanId?: string; perguruan?: { nama: string } | null } | null;
  pemenang?: { id: string; nama: string; perguruanId?: string; perguruan?: { nama: string } | null } | null;
  jadwal?: { nama: string } | null;
  kategori?: { nama: string } | null;
};

export default async function HasilDashboardPage() {
  const session = await auth();
  const perguruanId = (session?.user as SessionUser | undefined)?.perguruanId;

  const pertandingan = await firestore.pertandingan.findMany({
    where: { status: "SELESAI" },
    include: {
      atlet1: { include: { perguruan: { select: { nama: true } } } },
      atlet2: { include: { perguruan: { select: { nama: true } } } },
      pemenang: { include: { perguruan: { select: { nama: true } } } },
      jadwal: true,
      kategori: true,
    },
    orderBy: { updatedAt: "desc" },
  }) as MatchSummary[];

  const teamMatches = pertandingan.filter((match) => (
    match.atlet1?.perguruanId === perguruanId || match.atlet2?.perguruanId === perguruanId
  ));

  const wins = teamMatches.filter((match) => match.pemenang?.perguruanId === perguruanId).length;
  const losses = teamMatches.length - wins;

  const getTeamLabel = (peserta?: { nama: string; perguruan?: { nama: string } | null } | null) => (
    peserta?.perguruan?.nama ?? peserta?.nama ?? "BYE"
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Hasil Pertandingan</h2>
        <p className="text-sm text-gray-500">Rekap hasil tim perguruan Anda</p>
      </div>

      {teamMatches.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-gray-400">Belum ada pertandingan tim selesai</CardContent></Card>
      ) : (
        <div className="space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Statistik Tim</span>
                <div className="flex gap-2">
                  <Badge className="bg-green-100 text-green-700 text-xs">{wins} Menang</Badge>
                  <Badge variant="outline" className="text-xs">{losses} Kalah</Badge>
                </div>
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Riwayat Pertandingan Tim</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {teamMatches.map((match) => {
                const isTeamAtlet1 = match.atlet1?.perguruanId === perguruanId;
                const isWinner = match.pemenang?.perguruanId === perguruanId;
                const myScore = isTeamAtlet1 ? match.skor1 : match.skor2;
                const oppScore = isTeamAtlet1 ? match.skor2 : match.skor1;
                const opponent = isTeamAtlet1 ? match.atlet2 : match.atlet1;

                return (
                  <div
                    key={match.id}
                    className={`flex items-center justify-between text-sm p-2 rounded-lg border ${isWinner ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
                  >
                    <div className="flex items-center gap-2">
                      {isWinner ? <Trophy size={14} className="text-yellow-500" /> : <span className="text-red-400 text-xs">✗</span>}
                      <span>vs {getTeamLabel(opponent)}</span>
                      <Badge variant="outline" className="text-xs">{match.babak.replace(/_/g, " ")}</Badge>
                      {match.kategori && <Badge variant="outline" className="text-xs">{match.kategori.nama}</Badge>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${isWinner ? "text-green-700" : "text-red-700"}`}>
                        {myScore ?? 0} - {oppScore ?? 0}
                      </span>
                      <span className="text-xs text-gray-500">{match.jadwal?.nama ?? "-"}</span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
