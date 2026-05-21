"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, UserCheck } from "lucide-react";
import { toast } from "sonner";

type Pelatih = { id: string; nama: string; sertifikasi?: string; telepon?: string; isActive?: boolean };
type SortKey = "nama" | "sertifikasi" | "telepon" | "status";

const emptyForm = { nama: "", sertifikasi: "", telepon: "", isActive: false };

export default function PelatihPage() {
  const [pelatih, setPelatih] = useState<Pelatih[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: "asc" | "desc" }>({
    key: "nama",
    direction: "asc",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const data = await fetch("/api/pelatih").then((r) => r.json());
    setPelatih(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchData();
    });
  }, [fetchData]);

  const filteredPelatih = pelatih.filter((item) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return item.nama.toLowerCase().includes(query)
      || (item.sertifikasi ?? "").toLowerCase().includes(query)
      || (item.telepon ?? "").toLowerCase().includes(query);
  });

  const sortedPelatih = [...filteredPelatih].sort((left, right) => {
    const directionFactor = sortConfig.direction === "asc" ? 1 : -1;

    switch (sortConfig.key) {
      case "sertifikasi":
        return (left.sertifikasi ?? "").localeCompare(right.sertifikasi ?? "", "id") * directionFactor;
      case "telepon":
        return (left.telepon ?? "").localeCompare(right.telepon ?? "", "id") * directionFactor;
      case "status":
        return ((left.isActive ? 1 : 0) - (right.isActive ? 1 : 0)) * directionFactor;
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

  const toggleSelection = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      if (checked) return prev.includes(id) ? prev : [...prev, id];
      return prev.filter((item) => item !== id);
    });
  };

  const toggleVisibleSelection = (checked: boolean) => {
    const visibleIds = sortedPelatih.map((item) => item.id);
    setSelectedIds((prev) => {
      if (checked) return Array.from(new Set([...prev, ...visibleIds]));
      return prev.filter((item) => !visibleIds.includes(item));
    });
  };

  const openAdd = () => { setForm(emptyForm); setEditing(null); setOpen(true); };
  const openEdit = (p: Pelatih) => {
    setForm({ nama: p.nama, sertifikasi: p.sertifikasi ?? "", telepon: p.telepon ?? "", isActive: Boolean(p.isActive) });
    setEditing(p.id);
    setOpen(true);
  };

  const toggleStatus = async (row: Pelatih, checked: boolean) => {
    const res = await fetch(`/api/pelatih/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nama: row.nama,
        sertifikasi: row.sertifikasi ?? "",
        telepon: row.telepon ?? "",
        isActive: checked,
      }),
    });

    if (res.ok) {
      toast.success(`Status pelatih diubah ke ${checked ? "Aktif" : "Pending"}`);
      fetchData();
      return;
    }

    toast.error("Gagal mengubah status pelatih");
  };

  const handleSubmit = async () => {
    if (!form.nama) { toast.error("Nama wajib diisi"); return; }
    const url = editing ? `/api/pelatih/${editing}` : "/api/pelatih";
    const method = editing ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) {
      toast.success(editing ? "Data pelatih diperbarui" : "Pelatih ditambahkan");
      setOpen(false); fetchData();
    } else toast.error("Terjadi kesalahan");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin hapus pelatih ini?")) return;
    const res = await fetch(`/api/pelatih/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Pelatih dihapus");
      setSelectedIds((prev) => prev.filter((item) => item !== id));
      fetchData();
    }
    else toast.error("Gagal menghapus");
  };

  const bulkDelete = async () => {
    if (selectedIds.length === 0) {
      toast.error("Pilih data pelatih terlebih dahulu");
      return;
    }
    if (!confirm(`Yakin hapus ${selectedIds.length} pelatih terpilih?`)) return;

    const results = await Promise.all(selectedIds.map(async (id) => {
      const res = await fetch(`/api/pelatih/${id}`, { method: "DELETE" });
      return res.ok;
    }));

    const successCount = results.filter(Boolean).length;
    if (successCount > 0) {
      toast.success(`${successCount} pelatih dihapus`);
      setSelectedIds([]);
      fetchData();
    }
    if (successCount !== selectedIds.length) {
      toast.error("Sebagian data gagal dihapus");
    }
  };

  const visibleIds = sortedPelatih.map((item) => item.id);
  const selectedVisibleCount = visibleIds.filter((id) => selectedIds.includes(id)).length;
  const allVisibleSelected = visibleIds.length > 0 && selectedVisibleCount === visibleIds.length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Data Pelatih</h2>
          <p className="text-sm text-gray-500">Kelola data pelatih perguruan Anda</p>
        </div>
        <Button onClick={openAdd} className="bg-blue-600 hover:bg-blue-700 gap-2">
          <Plus size={16} /> Tambah Pelatih
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Input
            placeholder="Cari nama/sertifikasi/telepon..."
            className="sm:max-w-sm"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <div className="text-xs text-gray-500">Dipilih: {selectedIds.length} / Ditampilkan: {sortedPelatih.length}</div>
        </CardContent>
      </Card>

      {selectedIds.length > 0 && (
        <Card>
          <CardContent className="p-3 flex flex-wrap items-center gap-2">
            <Button size="sm" variant="destructive" onClick={bulkDelete}>Hapus Terpilih</Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>Bersihkan Pilihan</Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-10 text-gray-400">Memuat data...</div>
          ) : pelatih.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <UserCheck className="mx-auto mb-2 text-gray-300" size={36} />
              Belum ada data pelatih
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={allVisibleSelected}
                      onChange={(event) => toggleVisibleSelection(event.target.checked)}
                    />
                  </TableHead>
                  <SortableTableHead label="Nama Pelatih" active={sortConfig.key === "nama"} direction={sortConfig.direction} onClick={() => toggleSort("nama")} />
                  <SortableTableHead label="Sertifikasi" active={sortConfig.key === "sertifikasi"} direction={sortConfig.direction} onClick={() => toggleSort("sertifikasi")} />
                  <SortableTableHead label="Telepon" active={sortConfig.key === "telepon"} direction={sortConfig.direction} onClick={() => toggleSort("telepon")} />
                  <SortableTableHead label="Status" active={sortConfig.key === "status"} direction={sortConfig.direction} onClick={() => toggleSort("status")} />
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {sortedPelatih.map((p) => (
                    <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="border-b last:border-0">
                      <TableCell>
                        <input
                          type="checkbox"
                          className="rounded"
                          checked={selectedIds.includes(p.id)}
                          onChange={(event) => toggleSelection(p.id, event.target.checked)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{p.nama}</TableCell>
                      <TableCell>{p.sertifikasi || <span className="text-gray-400 text-xs">-</span>}</TableCell>
                      <TableCell>{p.telepon || <span className="text-gray-400 text-xs">-</span>}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch checked={Boolean(p.isActive)} onCheckedChange={(checked) => { void toggleStatus(p, checked); }} />
                          <span className={`text-xs font-medium ${p.isActive ? "text-green-700" : "text-amber-700"}`}>
                            {p.isActive ? "Aktif (true)" : "Pending (false)"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}>
                            <Pencil size={14} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => handleDelete(p.id)}>
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Pelatih" : "Tambah Pelatih Baru"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Nama *</Label>
              <Input placeholder="Nama pelatih" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Sertifikasi</Label>
              <Input placeholder="No. sertifikasi / jenis sertifikat" value={form.sertifikasi} onChange={(e) => setForm({ ...form, sertifikasi: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Telepon</Label>
              <Input placeholder="08xx-xxxx-xxxx" value={form.telepon} onChange={(e) => setForm({ ...form, telepon: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Status Aktif (true/false)</Label>
              <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                <Switch checked={form.isActive} onCheckedChange={(checked) => setForm({ ...form, isActive: checked })} />
                <span className={`text-xs font-medium ${form.isActive ? "text-green-700" : "text-amber-700"}`}>
                  {form.isActive ? "Aktif (true)" : "Pending (false)"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSubmit}>
              {editing ? "Simpan" : "Tambah"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
