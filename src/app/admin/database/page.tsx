"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { ArrowDown, ArrowUp, ArrowUpDown, Filter, GitBranch, Save } from "lucide-react";
import { toast } from "sonner";
import { Bracket, Seed, SeedItem, SeedTeam, IRenderSeedProps } from "react-brackets";

type AtletRecord = {
  id: string;
  nama?: string;
  status: string;
  perguruanId?: string;
  perguruan?: { nama: string } | null;
  kategori?: { id: string; nama: string } | null;
};

type PerguruanSummary = {
  id: string;
  nama: string;
  totalAtlet: number;
  verified: number;
  pending: number;
  rejected: number;
  statusLabel: string;
  statusTone: "green" | "amber" | "red" | "slate";
};

type PerguruanDetail = PerguruanSummary & {
  atlet: AtletRecord[];
};

type Jadwal = { id: string; nama: string; status: string };
type Kategori = { id: string; nama: string; jenis: string };

type Pertandingan = {
  id: string;
  babak: string;
  nomor: number;
  atlet1?: { id: string; nama: string; perguruan?: { id: string; nama: string } | null } | null;
  atlet2?: { id: string; nama: string; perguruan?: { id: string; nama: string } | null } | null;
  pemenang?: { id: string; nama: string } | null;
};

const ROUND_ORDER = ["ROUND_OF_32", "ROUND_OF_16", "QUARTERFINAL", "SEMIFINAL", "FINAL"];

