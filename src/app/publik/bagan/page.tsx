"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GitBranch } from "lucide-react";
import { Bracket, Seed, SeedItem, SeedTeam, IRenderSeedProps } from "react-brackets";

type Pertandingan = {
  id: string; babak: string; nomor: number; skor1?: number; skor2?: number; status: string;
  atlet1?: { id: string; nama: string; perguruan?: { id: string; nama: string } | null } | null;
  atlet2?: { id: string; nama: string; perguruan?: { id: string; nama: string } | null } | null;
  pemenang?: { id: string; nama: string } | null;
};
type Jadwal = { id: string; nama: string; status?: string };
type Kategori = { id: string; nama: string; jenis: string };
type TeamMeta = {
  id?: string;
  name: string;
  perguruanId?: string;
};
type SelectedSeed = {
  id: string;
  teams: TeamMeta[];
};
type PublicAtlet = {
  id: string;
  nama: string;
  perguruan?: { id: string; nama: string } | null;
};

const ROUND_ORDER = ["ROUND_OF_32", "ROUND_OF_16", "QUARTERFINAL", "SEMIFINAL", "FINAL"];

function buildBracketRounds(matches: Pertandingan[]) {
  const grouped: Record<string, Pertandingan[]> = {};
  matches.forEach((m) => {
    if (!grouped[m.babak]) grouped[m.babak] = [];
    grouped[m.babak].push(m);
  });
  return ROUND_ORDER.filter((r) => grouped[r]).map((roundName) => ({
    title: roundName.replace(/_/g, " "),
    seeds: grouped[roundName].map((m) => ({
      id: m.id,
      pemenangId: m.pemenang?.id,
      teams: [
        {
          name: m.atlet1?.perguruan?.nama ?? (m.atlet2 ? "WAITING.." : "waiting.."),
          id: m.atlet1?.id,
          perguruanId: m.atlet1?.perguruan?.id,
        },
        {
          name: m.atlet2?.perguruan?.nama ?? (m.atlet1 ? "WAITING.." : "waiting.."),
          id: m.atlet2?.id,
          perguruanId: m.atlet2?.perguruan?.id,
        },
      ],
    })),
  }));
}

type PublicSeedProps = IRenderSeedProps & {
  onSelect: (seed: SelectedSeed) => void;
  activeSeedId: string | null;
};

