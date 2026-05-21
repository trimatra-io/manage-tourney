"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Upload, Eye, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";

type Atlet = {
  id: string;
  nik: string;
  nama: string;
  ttl: string;
  beratBadan: number;
  tinggiBadan: number;
  berkasUrl?: string;
  status: string;
  catatan?: string;
  kategori?: { id: string; nama: string } | null;
  perguruan?: { nama: string };
};

type Kategori = { id: string; nama: string; jenis: string };
type SortKey = "nama" | "nik" | "ttl" | "bbtb" | "kategori" | "berkas";

const emptyForm = { nik: "", nama: "", ttl: "", beratBadan: "", tinggiBadan: "", berkasUrl: "", kategoriId: "" };

export default function AtletPage() {
  const [atlet, setAtlet] = useState<Atlet[]>([]);
  const [kategori, setKategori] = useState<Kategori[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedAtletIds, setSelectedAtletIds] = useState<string[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [selectedFileMeta, setSelectedFileMeta] = useState<{ name: string; size: number; type: string } | null>(null);
  const [previewBerkas, setPreviewBerkas] = useState<{ url: string; title: string } | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedKategoriFilter, setSelectedKategoriFilter] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: "asc" | "desc" }>({
    key: "nama",
    direction: "asc",
  });
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const getErrorMessage = async (response: Response, fallback: string) => {
    try {
      const payload = await response.json();
      if (payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string") {
        return payload.error;
      }
    } catch {
      return fallback;
    }

    return fallback;
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [atletResponse, kategoriResponse] = await Promise.all([
        fetch("/api/atlet"),
        fetch("/api/kategori"),
      ]);

      if (!atletResponse.ok) {
        throw new Error(await getErrorMessage(atletResponse, "Gagal memuat data atlet"));
      }

      if (!kategoriResponse.ok) {
        throw new Error(await getErrorMessage(kategoriResponse, "Gagal memuat data kategori"));
      }

      const [atletData, kategoriData] = await Promise.all([
        atletResponse.json(),
        kategoriResponse.json(),
      ]);

      setAtlet(atletData);
      setKategori(kategoriData);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memuat data atlet");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchData();
    });
  }, [fetchData]);

  const selectedKategoriLabel = selectedKategoriFilter
    ? kategori.find((item) => item.id === selectedKategoriFilter)
    : null;

  const filtered = atlet.filter((item) => {
    const matchesStatus = activeTab === "all" || item.status === activeTab;
    const matchesKategori = !selectedKategoriFilter || item.kategori?.id === selectedKategoriFilter;
    return matchesStatus && matchesKategori;
  });

  const sortAthletes = (items: Atlet[]) => {
    const directionFactor = sortConfig.direction === "asc" ? 1 : -1;

    return [...items].sort((left, right) => {
      switch (sortConfig.key) {
        case "nik":
          return left.nik.localeCompare(right.nik, "id") * directionFactor;
        case "ttl":
          return left.ttl.localeCompare(right.ttl, "id") * directionFactor;
        case "bbtb": {
          const leftMix = left.beratBadan * 1000 + left.tinggiBadan;
          const rightMix = right.beratBadan * 1000 + right.tinggiBadan;
          return (leftMix - rightMix) * directionFactor;
        }
        case "kategori":
          return (left.kategori?.nama ?? "").localeCompare(right.kategori?.nama ?? "", "id") * directionFactor;
        case "berkas":
          return ((left.berkasUrl ? 1 : 0) - (right.berkasUrl ? 1 : 0)) * directionFactor;
        case "nama":
        default:
          return left.nama.localeCompare(right.nama, "id") * directionFactor;
      }
    });
  };

  const toggleSort = (key: SortKey) => {
    setSortConfig((prev) => prev.key === key
      ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
      : { key, direction: "asc" });
  };

  const groupedAtlet = filtered.reduce<Array<{ key: string; label: string; items: Atlet[] }>>((groups, item) => {
    const key = item.kategori?.id ?? "uncategorized";
    const label = item.kategori?.nama ?? "Belum dikategorikan";
    const existingGroup = groups.find((group) => group.key === key);

    if (existingGroup) {
      existingGroup.items.push(item);
      return groups;
    }

    groups.push({ key, label, items: [item] });
    return groups;
  }, []).map((group) => ({
    ...group,
    items: sortAthletes(group.items),
  })).sort((left, right) => {
    if (left.key === "uncategorized") return 1;
    if (right.key === "uncategorized") return -1;
    return left.label.localeCompare(right.label, "id");
  });

  const groupedSummary = {
    totalAtlet: filtered.length,
    totalKategori: groupedAtlet.length,
    kategoriTerbesar: groupedAtlet[0]
      ? groupedAtlet.reduce((largest, current) => current.items.length > largest.items.length ? current : largest)
      : null,
  };

  const visibleAtletIds = filtered.map((item) => item.id);
  const selectedVisibleCount = visibleAtletIds.filter((id) => selectedAtletIds.includes(id)).length;
  const selectedAtlet = atlet.filter((item) => selectedAtletIds.includes(item.id));

  const formatFileSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isImageFile = (url: string) => /\.(jpg|jpeg|png|webp|gif)$/i.test(url);

  const toggleAtletSelection = (id: string, checked: boolean) => {
    setSelectedAtletIds((prev) => {
      if (checked) {
        return prev.includes(id) ? prev : [...prev, id];
      }
      return prev.filter((item) => item !== id);
    });
  };

  const toggleManySelections = (ids: string[], checked: boolean) => {
    setSelectedAtletIds((prev) => {
      if (checked) {
        return Array.from(new Set([...prev, ...ids]));
      }
      return prev.filter((item) => !ids.includes(item));
    });
  };

  const exportSelectedAtlet = () => {
    if (selectedAtlet.length === 0) {
      toast.error("Pilih atlet terlebih dahulu");
      return;
    }

    const rows = [
      ["Nama", "NIK", "TTL", "Berat Badan", "Tinggi Badan", "Kategori", "Status", "Berkas URL"],
      ...selectedAtlet.map((item) => [
        item.nama,
        item.nik,
        item.ttl,
        String(item.beratBadan),
        String(item.tinggiBadan),
        item.kategori?.nama ?? "Belum dikategorikan",
        item.status,
        item.berkasUrl ?? "",
      ]),
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `atlet-terpilih-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success(`${selectedAtlet.length} atlet berhasil diexport`);
  };

  const handleBulkDelete = async () => {
    if (selectedAtlet.length === 0) {
      toast.error("Pilih atlet terlebih dahulu");
      return;
    }

    if (!confirm(`Yakin hapus ${selectedAtlet.length} atlet terpilih?`)) {
      return;
    }

    const loadingToast = toast.loading(`Menghapus ${selectedAtlet.length} atlet...`);

    try {
      const results = await Promise.all(
        selectedAtlet.map(async (item) => {
          const response = await fetch(`/api/atlet/${item.id}`, { method: "DELETE" });
          return { id: item.id, response };
        })
      );

      const failedResults = [] as string[];

      for (const result of results) {
        if (!result.response.ok) {
          failedResults.push(await getErrorMessage(result.response, `Gagal menghapus atlet ${result.id}`));
        }
      }

      if (failedResults.length > 0) {
        toast.error(failedResults[0], { id: loadingToast });
        return;
      }

      setSelectedAtletIds([]);
      toast.success(`${selectedAtlet.length} atlet berhasil dihapus`, { id: loadingToast });
      await fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Terjadi gangguan saat menghapus atlet", { id: loadingToast });
    }
  };

  const openAdd = () => {
    setForm(emptyForm);
    setEditing(null);
    setSelectedFileMeta(null);
    setUploadProgress(0);
    setOpen(true);
  };
  const openEdit = (a: Atlet) => {
    if (a.status !== "PENDING") { toast.error("Hanya atlet dengan status Pending yang bisa diedit"); return; }
    setForm({
      nik: a.nik, nama: a.nama, ttl: a.ttl,
      beratBadan: String(a.beratBadan), tinggiBadan: String(a.tinggiBadan),
      berkasUrl: a.berkasUrl ?? "", kategoriId: a.kategori?.id ?? "",
    });
    setSelectedFileMeta(null);
    setUploadProgress(0);
    setEditing(a.id);
    setOpen(true);
  };

  const uploadBerkas = async (file: File) => {
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Format berkas harus PDF, JPG, PNG, atau WEBP");
      return;
    }

    const uploadToast = toast.loading(`Mengunggah ${file.name}...`);

    setUploadingFile(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadResult = await new Promise<{ url: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/upload");

        xhr.upload.onprogress = (event) => {
          const progress = event.total ? Math.round((event.loaded / event.total) * 100) : 0;
          setUploadProgress(progress);
        };

        xhr.onload = () => {
          try {
            const payload = JSON.parse(xhr.responseText) as { url?: string; error?: string };

            if (xhr.status >= 200 && xhr.status < 300 && payload.url) {
              resolve({ url: payload.url });
              return;
            }

            reject(new Error(payload.error ?? "Gagal mengunggah berkas"));
          } catch {
            reject(new Error("Gagal membaca respons upload"));
          }
        };

        xhr.onerror = () => reject(new Error("Terjadi gangguan saat mengunggah berkas"));
        xhr.send(formData);
      });

      setForm((prev) => ({ ...prev, berkasUrl: uploadResult.url }));
      setUploadProgress(100);
      toast.success("Berkas berhasil diunggah", { id: uploadToast });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengunggah berkas", { id: uploadToast });
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFileSelection = async (fileList: FileList | null) => {
    const file = fileList?.[0];

    if (!file) {
      toast.error("Pilih satu berkas untuk diunggah");
      return;
    }

    setSelectedFileMeta({
      name: file.name,
      size: file.size,
      type: file.type,
    });

    await uploadBerkas(file);
  };

  const handleFileDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingFile(false);
    await handleFileSelection(event.dataTransfer.files);
  };

  const handleSubmit = async () => {
    if (!form.nik || !form.nama || !form.ttl || !form.beratBadan || !form.tinggiBadan) {
      toast.error("Lengkapi semua field wajib"); return;
    }
    const body = { ...form, beratBadan: parseFloat(form.beratBadan), tinggiBadan: parseFloat(form.tinggiBadan) };
    const url = editing ? `/api/atlet/${editing}` : "/api/atlet";
    const method = editing ? "PATCH" : "POST";
    const loadingToast = toast.loading(editing ? "Menyimpan perubahan atlet..." : "Menambahkan atlet...");

    setSubmitting(true);
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        toast.error(await getErrorMessage(res, "Terjadi kesalahan saat menyimpan data"), { id: loadingToast });
        return;
      }

      toast.success(editing ? "Data atlet diperbarui" : "Atlet berhasil ditambahkan", { id: loadingToast });
      setOpen(false);
      await fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Terjadi gangguan saat menyimpan data", { id: loadingToast });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin hapus atlet ini?")) return;
    const loadingToast = toast.loading("Menghapus atlet...");

    setDeletingId(id);
    try {
      const res = await fetch(`/api/atlet/${id}`, { method: "DELETE" });

      if (!res.ok) {
        toast.error(await getErrorMessage(res, "Gagal menghapus atlet"), { id: loadingToast });
        return;
      }

      toast.success("Atlet dihapus", { id: loadingToast });
      await fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Terjadi gangguan saat menghapus atlet", { id: loadingToast });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Data Atlet</h2>
          <p className="text-sm text-gray-500">Kelola data atlet perguruan Anda</p>
        </div>
        <Button onClick={openAdd} className="bg-blue-600 hover:bg-blue-700 gap-2">
          <Plus size={16} /> Tambah Atlet
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <TabsList>
            <TabsTrigger value="all">Semua ({atlet.length})</TabsTrigger>
            <TabsTrigger value="VERIFIED">Terverifikasi ({atlet.filter(a => a.status === "VERIFIED").length})</TabsTrigger>
            <TabsTrigger value="REJECTED">Ditolak ({atlet.filter(a => a.status === "REJECTED").length})</TabsTrigger>
          </TabsList>

          <div className="grid w-full gap-3 md:w-auto md:grid-cols-1">
            <div className="w-full md:w-64">
              <Select value={selectedKategoriFilter} onValueChange={(value) => setSelectedKategoriFilter(value ?? "") }>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter kategori">
                    {selectedKategoriLabel ? `${selectedKategoriLabel.nama} (${selectedKategoriLabel.jenis})` : "Filter kategori"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua kategori</SelectItem>
                  {kategori.map((item) => (
                    <SelectItem key={item.id} value={item.id}>{item.nama} ({item.jenis})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <TabsContent value={activeTab} className="mt-4">
          {loading ? (
            <Card>
              <CardContent className="text-center py-10 text-gray-400">Memuat data...</CardContent>
            </Card>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="text-center py-10 text-gray-400">Belum ada data atlet</CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {selectedAtlet.length > 0 && (
                <Card>
                  <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Aksi Massal</p>
                      <p className="text-xs text-gray-500">{selectedAtlet.length} atlet dipilih. Arsip belum tersedia di model data saat ini.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={exportSelectedAtlet}>
                        Export terpilih
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => setSelectedAtletIds([])}>
                        Batalkan pilihan
                      </Button>
                      <Button type="button" size="sm" className="bg-red-600 hover:bg-red-700" onClick={handleBulkDelete}>
                        Hapus sekaligus
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid gap-3 md:grid-cols-3">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Total Atlet Tampil</p>
                    <p className="mt-2 text-2xl font-bold text-gray-800">{groupedSummary.totalAtlet}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Jumlah Grup Kategori</p>
                    <p className="mt-2 text-2xl font-bold text-gray-800">{groupedSummary.totalKategori}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Kategori Terbanyak</p>
                    <p className="mt-2 truncate text-sm font-semibold text-gray-800">
                      {groupedSummary.kategoriTerbesar?.label ?? "-"}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {groupedSummary.kategoriTerbesar ? `${groupedSummary.kategoriTerbesar.items.length} atlet` : "Belum ada data"}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Checklist Aktif</p>
                    <p className="mt-2 text-2xl font-bold text-gray-800">{selectedVisibleCount}</p>
                    <p className="mt-1 text-xs text-gray-500">dari {visibleAtletIds.length} atlet yang tampil</p>
                  </CardContent>
                </Card>
              </div>

              {groupedAtlet.map((group) => (
                <Card key={group.key}>
                  <CardContent className="p-0">
                    <button
                      type="button"
                      onClick={() => setCollapsedGroups((prev) => ({ ...prev, [group.key]: !prev[group.key] }))}
                      className="flex w-full items-center justify-between border-b px-4 py-3 text-left"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          {collapsedGroups[group.key] ? <ChevronRight size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                          <h3 className="text-sm font-semibold text-gray-800">{group.label}</h3>
                        </div>
                        <p className="text-xs text-gray-500">{group.items.length} atlet</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={group.items.every((item) => selectedAtletIds.includes(item.id))}
                          onChange={(event) => {
                            event.stopPropagation();
                            toggleManySelections(group.items.map((item) => item.id), event.target.checked);
                          }}
                          onClick={(event) => event.stopPropagation()}
                          className="h-4 w-4 rounded border-gray-300"
                          aria-label={`Pilih semua atlet di kategori ${group.label}`}
                        />
                        <Badge variant="outline">{group.items.length}</Badge>
                      </div>
                    </button>

                    {!collapsedGroups[group.key] && (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-10">
                              <input
                                type="checkbox"
                                checked={group.items.every((item) => selectedAtletIds.includes(item.id))}
                                onChange={(event) => toggleManySelections(group.items.map((item) => item.id), event.target.checked)}
                                className="h-4 w-4 rounded border-gray-300"
                                aria-label={`Pilih semua atlet di tabel ${group.label}`}
                              />
                            </TableHead>
                            <SortableTableHead label="Nama" active={sortConfig.key === "nama"} direction={sortConfig.direction} onClick={() => toggleSort("nama")} />
                            <SortableTableHead label="NIK" active={sortConfig.key === "nik"} direction={sortConfig.direction} onClick={() => toggleSort("nik")} />
                            <SortableTableHead label="TTL" active={sortConfig.key === "ttl"} direction={sortConfig.direction} onClick={() => toggleSort("ttl")} />
                            <SortableTableHead label="BB/TB" active={sortConfig.key === "bbtb"} direction={sortConfig.direction} onClick={() => toggleSort("bbtb")} />
                            <SortableTableHead label="Kategori" active={sortConfig.key === "kategori"} direction={sortConfig.direction} onClick={() => toggleSort("kategori")} />
                            <SortableTableHead label="Berkas" active={sortConfig.key === "berkas"} direction={sortConfig.direction} onClick={() => toggleSort("berkas")} />
                            <TableHead>Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <AnimatePresence>
                            {group.items.map((a) => (
                              <motion.tr key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="border-b last:border-0">
                                <TableCell>
                                  <input
                                    type="checkbox"
                                    checked={selectedAtletIds.includes(a.id)}
                                    onChange={(event) => toggleAtletSelection(a.id, event.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300"
                                    aria-label={`Pilih atlet ${a.nama}`}
                                  />
                                </TableCell>
                                <TableCell className="font-medium">{a.nama}</TableCell>
                                <TableCell className="text-gray-600">{a.nik}</TableCell>
                                <TableCell className="text-gray-600 text-sm">{a.ttl}</TableCell>
                                <TableCell className="text-gray-600 text-sm">{a.beratBadan}kg / {a.tinggiBadan}cm</TableCell>
                                <TableCell>{a.kategori ? <Badge variant="outline">{a.kategori.nama}</Badge> : <span className="text-gray-400 text-xs">-</span>}</TableCell>
                                <TableCell>
                                  {a.berkasUrl ? (
                                    <button
                                      type="button"
                                      onClick={() => setPreviewBerkas({ url: a.berkasUrl!, title: `Berkas ${a.nama}` })}
                                      className="text-blue-600 text-xs flex items-center gap-1 hover:underline"
                                    >
                                      <Eye size={12} /> Lihat
                                    </button>
                                  ) : <span className="text-gray-400 text-xs">Belum upload</span>}
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(a)}>
                                      <Pencil size={14} />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-red-500 hover:text-red-700"
                                      onClick={() => handleDelete(a.id)}
                                      disabled={deletingId === a.id}
                                    >
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
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Atlet" : "Tambah Atlet Baru"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="col-span-2 space-y-1.5">
              <Label>Nama Lengkap *</Label>
              <Input placeholder="Nama atlet" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>NIK *</Label>
              <Input placeholder="16 digit NIK" value={form.nik} onChange={(e) => setForm({ ...form, nik: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>TTL *</Label>
              <Input placeholder="Kota, DD/MM/YYYY" value={form.ttl} onChange={(e) => setForm({ ...form, ttl: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Berat Badan (kg) *</Label>
              <Input type="number" placeholder="60" value={form.beratBadan} onChange={(e) => setForm({ ...form, beratBadan: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Tinggi Badan (cm) *</Label>
              <Input type="number" placeholder="165" value={form.tinggiBadan} onChange={(e) => setForm({ ...form, tinggiBadan: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Kategori</Label>
              <Select value={form.kategoriId} onValueChange={(value) => setForm({ ...form, kategoriId: value ?? "" })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori">
                    {form.kategoriId
                      ? (() => {
                          const selectedKategori = kategori.find((item) => item.id === form.kategoriId);
                          return selectedKategori
                            ? `${selectedKategori.nama} (${selectedKategori.jenis})`
                            : "Pilih kategori";
                        })()
                      : "Pilih kategori"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {kategori.map((k) => (
                    <SelectItem key={k.id} value={k.id}>{k.nama} ({k.jenis})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label className="flex items-center gap-1"><Upload size={14} /> Upload Berkas (KTP/RK)</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  void handleFileSelection(e.target.files);
                }}
              />
              <div
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingFile(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDraggingFile(false);
                }}
                onDrop={(e) => {
                  void handleFileDrop(e);
                }}
                className={`rounded-xl border-2 border-dashed p-5 text-center transition ${
                  isDraggingFile
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/50"
                } ${uploadingFile ? "pointer-events-none opacity-70" : "cursor-pointer"}`}
              >
                <Upload size={18} className="mx-auto mb-2 text-gray-500" />
                <p className="text-sm font-medium text-gray-700">
                  {uploadingFile ? "Mengunggah berkas..." : "Drag and drop file ke sini atau klik untuk memilih"}
                </p>
                <p className="mt-1 text-xs text-gray-500">Mendukung PDF, JPG, PNG, dan WEBP</p>
                {selectedFileMeta && (
                  <div className="mt-3 rounded-lg border border-gray-200 bg-white px-3 py-2 text-left">
                    <p className="truncate text-sm font-medium text-gray-700">{selectedFileMeta.name}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {formatFileSize(selectedFileMeta.size)}
                      {selectedFileMeta.type ? ` • ${selectedFileMeta.type}` : ""}
                    </p>
                  </div>
                )}
                {(uploadingFile || uploadProgress > 0) && (
                  <div className="mt-3">
                    <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full bg-blue-600 transition-[width] duration-200"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs font-medium text-blue-700">Upload {uploadProgress}%</p>
                  </div>
                )}
                {form.berkasUrl && (
                  <a
                    href={form.berkasUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="mt-3 inline-flex text-xs font-medium text-blue-600 underline"
                  >
                    Lihat berkas terunggah
                  </a>
                )}
              </div>
              <p className="text-xs text-gray-400">Berkas akan diunggah otomatis ke penyimpanan lokal lalu ditautkan ke data atlet.</p>
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSubmit} disabled={submitting || uploadingFile}>
              {uploadingFile ? "Menunggu Upload..." : submitting ? "Memproses..." : editing ? "Simpan Perubahan" : "Submit Data"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewBerkas} onOpenChange={() => setPreviewBerkas(null)}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewBerkas?.title ?? "Preview berkas"}</DialogTitle>
          </DialogHeader>
          {previewBerkas && (
            <div className="max-h-[75vh] overflow-hidden rounded-lg border bg-gray-50">
              {isImageFile(previewBerkas.url) ? (
                <div className="relative h-[70vh] w-full">
                  <Image src={previewBerkas.url} alt={previewBerkas.title} fill className="object-contain" unoptimized />
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