const EXAMPLE_PREVIEW_MATCHES: Pertandingan[] = [
  {
    id: "example-r16-1",
    babak: "ROUND_OF_16",
    nomor: 1,
    atlet1: { id: "ex-a1", nama: "Raka", perguruan: { id: "pg-1", nama: "Garuda Arena" } },
    atlet2: { id: "ex-a2", nama: "Bima", perguruan: { id: "pg-2", nama: "Naga Putih" } },
    pemenang: { id: "ex-a1", nama: "Raka" },
  },
  {
    id: "example-r16-2",
    babak: "ROUND_OF_16",
    nomor: 2,
    atlet1: { id: "ex-a3", nama: "Satria", perguruan: { id: "pg-3", nama: "Rajawali Timur" } },
    atlet2: { id: "ex-a4", nama: "Reno", perguruan: { id: "pg-4", nama: "Macan Kencana" } },
    pemenang: { id: "ex-a4", nama: "Reno" },
  },
  {
    id: "example-r16-3",
    babak: "ROUND_OF_16",
    nomor: 3,
    atlet1: { id: "ex-a5", nama: "Dion", perguruan: { id: "pg-5", nama: "Elang Selatan" } },
    atlet2: { id: "ex-a6", nama: "Yoga", perguruan: { id: "pg-6", nama: "Bintang Utara" } },
    pemenang: { id: "ex-a5", nama: "Dion" },
  },
  {
    id: "example-r16-4",
    babak: "ROUND_OF_16",
    nomor: 4,
    atlet1: { id: "ex-a7", nama: "Fajar", perguruan: { id: "pg-7", nama: "Harimau Muda" } },
    atlet2: { id: "ex-a8", nama: "Iqbal", perguruan: { id: "pg-8", nama: "Cakra Jaya" } },
    pemenang: { id: "ex-a8", nama: "Iqbal" },
  },
  {
    id: "example-r16-5",
    babak: "ROUND_OF_16",
    nomor: 5,
    atlet1: { id: "ex-a9", nama: "Rizky", perguruan: { id: "pg-9", nama: "Singa Laut" } },
    atlet2: { id: "ex-a10", nama: "Bagas", perguruan: { id: "pg-10", nama: "Wira Bhakti" } },
    pemenang: { id: "ex-a10", nama: "Bagas" },
  },
  {
    id: "example-r16-6",
    babak: "ROUND_OF_16",
    nomor: 6,
    atlet1: { id: "ex-a11", nama: "Ardi", perguruan: { id: "pg-11", nama: "Tunas Muda" } },
    atlet2: { id: "ex-a12", nama: "Rendi", perguruan: { id: "pg-12", nama: "Bhala Sakti" } },
    pemenang: { id: "ex-a11", nama: "Ardi" },
  },
  {
    id: "example-r16-7",
    babak: "ROUND_OF_16",
    nomor: 7,
    atlet1: { id: "ex-a13", nama: "Galih", perguruan: { id: "pg-13", nama: "Pusaka Jaya" } },
    atlet2: { id: "ex-a14", nama: "Rian", perguruan: { id: "pg-14", nama: "Mandala Putra" } },
    pemenang: { id: "ex-a14", nama: "Rian" },
  },
  {
    id: "example-r16-8",
    babak: "ROUND_OF_16",
    nomor: 8,
    atlet1: { id: "ex-a15", nama: "Yusuf", perguruan: { id: "pg-15", nama: "Langit Merah" } },
    atlet2: { id: "ex-a16", nama: "Adit", perguruan: { id: "pg-16", nama: "Merpati Emas" } },
    pemenang: { id: "ex-a16", nama: "Adit" },
  },
  {
    id: "example-qf-1",
    babak: "QUARTERFINAL",
    nomor: 9,
    atlet1: { id: "ex-a1", nama: "Raka", perguruan: { id: "pg-1", nama: "Garuda Arena" } },
    atlet2: { id: "ex-a4", nama: "Reno", perguruan: { id: "pg-4", nama: "Macan Kencana" } },
    pemenang: { id: "ex-a4", nama: "Reno" },
  },
  {
    id: "example-qf-2",
    babak: "QUARTERFINAL",
    nomor: 10,
    atlet1: { id: "ex-a5", nama: "Dion", perguruan: { id: "pg-5", nama: "Elang Selatan" } },
    atlet2: { id: "ex-a8", nama: "Iqbal", perguruan: { id: "pg-8", nama: "Cakra Jaya" } },
    pemenang: { id: "ex-a8", nama: "Iqbal" },
  },
  {
    id: "example-qf-3",
    babak: "QUARTERFINAL",
    nomor: 11,
    atlet1: { id: "ex-a10", nama: "Bagas", perguruan: { id: "pg-10", nama: "Wira Bhakti" } },
    atlet2: { id: "ex-a11", nama: "Ardi", perguruan: { id: "pg-11", nama: "Tunas Muda" } },
    pemenang: { id: "ex-a11", nama: "Ardi" },
  },
  {
    id: "example-qf-4",
    babak: "QUARTERFINAL",
    nomor: 12,
    atlet1: { id: "ex-a14", nama: "Rian", perguruan: { id: "pg-14", nama: "Mandala Putra" } },
    atlet2: { id: "ex-a16", nama: "Adit", perguruan: { id: "pg-16", nama: "Merpati Emas" } },
    pemenang: { id: "ex-a16", nama: "Adit" },
  },
  {
    id: "example-sf-1",
    babak: "SEMIFINAL",
    nomor: 13,
    atlet1: { id: "ex-a4", nama: "Reno", perguruan: { id: "pg-4", nama: "Macan Kencana" } },
    atlet2: { id: "ex-a8", nama: "Iqbal", perguruan: { id: "pg-8", nama: "Cakra Jaya" } },
    pemenang: { id: "ex-a8", nama: "Iqbal" },
  },
  {
    id: "example-sf-2",
    babak: "SEMIFINAL",
    nomor: 14,
    atlet1: { id: "ex-a11", nama: "Ardi", perguruan: { id: "pg-11", nama: "Tunas Muda" } },
    atlet2: { id: "ex-a16", nama: "Adit", perguruan: { id: "pg-16", nama: "Merpati Emas" } },
    pemenang: { id: "ex-a16", nama: "Adit" },
  },
  {
    id: "example-final",
    babak: "FINAL",
    nomor: 15,
    atlet1: { id: "ex-a8", nama: "Iqbal", perguruan: { id: "pg-8", nama: "Cakra Jaya" } },
    atlet2: { id: "ex-a16", nama: "Adit", perguruan: { id: "pg-16", nama: "Merpati Emas" } },
    pemenang: { id: "ex-a16", nama: "Adit" },
  },
];

