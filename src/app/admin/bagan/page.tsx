"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GitBranch, Trophy, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Bracket, Seed, SeedItem, SeedTeam, IRenderSeedProps } from "react-brackets";
import { jsPDF } from "jspdf";

type Pertandingan = {
  id: string; babak: string; nomor: number; skor1?: number; skor2?: number; status: string;
  atlet1?: { id: string; nama: string; perguruan?: { id: string; nama: string } | null } | null;
  atlet2?: { id: string; nama: string; perguruan?: { id: string; nama: string } | null } | null;
  pemenang?: { id: string; nama: string; perguruan?: { id: string; nama: string } | null } | null;
  kategori?: { nama: string } | null;
};
type Jadwal = { id: string; nama: string };
type Kategori = { id: string; nama: string; jenis: string };

const ROUND_ORDER = ["ROUND_OF_32", "ROUND_OF_16", "QUARTERFINAL", "SEMIFINAL", "FINAL"];

function buildBracketData(matches: Pertandingan[]) {
  const grouped: Record<string, Pertandingan[]> = {};
  matches.forEach((m) => {
    if (!grouped[m.babak]) grouped[m.babak] = [];
    grouped[m.babak].push(m);
  });

  const rounds = ROUND_ORDER.filter((r) => grouped[r]).map((roundName) => ({
    title: roundName.replace(/_/g, " "),
    seeds: grouped[roundName].map((m) => ({
      id: m.id,
      date: m.status,
      pemenangId: m.pemenang?.id,
      teams: [
        {
          name: m.atlet1?.perguruan?.nama ?? (m.atlet2 ? "WAITING.." : "waiting.."),
          id: m.atlet1?.id,
        },
        {
          name: m.atlet2?.perguruan?.nama ?? (m.atlet1 ? "WAITING.." : "waiting.."),
          id: m.atlet2?.id,
        },
      ],
    })),
  }));

  return rounds;
}

