"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

type Jadwal = {
  id: string; nama: string; tanggal: string; lokasi: string; status: string;
  jadwalKategori: { id: string; kategori: { id: string; nama: string } }[];
};
type Kejuaraan = { id: string; nama: string };
type SortKey = "nama" | "tanggal" | "lokasi" | "pertandingan" | "status";

const emptyForm = { nama: "", tanggal: "", lokasi: "", status: "DRAFT" };

export default function AdminJadwalPage() {
  const [jadwal, setJadwal] = useState<Jadwal[]>([]);
  const [kejuaraan, setKejuaraan] = useState<Kejuaraan[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [openMasterKejuaraan, setOpenMasterKejuaraan] = useState(false);
  const [editingKejuaraanId, setEditingKejuaraanId] = useState<string | null>(null);
  const [kejuaraanNameForm, setKejuaraanNameForm] = useState("");
  const [kejuaraanSearch, setKejuaraanSearch] = useState("");
  const [kejuaraanUsageFilter, setKejuaraanUsageFilter] = useState<"ALL" | "UNUSED">("ALL");
  const [savingKejuaraan, setSavingKejuaraan] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: "asc" | "desc" }>({
    key: "tanggal",
    direction: "desc",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [jRes, kRes] = await Promise.all([
      fetch("/api/jadwal"),
      fetch("/api/kejuaraan"),
    ]);

    const [j, k] = await Promise.all([
      jRes.json() as Promise<Jadwal[]>,
      kRes.ok ? kRes.json() as Promise<Kejuaraan[]> : Promise.resolve([]),
    ]);

    setJadwal(j);
    setKejuaraan(k);
    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchData();
    });
  }, [fetchData]);

  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => jadwal.some((item) => item.id === id)));
  }, [jadwal]);

  const filteredJadwal = jadwal.filter((item) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query
      || item.nama.toLowerCase().includes(query)
      || item.lokasi.toLowerCase().includes(query);
    const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedJadwal = [...filteredJadwal].sort((left, right) => {
    const directionFactor = sortConfig.direction === "asc" ? 1 : -1;

    switch (sortConfig.key) {
      case "nama":
        return left.nama.localeCompare(right.nama, "id") * directionFactor;
      case "lokasi":
        return left.lokasi.localeCompare(right.lokasi, "id") * directionFactor;
      case "pertandingan":
        return (left.jadwalKategori.length - right.jadwalKategori.length) * directionFactor;
      case "status":
        return left.status.localeCompare(right.status, "id") * directionFactor;
      case "tanggal":
      default:
        return (new Date(left.tanggal).getTime() - new Date(right.tanggal).getTime()) * directionFactor;
    }
  });

  const namaKejuaraanHistory = Array.from(
    new Set(
      [
        ...kejuaraan.map((item) => item.nama.trim()),
        ...jadwal.map((item) => item.nama.trim()),
      ].filter(Boolean),
    ),
  ).sort((left, right) => left.localeCompare(right, "id"));

  const lokasiHistory = Array.from(
    new Set(jadwal.map((item) => item.lokasi.trim()).filter(Boolean)),
  ).sort((left, right) => left.localeCompare(right, "id"));

  const kejuaraanUsageMap = useMemo(() => {
    const usage = new Map<string, number>();
    jadwal.forEach((item) => {
      const key = item.nama.trim().toLowerCase();
      if (!key) return;
      usage.set(key, (usage.get(key) ?? 0) + 1);
    });
    return usage;
  }, [jadwal]);

  const filteredKejuaraan = useMemo(() => {
    const query = kejuaraanSearch.trim().toLowerCase();
    return kejuaraan.filter((item) => {
      const matchesQuery = !query || item.nama.toLowerCase().includes(query);
      if (!matchesQuery) return false;

      if (kejuaraanUsageFilter === "UNUSED") {
        const usageCount = kejuaraanUsageMap.get(item.nama.trim().toLowerCase()) ?? 0;
        return usageCount === 0;
      }

      return true;
    });
  }, [kejuaraan, kejuaraanSearch, kejuaraanUsageFilter, kejuaraanUsageMap]);

  const toggleSort = (key: SortKey) => {
    setSortConfig((prev) => prev.key === key
      ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
      : { key, direction: "asc" });
  };

  const toggleRowSelection = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      if (checked) return prev.includes(id) ? prev : [...prev, id];
      return prev.filter((item) => item !== id);
    });
  };

  const toggleVisibleSelection = (checked: boolean) => {
    const visibleIds = sortedJadwal.map((item) => item.id);
    setSelectedIds((prev) => {
      if (checked) return Array.from(new Set([...prev, ...visibleIds]));
      return prev.filter((item) => !visibleIds.includes(item));
    });
  };

  const openAdd = () => { setForm(emptyForm); setEditing(null); setOpen(true); };
  const openEdit = (j: Jadwal) => {
    setForm({ nama: j.nama, tanggal: j.tanggal.slice(0, 16), lokasi: j.lokasi, status: j.status });
    setEditing(j.id);
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.nama || !form.tanggal || !form.lokasi) { toast.error("Lengkapi semua field"); return; }

    const normalizedName = form.nama.trim();
    const exists = namaKejuaraanHistory.some((item) => item.toLowerCase() === normalizedName.toLowerCase());
    if (normalizedName && !exists) {
      const resKejuaraan = await fetch("/api/kejuaraan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama: normalizedName }),
      });

      if (!resKejuaraan.ok) {
        toast.error("Gagal menyimpan master kejuaraan");
        return;
      }
    }

    const url = editing ? `/api/jadwal/${editing}` : "/api/jadwal";
    const method = editing ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, nama: normalizedName }),
    });
    if (res.ok) { toast.success("Jadwal tersimpan"); setOpen(false); fetchData(); }
    else toast.error("Terjadi kesalahan");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin hapus jadwal ini?")) return;
    const res = await fetch(`/api/jadwal/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Jadwal dihapus");
      setSelectedIds((prev) => prev.filter((item) => item !== id));
      fetchData();
    }
  };

  const togglePublish = async (j: Jadwal) => {
    const status = j.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    const res = await fetch(`/api/jadwal/${j.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) { toast.success(status === "PUBLISHED" ? "Jadwal dipublikasikan" : "Jadwal disembunyikan"); fetchData(); }
  };

  const bulkUpdateStatus = async (status: "DRAFT" | "PUBLISHED") => {
    if (selectedIds.length === 0) {
      toast.error("Pilih data jadwal terlebih dahulu");
      return;
    }

    const results = await Promise.all(selectedIds.map(async (id) => {
      const res = await fetch(`/api/jadwal/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      return res.ok;
    }));

    const successCount = results.filter(Boolean).length;
    if (successCount > 0) {
      toast.success(`${successCount} jadwal diperbarui`);
      fetchData();
    }
    if (successCount !== selectedIds.length) {
      toast.error("Sebagian jadwal gagal diperbarui");
    }
  };

  const bulkDelete = async () => {
    if (selectedIds.length === 0) {
      toast.error("Pilih data jadwal terlebih dahulu");
      return;
    }
    if (!confirm(`Yakin hapus ${selectedIds.length} jadwal terpilih?`)) return;

    const results = await Promise.all(selectedIds.map(async (id) => {
      const res = await fetch(`/api/jadwal/${id}`, { method: "DELETE" });
      return res.ok;
    }));

    const successCount = results.filter(Boolean).length;
    if (successCount > 0) {
      toast.success(`${successCount} jadwal dihapus`);
      setSelectedIds([]);
      fetchData();
    }
    if (successCount !== selectedIds.length) {
      toast.error("Sebagian jadwal gagal dihapus");
    }
  };

  const openKejuaraanCreate = () => {
    setEditingKejuaraanId(null);
    setKejuaraanNameForm("");
  };

  const openKejuaraanEdit = (item: Kejuaraan) => {
    setEditingKejuaraanId(item.id);
    setKejuaraanNameForm(item.nama);
  };

  const submitKejuaraan = async () => {
    const nama = kejuaraanNameForm.trim();
    if (!nama) {
      toast.error("Nama kejuaraan wajib diisi");
      return;
    }

    setSavingKejuaraan(true);
    try {
      const url = editingKejuaraanId ? `/api/kejuaraan/${editingKejuaraanId}` : "/api/kejuaraan";
      const method = editingKejuaraanId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null) as { error?: string } | null;
        toast.error(err?.error ?? "Gagal menyimpan master kejuaraan");
        return;
      }

      toast.success(editingKejuaraanId ? "Master kejuaraan diperbarui" : "Master kejuaraan ditambahkan");
      openKejuaraanCreate();
      await fetchData();
    } finally {
      setSavingKejuaraan(false);
    }
  };

  const deleteKejuaraan = async (item: Kejuaraan) => {
    const usageCount = kejuaraanUsageMap.get(item.nama.trim().toLowerCase()) ?? 0;
    if (usageCount > 0) {
      toast.error(`Kejuaraan ini sudah dipakai di ${usageCount} jadwal`);
      return;
    }

    if (!confirm(`Hapus master kejuaraan "${item.nama}"?`)) return;

    const res = await fetch(`/api/kejuaraan/${item.id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(() => null) as { error?: string } | null;
      toast.error(err?.error ?? "Gagal menghapus master kejuaraan");
      return;
    }

    toast.success("Master kejuaraan dihapus");
    if (editingKejuaraanId === item.id) {
      openKejuaraanCreate();
    }
    await fetchData();
  };

  const visibleIds = sortedJadwal.map((item) => item.id);
  const selectedVisibleCount = visibleIds.filter((id) => selectedIds.includes(id)).length;
  const allVisibleSelected = visibleIds.length > 0 && selectedVisibleCount === visibleIds.length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Manajemen Jadwal</h2>
          <p className="text-sm text-gray-500">Buat dan kelola jadwal pertandingan</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => { setOpenMasterKejuaraan(true); openKejuaraanCreate(); }}>
            Kelola Kejuaraan
          </Button>
          <Button onClick={openAdd} className="bg-amber-600 hover:bg-amber-700 gap-2">
            <Plus size={16} /> Buat Jadwal
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              placeholder="Cari nama/lokasi jadwal..."
              className="sm:max-w-sm"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value)}>
              <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PUBLISHED">Dipublikasikan</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-xs text-gray-500">
            Dipilih: {selectedIds.length} / Ditampilkan: {sortedJadwal.length}
          </div>
        </CardContent>
      </Card>

      {selectedIds.length > 0 && (
        <Card>
          <CardContent className="p-3 flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => bulkUpdateStatus("PUBLISHED")}>Publikasikan Terpilih</Button>
            <Button size="sm" variant="outline" onClick={() => bulkUpdateStatus("DRAFT")}>Set Draft Terpilih</Button>
            <Button size="sm" variant="destructive" onClick={bulkDelete}>Hapus Terpilih</Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>Bersihkan Pilihan</Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-10 text-gray-400">Memuat...</div>
          ) : jadwal.length === 0 ? (
            <div className="text-center py-10 text-gray-400">Belum ada jadwal</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={allVisibleSelected}
                      onChange={(event) => toggleVisibleSelection(event.target.checked)}
                    />
                  </TableHead>
                  <SortableTableHead label="Nama" active={sortConfig.key === "nama"} direction={sortConfig.direction} onClick={() => toggleSort("nama")} />
                  <SortableTableHead label="Tanggal" active={sortConfig.key === "tanggal"} direction={sortConfig.direction} onClick={() => toggleSort("tanggal")} />
                  <SortableTableHead label="Lokasi" active={sortConfig.key === "lokasi"} direction={sortConfig.direction} onClick={() => toggleSort("lokasi")} />
                  <SortableTableHead label="Pertandingan" active={sortConfig.key === "pertandingan"} direction={sortConfig.direction} onClick={() => toggleSort("pertandingan")} />
                  <SortableTableHead label="Status" active={sortConfig.key === "status"} direction={sortConfig.direction} onClick={() => toggleSort("status")} />
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedJadwal.map((j) => (
                  <TableRow key={j.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={selectedIds.includes(j.id)}
                        onChange={(event) => toggleRowSelection(j.id, event.target.checked)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{j.nama}</TableCell>
                    <TableCell className="text-sm">{new Date(j.tanggal).toLocaleDateString("id-ID")}</TableCell>
                    <TableCell className="text-sm text-gray-600">{j.lokasi}</TableCell>
                    <TableCell>
                      {j.jadwalKategori.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {j.jadwalKategori.map((jk) => (
                            <Badge key={jk.id} variant="outline" className="text-xs">{jk.kategori.nama}</Badge>
                          ))}
                        </div>
                      ) : <span className="text-gray-400 text-xs">-</span>}
                    </TableCell>
                    <TableCell>
                      <Badge className={j.status === "PUBLISHED" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}>
                        {j.status === "PUBLISHED" ? "Dipublikasikan" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => togglePublish(j)}>
                          <CheckCircle size={12} />
                          {j.status === "PUBLISHED" ? "Sembunyikan" : "Publikasikan"}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(j)}>
                          <Pencil size={14} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDelete(j.id)}>
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit Jadwal" : "Buat Jadwal Baru"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Nama Kejuaraan *</Label>
              <Input
                list="nama-kejuaraan-history"
                placeholder="Nama turnamen/kejuaraan"
                value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
              />
              <datalist id="nama-kejuaraan-history">
                {namaKejuaraanHistory.map((nama) => (
                  <option key={nama} value={nama} />
                ))}
              </datalist>
              <p className="text-xs text-gray-500">Bisa pilih dari daftar atau ketik kejuaraan baru.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Tanggal & Waktu *</Label>
              <Input type="datetime-local" value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Lokasi *</Label>
              <Input
                list="lokasi-history"
                placeholder="GOR / Gedung / Alamat"
                value={form.lokasi}
                onChange={(e) => setForm({ ...form, lokasi: e.target.value })}
              />
              <datalist id="lokasi-history">
                {lokasiHistory.map((lokasi) => (
                  <option key={lokasi} value={lokasi} />
                ))}
              </datalist>
              <p className="text-xs text-gray-500">Riwayat lokasi tersimpan otomatis dari jadwal sebelumnya.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value ?? "DRAFT" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PUBLISHED">Publikasikan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button className="bg-amber-600 hover:bg-amber-700" onClick={handleSubmit}>
              {editing ? "Simpan" : "Buat Jadwal"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={openMasterKejuaraan} onOpenChange={setOpenMasterKejuaraan}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Kelola Master Kejuaraan</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 mt-2">
            <Label>Nama Kejuaraan</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Contoh: Kejurda Pencak Silat 2026"
                value={kejuaraanNameForm}
                onChange={(event) => setKejuaraanNameForm(event.target.value)}
              />
              <Button onClick={submitKejuaraan} disabled={savingKejuaraan}>
                {editingKejuaraanId ? "Update" : "Tambah"}
              </Button>
              {editingKejuaraanId && (
                <Button variant="outline" onClick={openKejuaraanCreate}>
                  Batal
                </Button>
              )}
            </div>
            <p className="text-xs text-gray-500">Data ini dipakai sebagai sumber dropdown nama kejuaraan pada form jadwal.</p>
          </div>

          <div className="space-y-1.5 mt-2">
            <Label>Pencarian</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Cari master kejuaraan..."
                value={kejuaraanSearch}
                onChange={(event) => setKejuaraanSearch(event.target.value)}
              />
              <Select value={kejuaraanUsageFilter} onValueChange={(value: "ALL" | "UNUSED") => setKejuaraanUsageFilter(value)}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua data</SelectItem>
                  <SelectItem value="UNUSED">Belum dipakai</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto rounded-md border mt-3">
            {filteredKejuaraan.length === 0 ? (
              <div className="px-4 py-6 text-sm text-gray-400 text-center">Tidak ada data yang cocok dengan filter.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Kejuaraan</TableHead>
                    <TableHead className="w-36">Dipakai</TableHead>
                    <TableHead className="w-28 text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredKejuaraan.map((item) => {
                    const usageCount = kejuaraanUsageMap.get(item.nama.trim().toLowerCase()) ?? 0;

                    return (
                    <TableRow key={item.id}>
                      <TableCell className="text-sm">{item.nama}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={usageCount > 0 ? "text-blue-700 border-blue-200" : "text-gray-500"}>
                          {usageCount} jadwal
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openKejuaraanEdit(item)}>
                            <Pencil size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500"
                            onClick={() => deleteKejuaraan(item)}
                            disabled={usageCount > 0}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