function buildBracketRounds(matches: Pertandingan[]) {
  const grouped: Record<string, Pertandingan[]> = {};
  matches.forEach((match) => {
    if (!grouped[match.babak]) grouped[match.babak] = [];
    grouped[match.babak].push(match);
  });

  return ROUND_ORDER.filter((round) => grouped[round]).map((round) => ({
    title: round.replace(/_/g, " "),
    seeds: grouped[round].map((match) => ({
      id: match.id,
      pemenangId: match.pemenang?.id,
      teams: [
        {
          id: match.atlet1?.id,
          name: match.atlet1?.perguruan?.nama ?? (match.atlet2 ? "WAITING.." : "waiting.."),
        },
        {
          id: match.atlet2?.id,
          name: match.atlet2?.perguruan?.nama ?? (match.atlet1 ? "WAITING.." : "waiting.."),
        },
      ],
    })),
  }));
}

function PreviewSeed({ seed, breakpoint }: IRenderSeedProps) {
  const bracketSeed = seed as IRenderSeedProps["seed"] & { pemenangId?: string | null };
  const team1Win = bracketSeed.teams[0]?.id && bracketSeed.teams[0].id === bracketSeed.pemenangId;
  const team2Win = bracketSeed.teams[1]?.id && bracketSeed.teams[1].id === bracketSeed.pemenangId;

  return (
    <Seed mobileBreakpoint={breakpoint} style={{ fontSize: 12 }}>
      <SeedItem style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 6, minWidth: 160, padding: 0 }}>
        <div>
          <SeedTeam style={{ background: team1Win ? "#dcfce7" : "transparent", color: team1Win ? "#15803d" : "#374151", padding: "6px 10px", fontWeight: team1Win ? 700 : 400 }}>
            {seed.teams[0]?.name || "waiting.."}
          </SeedTeam>
          <div style={{ height: 1, background: "#e5e7eb" }} />
          <SeedTeam style={{ background: team2Win ? "#dcfce7" : "transparent", color: team2Win ? "#15803d" : "#374151", padding: "6px 10px", fontWeight: team2Win ? 700 : 400 }}>
            {seed.teams[1]?.name || "waiting.."}
          </SeedTeam>
        </div>
      </SeedItem>
    </Seed>
  );
}