function PublicSeed({ seed, breakpoint, onSelect, activeSeedId }: PublicSeedProps) {
  const [isHovered, setIsHovered] = useState(false);
  const bracketSeed = seed as IRenderSeedProps["seed"] & { pemenangId?: string | null; teams: TeamMeta[] };
  const isWin1 = bracketSeed.teams[0]?.id && bracketSeed.teams[0].id === bracketSeed.pemenangId;
  const isWin2 = bracketSeed.teams[1]?.id && bracketSeed.teams[1].id === bracketSeed.pemenangId;
  const isActive = activeSeedId === String(bracketSeed.id);

  const handleSelectSeed = () => {
    onSelect({ id: String(bracketSeed.id), teams: bracketSeed.teams });
  };

  return (
    <Seed mobileBreakpoint={breakpoint} style={{ fontSize: 12 }}>
      <SeedItem
        style={{
          background: "#fff",
          border: isActive ? "2px solid #047857" : isHovered ? "2px solid #10b981" : "1px solid #d1fae5",
          borderRadius: 6,
          padding: 0,
          minWidth: 160,
          boxShadow: isActive ? "0 10px 25px rgba(4, 120, 87, 0.22)" : isHovered ? "0 10px 25px rgba(16, 185, 129, 0.2)" : "0 1px 3px rgba(0, 0, 0, 0.1)",
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          transform: isHovered ? "translateY(-2px)" : "translateY(0)",
          cursor: "pointer",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleSelectSeed}
      >
        <div>
          <SeedTeam style={{ background: isWin1 ? "#dcfce7" : isHovered ? "#f0fdf4" : "transparent", color: isWin1 ? "#15803d" : "#374151", padding: "6px 10px", fontWeight: isWin1 ? 700 : 400 }}>
            {seed.teams[0]?.name || "waiting.."}
          </SeedTeam>
          <div style={{ height: 1, background: "#e5e7eb" }} />
          <SeedTeam style={{ background: isWin2 ? "#dcfce7" : isHovered ? "#f0fdf4" : "transparent", color: isWin2 ? "#15803d" : "#374151", padding: "6px 10px", fontWeight: isWin2 ? 700 : 400 }}>
            {seed.teams[1]?.name || "waiting.."}
          </SeedTeam>
        </div>
      </SeedItem>
    </Seed>
  );
}

export default function PublikBaganPage() {
  const [jadwal, setJadwal] = useState<Jadwal[]>([]);
  const [kategori, setKategori] = useState<Kategori[]>([]);
  const [pertandingan, setPertandingan] = useState<Pertandingan[]>([]);
  const [selectedJadwal, setSelectedJadwal] = useState("");
  const [selectedKategori, setSelectedKategori] = useState("");
  const [selectedSeed, setSelectedSeed] = useState<SelectedSeed | null>(null);
  const [teamOneAtlet, setTeamOneAtlet] = useState<PublicAtlet[]>([]);
  const [teamTwoAtlet, setTeamTwoAtlet] = useState<PublicAtlet[]>([]);
  const [listLoading, setListLoading] = useState(false);

  const selectedJadwalLabel = selectedJadwal
    ? jadwal.find((item) => item.id === selectedJadwal)
    : null;
  const selectedKategoriLabel = selectedKategori
    ? kategori.find((item) => item.id === selectedKategori)
    : null;

  useEffect(() => {
    Promise.all([
      fetch("/api/jadwal").then((r) => r.json()),
      fetch("/api/kategori").then((r) => r.json()),
    ]).then(([j, k]) => { setJadwal(j.filter((item: Jadwal) => item.status === "PUBLISHED")); setKategori(k); });
  }, []);

  useEffect(() => {
    if (!selectedJadwal || !selectedKategori) return;
    fetch(`/api/pertandingan?jadwalId=${selectedJadwal}&kategoriId=${selectedKategori}`)
      .then((r) => r.json()).then(setPertandingan);
  }, [selectedJadwal, selectedKategori]);

  useEffect(() => {
    if (!selectedSeed) return;

    const loadTeamList = async () => {
      const teamOnePerguruanId = selectedSeed.teams[0]?.perguruanId;
      const teamTwoPerguruanId = selectedSeed.teams[1]?.perguruanId;

      setListLoading(true);
      try {
        const [teamOneRes, teamTwoRes] = await Promise.all([
          teamOnePerguruanId
            ? fetch(`/api/publik/atlet?perguruanId=${teamOnePerguruanId}&kategoriId=${selectedKategori}`)
            : Promise.resolve(null),
          teamTwoPerguruanId
            ? fetch(`/api/publik/atlet?perguruanId=${teamTwoPerguruanId}&kategoriId=${selectedKategori}`)
            : Promise.resolve(null),
        ]);

        const teamOneData = teamOneRes && teamOneRes.ok ? await teamOneRes.json() as PublicAtlet[] : [];
        const teamTwoData = teamTwoRes && teamTwoRes.ok ? await teamTwoRes.json() as PublicAtlet[] : [];

        setTeamOneAtlet(teamOneData);
        setTeamTwoAtlet(teamTwoData);
      } finally {
        setListLoading(false);
      }
    };

    void loadTeamList();
  }, [selectedSeed, selectedKategori]);

  const rounds = buildBracketRounds(pertandingan);

  const renderTeamList = (team: TeamMeta | undefined, items: PublicAtlet[]) => {
    const isByeSlot = !team || team.name === "waiting..";

    if (listLoading) {
      return (
        <div className="space-y-2 animate-pulse">
          <div className="h-3 w-3/4 rounded bg-gray-200" />
          <div className="h-3 w-2/3 rounded bg-gray-200" />
          <div className="h-3 w-4/5 rounded bg-gray-200" />
          <div className="h-3 w-1/2 rounded bg-gray-200" />
        </div>
      );
    }

    if (isByeSlot) {
      return <p className="text-sm text-amber-700">Slot kosong tidak memiliki roster tim.</p>;
    }

    if (!team?.perguruanId) {
      return <p className="text-sm text-gray-400">Data perguruan belum tersedia untuk peserta ini.</p>;
    }

    if (items.length === 0) {
      return <p className="text-sm text-gray-400">Belum ada anggota tim terverifikasi pada perguruan ini.</p>;
    }

    return (
      <ul className="space-y-1.5 text-sm text-gray-700">
        {items.map((item) => <li key={item.id}>• {item.nama}</li>)}
      </ul>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Bagan Resmi Pertandingan</h1>
        <p className="text-gray-500 mt-1">Tournament bracket resmi berdasarkan jadwal yang dipublikasikan</p>
      </div>

      <div className="flex gap-3">
        <Select value={selectedJadwal} onValueChange={(value) => {
          setSelectedJadwal(value ?? "");
          setSelectedSeed(null);
          setTeamOneAtlet([]);
          setTeamTwoAtlet([]);
        }}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Pilih jadwal...">
              {selectedJadwalLabel?.nama ?? "Pilih jadwal..."}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {jadwal.map((j) => <SelectItem key={j.id} value={j.id}>{j.nama}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={selectedKategori} onValueChange={(value) => {
          setSelectedKategori(value ?? "");
          setSelectedSeed(null);
          setTeamOneAtlet([]);
          setTeamTwoAtlet([]);
        }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Pilih kategori...">
              {selectedKategoriLabel ? `${selectedKategoriLabel.nama} (${selectedKategoriLabel.jenis})` : "Pilih kategori..."}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {kategori.map((k) => <SelectItem key={k.id} value={k.id}>{k.nama}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <GitBranch size={18} className="text-green-600" /> Bagan Pertandingan
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {rounds.length > 0 ? (
            <Bracket rounds={rounds} renderSeedComponent={(props) => (
              <PublicSeed
                {...props}
                onSelect={setSelectedSeed}
                activeSeedId={selectedSeed?.id ?? null}
              />
            )}
              swipeableProps={{ enableMouseEvents: true, animateHeight: true }} />
          ) : (
            <div className="text-center py-12 text-gray-400">
              <GitBranch className="mx-auto mb-3 text-gray-300" size={40} />
              Pilih jadwal dan kategori untuk melihat bagan
            </div>
          )}
        </CardContent>
      </Card>

      {selectedSeed && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Roster Tim {selectedSeed.teams[0]?.name ?? "Tim 1"}</CardTitle>
            </CardHeader>
            <CardContent>
              {renderTeamList(selectedSeed.teams[0], teamOneAtlet)}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Roster Tim {selectedSeed.teams[1]?.name ?? "Tim 2"}</CardTitle>
            </CardHeader>
            <CardContent>
              {renderTeamList(selectedSeed.teams[1], teamTwoAtlet)}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
