"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

type Atlet = {
  id: string; nik: string; nama: string; ttl: string;
  beratBadan: number; tinggiBadan: number; berkasUrl?: string;
  status: string; catatan?: string; isActive?: boolean;
  perguruan: { nama: string };
  kategori?: { nama: string } | null;
};
type SortKey = "nama" | "perguruan";

export default function VerifikasiPage() {
  const [atlet, setAtlet] = useState<Atlet[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Atlet | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [catatan, setCatatan] = useState("");
  const [processActive, setProcessActive] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: "asc" | "desc" }>({
    key: "nama",
    direction: "asc",
  });
  const [previewBerkas, setPreviewBerkas] = useState<{ url: string; title: string } | null>(null);

  const getBerkasStatusMeta = (status: Atlet["status"]) => {
    if (status === "VERIFIED") {
      return {
        label: "Sudah diverifikasi",
        tone: "text-green-700 bg-green-50 border-green-200",
        iconTone: "text-green-600",
        icon: <CheckCircle size={12} />,
      };
    }

    if (status === "REJECTED") {
      return {
        label: "Ditolak",
        tone: "text-red-700 bg-red-50 border-red-200",
        iconTone: "text-red-600",
        icon: <XCircle size={12} />,
      };
    }

    return {
      label: "Belum diverifikasi",
      tone: "text-amber-700 bg-amber-50 border-amber-200",
      iconTone: "text-amber-600",
      icon: <RefreshCw size={12} />,
    };
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    const data = await fetch("/api/atlet").then((r) => r.json());
    setAtlet(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchData();
    });
  }, [fetchData]);

  const filtered = atlet.filter((a) => {
    const query = search.trim().toLowerCase();
    return !query
      || a.nama.toLowerCase().includes(query)
      || a.perguruan.nama.toLowerCase().includes(query);
  });

  const sortedAtlet = [...filtered].sort((left, right) => {
    const directionFactor = sortConfig.direction === "asc" ? 1 : -1;

    switch (sortConfig.key) {
      case "perguruan":
        return left.perguruan.nama.localeCompare(right.perguruan.nama, "id") * directionFactor;
      case "nama":
      default:
        return left.nama.localeCompare(right.nama, "id") * directionFactor;
    }
  });

  const toggleSort = (key: SortKey) => {
    setSortConfig((prev) => prev.key === key
      ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
      : { key, direction: "asc" });
  };

  const updateStatus = async (id: string, status: string, note?: string) => {
    const res = await fetch(`/api/atlet/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, catatan: note }),
    });
    if (res.ok) {
      const message = status === "VERIFIED"
        ? "Atlet berhasil diverifikasi"
        : status === "REJECTED"
          ? "Atlet berhasil ditolak"
          : "Status atlet dikembalikan ke belum diverifikasi";
      toast.success(message);
      setSelected(null);
      fetchData();
    } else toast.error("Gagal memperbarui status");
  };

  const toggleAtletActive = async (id: string, checked: boolean) => {
    const target = atlet.find((item) => item.id === id);
    if (!target) return;

    const res = await fetch(`/api/atlet/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: target.status,
        catatan: target.catatan,
        isActive: checked,
      }),
    });

    if (res.ok) {
      toast.success(`Status atlet diubah menjadi ${checked ? "Aktif" : "Nonaktif"}`);
      fetchData();
      return;
    }

    toast.error("Gagal mengubah status aktif atlet");
  };

  const toggleSelection = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      if (checked) return prev.includes(id) ? prev : [...prev, id];
      return prev.filter((item) => item !== id);
    });
  };

  const toggleVisibleSelection = (checked: boolean) => {
    const visibleIds = sortedAtlet.map((item) => item.id);
    setSelectedIds((prev) => {
      if (checked) return Array.from(new Set([...prev, ...visibleIds]));
      return prev.filter((item) => !visibleIds.includes(item));
    });
  };

  const bulkUpdateStatus = async (status: "VERIFIED" | "REJECTED") => {
    if (!processActive) {
      toast.error("Aktifkan proses verifikasi terlebih dahulu");
      return;
    }
    if (selectedIds.length === 0) {
      toast.error("Pilih atlet terlebih dahulu");
      return;
    }

    const candidates = atlet.filter((item) => selectedIds.includes(item.id) && item.status === "PENDING");
    if (candidates.length === 0) {
      toast.error("Tidak ada atlet pending yang dipilih");
      return;
    }

    const results = await Promise.all(candidates.map(async (item) => {
      const res = await fetch(`/api/atlet/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, catatan: status === "REJECTED" ? "Ditolak secara massal" : undefined }),
      });
      return res.ok;
    }));

    const successCount = results.filter(Boolean).length;
    if (successCount > 0) {
      toast.success(`${successCount} atlet berhasil di${status === "VERIFIED" ? "verifikasi" : "tolak"}`);
      setSelectedIds([]);
      fetchData();
    }
    if (successCount !== candidates.length) {
      toast.error("Sebagian proses massal gagal");
    }
  };

  const visibleIds = sortedAtlet.map((item) => item.id);
  const selectedVisibleCount = selectedIds.filter((id) => visibleIds.includes(id)).length;
  const allVisibleSelected = visibleIds.length > 0 && selectedVisibleCount === visibleIds.length;

  const stats = {
    total: atlet.length,
    pending: atlet.filter((a) => a.status === "PENDING").length,
    verified: atlet.filter((a) => a.status === "VERIFIED").length,
    rejected: atlet.filter((a) => a.status === "REJECTED").length,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Panel Verifikasi Berkas</h2>
          <p className="text-sm text-gray-500">Verifikasi data dan berkas atlet yang mendaftar</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch checked={processActive} onCheckedChange={setProcessActive} />
            <span className="text-sm font-medium text-gray-600">
              {processActive ? "✓ Proses Verifikasi Aktif" : "Proses Verifikasi Non-aktif"}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} className="gap-1">
            <RefreshCw size={14} /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total, color: "text-blue-600 bg-blue-50" },
          { label: "Belum Diverifikasi", value: stats.pending, color: "text-amber-600 bg-amber-50" },
          { label: "Terverifikasi", value: stats.verified, color: "text-green-600 bg-green-50" },
          { label: "Ditolak", value: stats.rejected, color: "text-red-600 bg-red-50" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className={`p-4 text-center ${s.color} rounded-lg`}>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs font-medium mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">Daftar Verifikasi Berkas</CardTitle>
            <div className="flex gap-2">
              <Input placeholder="Cari nama / perguruan..." className="w-64 h-8 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-8 text-gray-400">Memuat data...</div>
          ) : (
            <div className="space-y-3 p-3">
              <div className="flex items-center justify-between rounded-md border px-3 py-2 text-xs text-gray-600">
                <span>{sortedAtlet.length} atlet tampil</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={allVisibleSelected}
                    onChange={(event) => toggleVisibleSelection(event.target.checked)}
                  />
                  Pilih semua atlet tampil
                </label>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead />
                    <SortableTableHead label="Atlet" active={sortConfig.key === "nama"} direction={sortConfig.direction} onClick={() => toggleSort("nama")} />
                    <SortableTableHead label="Perguruan" active={sortConfig.key === "perguruan"} direction={sortConfig.direction} onClick={() => toggleSort("perguruan")} />
                    <TableHead>Status Berkas</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedAtlet.map((a) => (
                    <motion.tr key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b last:border-0">
                      <TableCell>
                        <input
                          type="checkbox"
                          className="rounded"
                          checked={selectedIds.includes(a.id)}
                          onChange={(event) => toggleSelection(a.id, event.target.checked)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{a.nama}</TableCell>
                      <TableCell className="text-gray-600">{a.perguruan.nama}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            className={`h-7 w-7 rounded-full ${a.status === "PENDING" ? "border-amber-300 bg-amber-100 text-amber-700" : "border-amber-200 text-amber-500"}`}
                            disabled={!processActive}
                            onClick={() => updateStatus(a.id, "PENDING")}
                            title="Belum Diverifikasi"
                            aria-label="Belum Diverifikasi"
                          >
                            <RefreshCw size={12} />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            className={`h-7 w-7 rounded-full ${a.status === "VERIFIED" ? "border-green-300 bg-green-100 text-green-700" : "border-green-200 text-green-500"}`}
                            disabled={!processActive}
                            onClick={() => updateStatus(a.id, "VERIFIED")}
                            title="Terverifikasi"
                            aria-label="Terverifikasi"
                          >
                            <CheckCircle size={12} />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            className={`h-7 w-7 rounded-full ${a.status === "REJECTED" ? "border-red-300 bg-red-100 text-red-700" : "border-red-200 text-red-500"}`}
                            disabled={!processActive}
                            onClick={() => { setSelected(a); setCatatan(a.catatan ?? ""); }}
                            title="Ditolak"
                            aria-label="Ditolak"
                          >
                            <XCircle size={12} />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const meta = getBerkasStatusMeta(a.status);
                          return (
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-semibold ${meta.tone}`}
                              title={meta.label}
                              aria-label={meta.label}
                            >
                              <span className={meta.iconTone}>{meta.icon}</span>
                              <span className="hidden sm:inline">{meta.label}</span>
                            </span>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={Boolean(a.isActive)}
                            onCheckedChange={(checked) => { void toggleAtletActive(a.id, checked); }}
                          />
                          <span className={`text-xs font-medium ${a.isActive ? "text-green-700" : "text-amber-700"}`}>
                            {a.isActive ? "Aktif" : "Nonaktif"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-green-700 border-green-300 bg-green-50 hover:bg-green-100"
                          onClick={() => {
                            setSelected(a);
                            setCatatan(a.catatan ?? "");
                            if (a.berkasUrl) setPreviewBerkas({ url: a.berkasUrl, title: `Berkas ${a.nama}` });
                          }}>
                          <Eye size={12} /> Preview Berkas
                        </Button>
                      </TableCell>
                    </motion.tr>
                  ))}
                  {sortedAtlet.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-400 py-8">Tidak ada data</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedIds.length > 0 && (
        <Card>
          <CardContent className="p-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-500 mr-2">Terpilih {selectedIds.length} atlet</span>
            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => bulkUpdateStatus("VERIFIED")}>Verifikasi Terpilih</Button>
            <Button size="sm" className="bg-red-600 hover:bg-red-700" onClick={() => bulkUpdateStatus("REJECTED")}>Tolak Terpilih</Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>Bersihkan Pilihan</Button>
          </CardContent>
        </Card>
      )}

      {selected && (
        <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Detail Atlet: {selected.nama}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-gray-500">NIK:</span> <span className="font-medium">{selected.nik}</span></div>
                <div><span className="text-gray-500">TTL:</span> <span className="font-medium">{selected.ttl}</span></div>
                <div><span className="text-gray-500">BB:</span> <span className="font-medium">{selected.beratBadan} kg</span></div>
                <div><span className="text-gray-500">TB:</span> <span className="font-medium">{selected.tinggiBadan} cm</span></div>
              </div>
              <div><span className="text-gray-500">Perguruan:</span> <span className="font-medium">{selected.perguruan.nama}</span></div>
              {selected.berkasUrl && (
                <button
                  type="button"
                  className="block text-blue-600 text-xs underline mt-2"
                  onClick={() => setPreviewBerkas({ url: selected.berkasUrl!, title: `Berkas ${selected.nama}` })}
                >
                  Lihat Berkas
                </button>
              )}
              <div className="space-y-1.5">
                <Label>Catatan Penolakan</Label>
                <Textarea placeholder="Isi alasan jika menolak..." value={catatan} onChange={(e) => setCatatan(e.target.value)} rows={3} />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => setSelected(null)}>Tutup</Button>
                <Button className="bg-red-600 hover:bg-red-700 gap-1" onClick={() => updateStatus(selected.id, "REJECTED", catatan)}>
                  <XCircle size={14} /> Tolak
                </Button>
                <Button className="bg-green-600 hover:bg-green-700 gap-1" onClick={() => updateStatus(selected.id, "VERIFIED")}>
                  <CheckCircle size={14} /> Verifikasi
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog preview berkas */}
      <Dialog open={!!previewBerkas} onOpenChange={() => setPreviewBerkas(null)}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewBerkas?.title ?? "Preview berkas"}</DialogTitle>
          </DialogHeader>
          {previewBerkas && (
            <div className="max-h-[75vh] overflow-hidden rounded-lg border bg-gray-50">
              {/\.(jpg|jpeg|png|webp|gif)$/i.test(previewBerkas.url) ? (
                <div className="relative h-[70vh] w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewBerkas.url} alt={previewBerkas.title} className="object-contain h-full w-full" />
                </div>
              ) : (
                <iframe src={previewBerkas.url} title={previewBerkas.title} className="h-[70vh] w-full" />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