export default function DatabasePage() {
  const [atlet, setAtlet] = useState<AtletRecord[]>([]);
  const [jadwal, setJadwal] = useState<Jadwal[]>([]);
  const [kategori, setKategori] = useState<Kategori[]>([]);
  const [selectedJadwal, setSelectedJadwal] = useState("");
  const [selectedKategori, setSelectedKategori] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [previewMatches, setPreviewMatches] = useState<Pertandingan[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailPerguruan, setDetailPerguruan] = useState<PerguruanDetail | null>(null);
  const [previewScale, setPreviewScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [usingExamplePreview, setUsingExamplePreview] = useState(false);

  const previewViewportRef = useRef<HTMLDivElement | null>(null);
  const panStartRef = useRef({ x: 0, y: 0, left: 0, top: 0 });

  const selectedKategoriLabel = selectedKategori
    ? kategori.find((item) => item.id === selectedKategori)
    : null;
  const selectedJadwalLabel = selectedJadwal
    ? jadwal.find((item) => item.id === selectedJadwal)
    : null;

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [a, j, k] = await Promise.all([
      fetch("/api/atlet?status=VERIFIED").then((r) => r.json()),
      fetch("/api/jadwal").then((r) => r.json()),
      fetch("/api/kategori").then((r) => r.json()),
    ]);
    setAtlet(a);
    setJadwal(j);
    setKategori(k);
    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchAll();
    });
  }, [fetchAll]);

  const filteredAtlet = atlet.filter((item) => !selectedKategori || item.kategori?.id === selectedKategori);

  const getKonfirmasiStatus = (item: Omit<PerguruanSummary, "statusLabel" | "statusTone">) => {
    if (item.totalAtlet === 0) return { statusLabel: "Belum ada atlet", statusTone: "slate" as const };
    if (item.pending > 0 && item.rejected > 0) {
      return { statusLabel: `${item.pending} belum diverifikasi, ${item.rejected} ditolak`, statusTone: "amber" as const };
    }
    if (item.pending > 0) {
      return { statusLabel: `${item.pending} belum diverifikasi`, statusTone: "amber" as const };
    }
    if (item.rejected > 0 && item.verified === 0) {
      return { statusLabel: `${item.rejected} ditolak`, statusTone: "red" as const };
    }
    if (item.rejected > 0) {
      return { statusLabel: `${item.rejected} ditolak, ${item.verified} terverifikasi`, statusTone: "amber" as const };
    }
    if (item.verified === item.totalAtlet) {
      return { statusLabel: "Terverifikasi", statusTone: "green" as const };
    }
    return { statusLabel: "Perlu konfirmasi", statusTone: "slate" as const };
  };

  const perguruanRows = useMemo<PerguruanSummary[]>(() => {
    const map = new Map<string, Omit<PerguruanSummary, "statusLabel" | "statusTone">>();

    filteredAtlet.forEach((item) => {
      const id = item.perguruanId ?? `perguruan-${item.perguruan?.nama ?? "tanpa-nama"}`;
      const nama = item.perguruan?.nama ?? "Perguruan Tidak Diketahui";
      const found = map.get(id);

      if (!found) {
        map.set(id, { id, nama, totalAtlet: 0, verified: 0, pending: 0, rejected: 0 });
      }

      const target = map.get(id)!;
      target.totalAtlet += 1;
      if (item.status === "VERIFIED") target.verified += 1;
      else if (item.status === "REJECTED") target.rejected += 1;
      else target.pending += 1;
    });

    return Array.from(map.values()).map((item) => ({
      ...item,
      ...getKonfirmasiStatus(item),
    }));
  }, [filteredAtlet]);

  const openPerguruanDetail = useCallback(async (row: PerguruanSummary) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailPerguruan(null);

    const res = await fetch(`/api/atlet?perguruanId=${row.id}`);
    if (!res.ok) {
      setDetailLoading(false);
      toast.error("Gagal memuat detail perguruan");
      return;
    }

    const atletData = await res.json() as AtletRecord[];
    const verified = atletData.filter((item) => item.status === "VERIFIED").length;
    const pending = atletData.filter((item) => item.status === "PENDING").length;
    const rejected = atletData.filter((item) => item.status === "REJECTED").length;
    const summary = getKonfirmasiStatus({
      id: row.id,
      nama: row.nama,
      totalAtlet: atletData.length,
      verified,
      pending,
      rejected,
    });

    setDetailPerguruan({
      id: row.id,
      nama: row.nama,
      totalAtlet: atletData.length,
      verified,
      pending,
      rejected,
      statusLabel: summary.statusLabel,
      statusTone: summary.statusTone,
      atlet: atletData,
    });
    setDetailLoading(false);
  }, []);

  const toggleSelect = (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]);
  };

  const columns = useMemo<ColumnDef<PerguruanSummary>[]>(() => [
    {
      id: "select",
      enableSorting: false,
      enableHiding: false,
      header: ({ table }) => {
        const visibleIds = table.getRowModel().rows.map((row) => row.original.id);
        const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.includes(id));

        return (
          <input
            type="checkbox"
            className="rounded"
            checked={allSelected}
            onChange={(event) => {
              setSelected((prev) => {
                if (event.target.checked) {
                  return Array.from(new Set([...prev, ...visibleIds]));
                }

                return prev.filter((id) => !visibleIds.includes(id));
              });
            }}
          />
        );
      },
      cell: ({ row }) => (
        <input
          type="checkbox"
          className="rounded"
          checked={selected.includes(row.original.id)}
          onChange={() => toggleSelect(row.original.id)}
        />
      ),
    },
    {
      id: "perguruan",
      accessorFn: (row) => row.nama,
      header: ({ column }) => (
        <Button variant="ghost" size="sm" className="px-0" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Perguruan
          {column.getIsSorted() === "asc" ? <ArrowUp size={14} className="ml-1" /> : column.getIsSorted() === "desc" ? <ArrowDown size={14} className="ml-1" /> : <ArrowUpDown size={14} className="ml-1 text-gray-400" />}
        </Button>
      ),
      filterFn: (row, _columnId, value) => {
        const query = String(value ?? "").toLowerCase();
        if (!query) return true;
        return row.original.nama.toLowerCase().includes(query);
      },
      cell: ({ row }) => <span className="font-medium text-sm">{row.original.nama}</span>,
    },
    {
      id: "totalAtlet",
      accessorFn: (row) => row.totalAtlet,
      header: ({ column }) => (
        <Button variant="ghost" size="sm" className="px-0" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Total Atlet
          {column.getIsSorted() === "asc" ? <ArrowUp size={14} className="ml-1" /> : column.getIsSorted() === "desc" ? <ArrowDown size={14} className="ml-1" /> : <ArrowUpDown size={14} className="ml-1 text-gray-400" />}
        </Button>
      ),
      cell: ({ row }) => <span className="text-xs text-gray-700">{row.original.totalAtlet}</span>,
    },
    {
      id: "verified",
      accessorFn: (row) => row.verified,
      header: ({ column }) => (
        <Button variant="ghost" size="sm" className="px-0" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Verified
          {column.getIsSorted() === "asc" ? <ArrowUp size={14} className="ml-1" /> : column.getIsSorted() === "desc" ? <ArrowDown size={14} className="ml-1" /> : <ArrowUpDown size={14} className="ml-1 text-gray-400" />}
        </Button>
      ),
      cell: ({ row }) => <span className="text-xs text-green-700 font-medium">{row.original.verified}</span>,
    },
    {
      id: "rejected",
      accessorFn: (row) => row.rejected,
      header: ({ column }) => (
        <Button variant="ghost" size="sm" className="px-0" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Ditolak
          {column.getIsSorted() === "asc" ? <ArrowUp size={14} className="ml-1" /> : column.getIsSorted() === "desc" ? <ArrowDown size={14} className="ml-1" /> : <ArrowUpDown size={14} className="ml-1 text-gray-400" />}
        </Button>
      ),
      cell: ({ row }) => <span className="text-xs text-red-700 font-medium">{row.original.rejected}</span>,
    },
    {
      id: "status",
      accessorFn: (row) => row.statusLabel,
      header: ({ column }) => (
        <Button variant="ghost" size="sm" className="px-0" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Konfirmasi Verifikasi
          {column.getIsSorted() === "asc" ? <ArrowUp size={14} className="ml-1" /> : column.getIsSorted() === "desc" ? <ArrowDown size={14} className="ml-1" /> : <ArrowUpDown size={14} className="ml-1 text-gray-400" />}
        </Button>
      ),
      cell: ({ row }) => {
        const tone = row.original.statusTone;
        const className = tone === "green"
          ? "bg-green-100 text-green-700 border-green-200"
          : tone === "amber"
            ? "bg-amber-100 text-amber-700 border-amber-200"
            : tone === "red"
              ? "bg-red-100 text-red-700 border-red-200"
              : "bg-slate-100 text-slate-700 border-slate-200";
        return <Badge className={`text-xs ${className}`}>{row.original.statusLabel}</Badge>;
      },
    },
    {
      id: "aksi",
      enableSorting: false,
      header: () => <span className="text-sm font-medium text-gray-700">Aksi</span>,
      cell: ({ row }) => (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            void openPerguruanDetail(row.original);
          }}
        >
          Detail
        </Button>
      ),
    },
  ], [selected, openPerguruanDetail]);

  const fetchPreviewBagan = useCallback(async () => {
    if (!selectedJadwal) { toast.error("Pilih jadwal terlebih dahulu"); return; }
    if (!selectedKategori) { toast.error("Pilih kategori terlebih dahulu"); return; }

    setPreviewLoading(true);
    const res = await fetch(`/api/pertandingan?jadwalId=${selectedJadwal}&kategoriId=${selectedKategori}`);
    setPreviewLoading(false);

    if (!res.ok) {
      toast.error("Gagal memuat preview bagan");
      return;
    }

    const data = await res.json() as Pertandingan[];
    setUsingExamplePreview(false);
    setPreviewMatches(data);
    if (data.length === 0) {
      toast.info("Belum ada bagan untuk kombinasi jadwal & kategori ini");
    }
  }, [selectedJadwal, selectedKategori]);

  const generateBagan = async () => {
    if (!selectedJadwal) { toast.error("Pilih jadwal terlebih dahulu"); return; }
    if (!selectedKategori) { toast.error("Pilih kategori terlebih dahulu"); return; }

    const selectedPerguruanIds = selected;
    if (selectedPerguruanIds.length < 2) {
      toast.error("Pilih minimal 2 perguruan agar bagan bisa dibuat");
      return;
    }

    setGenerating(true);
    const res = await fetch("/api/pertandingan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jadwalId: selectedJadwal,
        kategoriId: selectedKategori,
        perguruanIds: selectedPerguruanIds,
      }),
    });
    setGenerating(false);
    if (res.ok) {
      setUsingExamplePreview(false);
      toast.success("Bagan pertandingan berhasil dibuat. Silakan preview sebelum publish.");
      await fetchPreviewBagan();
    } else {
      const err = await res.json();
      toast.error(err.error ?? "Gagal generate bagan");
    }
  };

  const startPreviewPan = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!previewViewportRef.current) return;

    setIsPanning(true);
    panStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      left: previewViewportRef.current.scrollLeft,
      top: previewViewportRef.current.scrollTop,
    };
  };

  const movePreviewPan = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isPanning || !previewViewportRef.current) return;

    const dx = event.clientX - panStartRef.current.x;
    const dy = event.clientY - panStartRef.current.y;
    previewViewportRef.current.scrollLeft = panStartRef.current.left - dx;
    previewViewportRef.current.scrollTop = panStartRef.current.top - dy;
  };

  const stopPreviewPan = () => {
    setIsPanning(false);
  };

  const startPreviewPanTouch = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!previewViewportRef.current || event.touches.length === 0) return;

    const touch = event.touches[0];
    setIsPanning(true);
    panStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      left: previewViewportRef.current.scrollLeft,
      top: previewViewportRef.current.scrollTop,
    };
  };

  const movePreviewPanTouch = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!isPanning || !previewViewportRef.current || event.touches.length === 0) return;

    const touch = event.touches[0];
    const dx = touch.clientX - panStartRef.current.x;
    const dy = touch.clientY - panStartRef.current.y;
    previewViewportRef.current.scrollLeft = panStartRef.current.left - dx;
    previewViewportRef.current.scrollTop = panStartRef.current.top - dy;
  };

  const zoomPreview = (delta: number) => {
    setPreviewScale((prev) => {
      const next = prev + delta;
      if (next < 0.6) return 0.6;
      if (next > 1.8) return 1.8;
      return Number(next.toFixed(2));
    });
  };

  const selectAllPerguruan = () => {
    setSelected(perguruanRows.map((item) => item.id));
  };

  const loadExamplePreview = () => {
    setUsingExamplePreview(true);
    setPreviewScale(1);
    setPreviewMatches(EXAMPLE_PREVIEW_MATCHES);
    toast.success("Contoh bagan preview dimuat");
  };

  const publishJadwal = async () => {
    if (!selectedJadwal) { toast.error("Pilih jadwal dulu"); return; }
    if (previewMatches.length === 0) {
      toast.error("Preview bagan dulu sebelum publish");
      return;
    }
    const res = await fetch(`/api/jadwal/${selectedJadwal}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PUBLISHED" }),
    });
    if (res.ok) toast.success("Jadwal dipublikasikan!");
    else toast.error("Gagal mempublikasikan");
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Database</h2>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_1.35fr] xl:items-stretch">
        <Card className="h-full border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold uppercase tracking-wide">Database Atlet Terverifikasi</CardTitle>
            <div className="mt-2 flex flex-wrap justify-end gap-2">
              <Select value={selectedKategori} onValueChange={(value) => setSelectedKategori(value ?? "")}>
                <SelectTrigger className="h-8 w-52 text-xs">
                  <Filter size={12} className="mr-1" />
                  <SelectValue placeholder="Filter kategori">
                    {selectedKategoriLabel ? `${selectedKategoriLabel.nama} (${selectedKategoriLabel.jenis})` : "Filter kategori"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua kategori</SelectItem>
                  {kategori.map((k) => <SelectItem key={k.id} value={k.id}>{k.nama}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="py-8 text-center text-gray-400">Memuat data perguruan...</div>
            ) : (
              <DataTable
                columns={columns}
                data={perguruanRows}
                filterColumn="perguruan"
                filterPlaceholder="Filter..."
                emptyMessage="Tidak ada data perguruan"
              />
            )}
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={selectAllPerguruan}>
                Pilih All
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setSelected([])}>
                Reset Pilihan
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="h-full border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between gap-2 text-base font-bold uppercase tracking-wide">
              <span className="flex items-center gap-2"><GitBranch size={16} /> Generate Bagan Pertandingan</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={loadExamplePreview}>
                  Contoh Preview
                </Button>
                <Button variant="outline" size="sm" onClick={fetchPreviewBagan} disabled={previewLoading}>
                  {previewLoading ? "Memuat..." : "Refresh Preview"}
                </Button>
              </div>
            </CardTitle>
            <div className="grid gap-2 md:grid-cols-2">
              <Select value={selectedJadwal} onValueChange={(value) => setSelectedJadwal(value ?? "")}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Pilih jadwal...">
                    {selectedJadwalLabel?.nama ?? "Pilih jadwal..."}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {jadwal.map((j) => (
                    <SelectItem key={j.id} value={j.id}>{j.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedKategori} onValueChange={(value) => setSelectedKategori(value ?? "")}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Pilih kategori...">
                    {selectedKategoriLabel ? `${selectedKategoriLabel.nama} (${selectedKategoriLabel.jenis})` : "Pilih kategori..."}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {kategori.map((k) => (
                    <SelectItem key={k.id} value={k.id}>{k.nama} ({k.jenis})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-2">
              <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
                <span>{usingExamplePreview ? "Tournament Tree Example" : "Tournament Tree"}</span>
                <div className="flex items-center gap-1">
                  <Button type="button" variant="outline" size="sm" className="h-7 px-2" onClick={() => zoomPreview(-0.1)}>-</Button>
                  <span className="w-12 text-center text-[11px] font-medium text-gray-600">{Math.round(previewScale * 100)}%</span>
                  <Button type="button" variant="outline" size="sm" className="h-7 px-2" onClick={() => zoomPreview(0.1)}>+</Button>
                  <Button type="button" variant="outline" size="sm" className="h-7 px-2" onClick={() => setPreviewScale(1)}>Reset</Button>
                </div>
              </div>
              <div
                ref={previewViewportRef}
                className={`h-90 overflow-auto rounded-lg border bg-white p-4 ${isPanning ? "cursor-grabbing" : "cursor-grab"}`}
                onMouseDown={startPreviewPan}
                onMouseMove={movePreviewPan}
                onMouseUp={stopPreviewPan}
                onMouseLeave={stopPreviewPan}
                onTouchStart={startPreviewPanTouch}
                onTouchMove={movePreviewPanTouch}
                onTouchEnd={stopPreviewPan}
              >
                {previewLoading ? (
                  <div className="py-20 text-center text-gray-400">Memuat preview bagan...</div>
                ) : previewMatches.length === 0 ? (
                  <div className="py-20 text-center text-gray-400">
                    Belum ada bagan. Pilih jadwal dan kategori, lalu generate, atau klik Contoh Preview.
                  </div>
                ) : (
                  <div className="inline-block min-w-max origin-top-left" style={{ transform: `scale(${previewScale})` }}>
                    <Bracket rounds={buildBracketRounds(previewMatches)} renderSeedComponent={PreviewSeed} />
                  </div>
                )}
              </div>
              <p className="mt-2 text-center text-xs text-gray-500">
                {usingExamplePreview
                  ? "Ini contoh dummy 16 peserta untuk melihat bentuk preview bagan."
                  : "Drag area bagan untuk geser tampilan seperti map."}
              </p>
            </div>

            <Button className="h-11 w-full bg-green-600 text-sm font-semibold hover:bg-green-700" onClick={generateBagan} disabled={generating}>
              {generating ? "GENERATING..." : "GENERATE BAGAN OTOMATIS"}
            </Button>
            <p className="-mt-1 text-center text-xs text-gray-500">(Berdasarkan Kategori & No Tanding)</p>
            <Button className="h-11 w-full bg-green-700 text-sm font-semibold hover:bg-green-800" onClick={publishJadwal}>
              <Save size={14} className="mr-2" /> SIMPAN & PUBLIKASIKAN JADWAL
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Perguruan</DialogTitle>
          </DialogHeader>

          {detailLoading ? (
            <div className="py-8 text-center text-gray-400">Memuat detail perguruan...</div>
          ) : detailPerguruan ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{detailPerguruan.nama}</h3>
                  <p className="text-sm text-gray-500">{detailPerguruan.totalAtlet} atlet terdaftar</p>
                </div>
                <Badge
                  className={detailPerguruan.statusTone === "green"
                    ? "bg-green-100 text-green-700 border-green-200"
                    : detailPerguruan.statusTone === "amber"
                      ? "bg-amber-100 text-amber-700 border-amber-200"
                      : detailPerguruan.statusTone === "red"
                        ? "bg-red-100 text-red-700 border-red-200"
                        : "bg-slate-100 text-slate-700 border-slate-200"}
                >
                  {detailPerguruan.statusLabel}
                </Badge>
              </div>

              <div className="grid gap-3 md:grid-cols-4">
                <Card><CardContent className="p-4"><p className="text-xs text-gray-500">Total</p><p className="text-2xl font-bold">{detailPerguruan.totalAtlet}</p></CardContent></Card>
                <Card><CardContent className="p-4"><p className="text-xs text-gray-500">Verified</p><p className="text-2xl font-bold text-green-700">{detailPerguruan.verified}</p></CardContent></Card>
                <Card><CardContent className="p-4"><p className="text-xs text-gray-500">Belum Diverifikasi</p><p className="text-2xl font-bold text-amber-700">{detailPerguruan.pending}</p></CardContent></Card>
                <Card><CardContent className="p-4"><p className="text-xs text-gray-500">Ditolak</p><p className="text-2xl font-bold text-red-700">{detailPerguruan.rejected}</p></CardContent></Card>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-700">Daftar Atlet</h4>
                <div className="max-h-80 overflow-auto rounded-lg border">
                  <div className="divide-y">
                    {detailPerguruan.atlet.length > 0 ? detailPerguruan.atlet.map((item, index) => (
                      <div key={item.id} className="flex items-center justify-between px-4 py-3 text-sm">
                        <div>
                          <p className="font-medium text-gray-800">{index + 1}. {item.nama ?? "Atlet"}</p>
                          <p className="text-xs text-gray-500">{item.kategori?.nama ?? "Tanpa kategori"}</p>
                        </div>
                        <Badge className={item.status === "VERIFIED"
                          ? "bg-green-100 text-green-700"
                          : item.status === "PENDING"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"}>
                          {item.status === "VERIFIED" ? "Terverifikasi" : item.status === "PENDING" ? "Belum Diverifikasi" : "Ditolak"}
                        </Badge>
                      </div>
                    )) : (
                      <div className="px-4 py-6 text-center text-gray-400">Belum ada atlet</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