function CustomSeed({ seed, breakpoint }: IRenderSeedProps) {
  const [isHovered, setIsHovered] = useState(false);
  const bracketSeed = seed as IRenderSeedProps["seed"] & { pemenangId?: string | null };
  const isTeam1Winner = bracketSeed.teams[0]?.id && bracketSeed.teams[0]?.id === bracketSeed.pemenangId;
  const isTeam2Winner = bracketSeed.teams[1]?.id && bracketSeed.teams[1]?.id === bracketSeed.pemenangId;

  return (
    <Seed mobileBreakpoint={breakpoint} style={{ fontSize: 12 }}>
      <SeedItem
        style={{
          background: "#fff",
          border: isHovered ? "2px solid #f59e0b" : "1px solid #e5e7eb",
          borderRadius: 6,
          padding: 0,
          minWidth: 160,
          boxShadow: isHovered ? "0 10px 25px rgba(245, 158, 11, 0.2)" : "0 1px 3px rgba(0, 0, 0, 0.1)",
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          transform: isHovered ? "translateY(-2px) scale(1.02)" : "translateY(0) scale(1)",
          cursor: "pointer",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div>
          <SeedTeam style={{
            background: isTeam1Winner ? "#dcfce7" : isHovered ? "#fef3c7" : "transparent",
            color: isTeam1Winner ? "#15803d" : "#374151",
            padding: "6px 10px",
            fontWeight: isTeam1Winner ? 600 : 400,
          }}>
            {seed.teams[0]?.name || "waiting.."}
          </SeedTeam>
          <div style={{ height: 1, background: "#e5e7eb" }} />
          <SeedTeam style={{
            background: isTeam2Winner ? "#dcfce7" : isHovered ? "#fef3c7" : "transparent",
            color: isTeam2Winner ? "#15803d" : "#374151",
            padding: "6px 10px",
            fontWeight: isTeam2Winner ? 600 : 400,
          }}>
            {seed.teams[1]?.name || "waiting.."}
          </SeedTeam>
        </div>
      </SeedItem>
    </Seed>
  );
}

export default function AdminBaganPage() {
  const [jadwal, setJadwal] = useState<Jadwal[]>([]);
  const [kategori, setKategori] = useState<Kategori[]>([]);
  const [pertandingan, setPertandingan] = useState<Pertandingan[]>([]);
  const [selectedJadwal, setSelectedJadwal] = useState("");
  const [selectedKategori, setSelectedKategori] = useState("");
  const [loading, setLoading] = useState(false);
  const [editMatch, setEditMatch] = useState<Pertandingan | null>(null);
  const [editForm, setEditForm] = useState({ skor1: "", skor2: "", pemenangId: "" });

  const selectedJadwalLabel = selectedJadwal
    ? jadwal.find((item) => item.id === selectedJadwal)
    : null;
  const selectedKategoriLabel = selectedKategori
    ? kategori.find((item) => item.id === selectedKategori)
    : null;
  const getTeamLabel = (item?: { nama: string; perguruan?: { nama: string } | null } | null) => (
    item?.perguruan?.nama ?? item?.nama ?? "WAITING.."
  );

  const selectedWinnerLabel = editForm.pemenangId
    ? getTeamLabel([editMatch?.atlet1, editMatch?.atlet2].find((item) => item?.id === editForm.pemenangId))
    : null;

  useEffect(() => {
    Promise.all([
      fetch("/api/jadwal").then((r) => r.json()),
      fetch("/api/kategori").then((r) => r.json()),
    ]).then(([j, k]) => { setJadwal(j); setKategori(k); });
  }, []);

  const fetchBagan = async (jadwalId: string, kategoriId: string) => {
    if (!jadwalId || !kategoriId) {
      setPertandingan([]);
      return;
    }
    setLoading(true);
    const data = await fetch(`/api/pertandingan?jadwalId=${jadwalId}&kategoriId=${kategoriId}`).then((r) => r.json());
    setPertandingan(data);
    setLoading(false);
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchBagan(selectedJadwal, selectedKategori);
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [selectedJadwal, selectedKategori]);

  const bracketRounds = buildBracketData(pertandingan);

  const openEdit = (m: Pertandingan) => {
    setEditMatch(m);
    setEditForm({ skor1: String(m.skor1 ?? ""), skor2: String(m.skor2 ?? ""), pemenangId: m.pemenang?.id ?? "" });
  };

  const saveMatch = async () => {
    if (!editMatch) return;
    const res = await fetch(`/api/pertandingan/${editMatch.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        skor1: parseInt(editForm.skor1) || 0,
        skor2: parseInt(editForm.skor2) || 0,
        pemenangId: editForm.pemenangId || null,
        status: "SELESAI",
      }),
    });
    if (res.ok) {
      toast.success("Hasil pertandingan disimpan");
      setEditMatch(null);
      fetchBagan(selectedJadwal, selectedKategori);
    }
    else toast.error("Gagal menyimpan");
  };

  const deleteMatch = async (id: string) => {
    if (!confirm("Yakin hapus pertandingan ini?")) return;
    const res = await fetch(`/api/pertandingan/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Pertandingan dihapus");
      fetchBagan(selectedJadwal, selectedKategori);
    } else {
      toast.error("Gagal menghapus pertandingan");
    }
  };

  const formatRoundLabel = (round: string) => round.replace(/_/g, " ");

  const exportHasilPdf = () => {
    if (!selectedJadwal || !selectedKategori || pertandingan.length === 0) {
      toast.error("Pilih jadwal, kategori, dan pastikan ada data pertandingan");
      return;
    }

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 14;
    const maxWidth = pageWidth - marginX * 2;
    const rowPaddingX = 1.5;
    const rowPaddingY = 1.5;
    const lineHeight = 4;

    const columns = [
      { key: "no", title: "No", width: 12 },
      { key: "babak", title: "Babak", width: 28 },
      { key: "tim", title: "Pertandingan", width: 60 },
      { key: "skor", title: "Skor", width: 18 },
      { key: "pemenang", title: "Pemenang", width: 42 },
      { key: "status", title: "Status", width: 22 },
    ] as const;

    let y = 16;

    const drawPageHeader = (isContinued = false) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("HASIL PERTANDINGAN", marginX, y);

      if (isContinued) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text("(lanjutan)", pageWidth - marginX, y, { align: "right" });
      }

      y += 8;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Kejuaraan/Jadwal: ${selectedJadwalLabel?.nama ?? "-"}`, marginX, y);
      y += 5;
      doc.text(
        `Kategori: ${selectedKategoriLabel ? `${selectedKategoriLabel.nama} (${selectedKategoriLabel.jenis})` : "-"}`,
        marginX,
        y,
      );
      y += 5;
      doc.text(`Dicetak: ${new Date().toLocaleString("id-ID")}`, marginX, y);
      y += 6;
    };

    const drawTableHeader = () => {
      const headerHeight = 8;
      let x = marginX;

      doc.setFillColor(241, 245, 249);
      doc.rect(marginX, y, maxWidth, headerHeight, "F");
      doc.setDrawColor(203, 213, 225);
      doc.rect(marginX, y, maxWidth, headerHeight);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);

      columns.forEach((column) => {
        doc.rect(x, y, column.width, headerHeight);
        doc.text(column.title, x + rowPaddingX, y + 5);
        x += column.width;
      });

      y += headerHeight;
    };

    const ensurePageFor = (neededHeight: number) => {
      if (y + neededHeight <= pageHeight - 14) return;
      doc.addPage();
      y = 16;
      drawPageHeader(true);
      drawTableHeader();
    };

    const drawRow = (cells: string[]) => {
      const wrappedByCell = cells.map((cell, index) => {
        const availableWidth = columns[index].width - rowPaddingX * 2;
        const wrapped = doc.splitTextToSize(cell, availableWidth) as string[];
        return wrapped.length > 0 ? wrapped : [""];
      });

      const maxLines = wrappedByCell.reduce((max, wrapped) => Math.max(max, wrapped.length), 1);
      const rowHeight = maxLines * lineHeight + rowPaddingY * 2;

      ensurePageFor(rowHeight);

      let x = marginX;
      doc.setDrawColor(226, 232, 240);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);

      columns.forEach((column, index) => {
        doc.rect(x, y, column.width, rowHeight);
        doc.text(wrappedByCell[index], x + rowPaddingX, y + rowPaddingY + 3);
        x += column.width;
      });

      y += rowHeight;
    };

    drawPageHeader();
    drawTableHeader();

    const pertandinganSorted = [...pertandingan].sort((a, b) => {
      const roundDiff = ROUND_ORDER.indexOf(a.babak) - ROUND_ORDER.indexOf(b.babak);
      if (roundDiff !== 0) return roundDiff;
      return a.nomor - b.nomor;
    });

    const grouped = pertandinganSorted.reduce<Record<string, Pertandingan[]>>((acc, item) => {
      if (!acc[item.babak]) acc[item.babak] = [];
      acc[item.babak].push(item);
      return acc;
    }, {});

    ROUND_ORDER.forEach((round) => {
      const roundMatches = grouped[round];
      if (!roundMatches || roundMatches.length === 0) return;

      roundMatches.forEach((m) => {
        const team1 = getTeamLabel(m.atlet1);
        const team2 = getTeamLabel(m.atlet2);
        const winner = m.pemenang ? getTeamLabel(m.pemenang) : "Belum ditentukan";
        const status = m.status === "SELESAI" ? "Selesai" : "Belum selesai";

        drawRow([
          String(m.nomor),
          formatRoundLabel(round),
          `${team1} vs ${team2}`,
          `${m.skor1 ?? 0} - ${m.skor2 ?? 0}`,
          winner,
          status,
        ]);
      });
    });

    const totalPertandingan = pertandingan.length;
    const totalSelesai = pertandingan.filter((item) => item.status === "SELESAI").length;
    const totalBelumSelesai = totalPertandingan - totalSelesai;

    const summaryHeight = 22;
    ensurePageFor(summaryHeight);

    y += 4;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Ringkasan", marginX, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Total pertandingan: ${totalPertandingan}`, marginX, y);
    y += 5;
    doc.text(`Total selesai: ${totalSelesai}`, marginX, y);
    y += 5;
    doc.text(`Total belum selesai: ${totalBelumSelesai}`, marginX, y);

    const safeJadwal = (selectedJadwalLabel?.nama ?? "jadwal").replace(/[^a-z0-9]+/gi, "-").replace(/(^-|-$)/g, "");
    const safeKategori = (selectedKategoriLabel?.nama ?? "kategori").replace(/[^a-z0-9]+/gi, "-").replace(/(^-|-$)/g, "");
    const fileName = `hasil-pertandingan-${safeJadwal || "jadwal"}-${safeKategori || "kategori"}.pdf`;

    doc.save(fileName);
    toast.success("PDF hasil pertandingan berhasil diunduh");
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Bagan Pertandingan</h2>
        <p className="text-sm text-gray-500">Visualisasi tournament bracket dan input hasil pertandingan</p>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <Select value={selectedJadwal} onValueChange={(value) => setSelectedJadwal(value ?? "")}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Pilih jadwal...">
              {selectedJadwalLabel?.nama ?? "Pilih jadwal..."}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {jadwal.map((j) => <SelectItem key={j.id} value={j.id}>{j.nama}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={selectedKategori} onValueChange={(value) => setSelectedKategori(value ?? "")}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Pilih kategori...">
              {selectedKategoriLabel ? `${selectedKategoriLabel.nama} (${selectedKategoriLabel.jenis})` : "Pilih kategori..."}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {kategori.map((k) => <SelectItem key={k.id} value={k.id}>{k.nama}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={exportHasilPdf}
          disabled={!selectedJadwal || !selectedKategori || pertandingan.length === 0}
        >
          Export PDF Hasil
        </Button>
      </div>

      {loading ? (
        <Card><CardContent className="py-12 text-center text-gray-400">Memuat bagan...</CardContent></Card>
      ) : pertandingan.length === 0 ? (
        <Card>
          <CardContent className="py-14 text-center">
            <GitBranch className="mx-auto text-gray-300 mb-3" size={40} />
            <p className="text-gray-400">Pilih jadwal dan kategori untuk melihat bagan</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge className="bg-amber-100 text-amber-700">{pertandingan.length} Pertandingan</Badge>
            <Badge className="bg-green-100 text-green-700">
              {pertandingan.filter((p) => p.status === "SELESAI").length} Selesai
            </Badge>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><GitBranch size={16} /> Tournament Tree</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {bracketRounds.length > 0 ? (
                <Bracket
                  rounds={bracketRounds}
                  renderSeedComponent={CustomSeed}
                  swipeableProps={{ enableMouseEvents: true, animateHeight: true }}
                />
              ) : (
                <div className="text-center py-8 text-gray-400">Tidak ada data untuk ditampilkan</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Input Hasil Pertandingan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {pertandingan.filter((p) => p.atlet1 && p.atlet2).map((m) => (
                  <div key={m.id} className={`flex items-center justify-between p-3 rounded-lg border ${
                    m.status === "SELESAI" ? "bg-green-50 border-green-200" : "bg-white border-gray-200"
                  }`}>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs">{m.babak.replace(/_/g, " ")}</Badge>
                      <span className="text-sm font-medium">{getTeamLabel(m.atlet1)}</span>
                      <span className="text-gray-400 text-xs">vs</span>
                      <span className="text-sm font-medium">{getTeamLabel(m.atlet2)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {m.status === "SELESAI" && (
                        <span className="text-sm font-bold text-gray-700">{m.skor1 ?? 0} - {m.skor2 ?? 0}</span>
                      )}
                      {m.pemenang && (
                        <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 gap-1">
                          <Trophy size={10} /> {getTeamLabel(m.pemenang)}
                        </Badge>
                      )}
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => openEdit(m)}>
                        <Pencil size={12} /> Edit
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => deleteMatch(m.id)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {editMatch && (
        <Dialog open={!!editMatch} onOpenChange={() => setEditMatch(null)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>
                Input Hasil: {getTeamLabel(editMatch.atlet1)} vs {getTeamLabel(editMatch.atlet2)}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{getTeamLabel(editMatch.atlet1)}</Label>
                  <Input type="number" min="0" value={editForm.skor1} onChange={(e) => setEditForm({ ...editForm, skor1: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>{getTeamLabel(editMatch.atlet2)}</Label>
                  <Input type="number" min="0" value={editForm.skor2} onChange={(e) => setEditForm({ ...editForm, skor2: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Pemenang</Label>
                <Select value={editForm.pemenangId} onValueChange={(value) => setEditForm({ ...editForm, pemenangId: value ?? "" })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih pemenang">
                      {selectedWinnerLabel ?? "Pilih pemenang"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {editMatch.atlet1 && <SelectItem value={editMatch.atlet1.id}>{getTeamLabel(editMatch.atlet1)}</SelectItem>}
                    {editMatch.atlet2 && <SelectItem value={editMatch.atlet2.id}>{getTeamLabel(editMatch.atlet2)}</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <Button variant="outline" onClick={() => setEditMatch(null)}>Batal</Button>
              <Button className="bg-green-600 hover:bg-green-700" onClick={saveMatch}>Simpan Hasil</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
