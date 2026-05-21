"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { registerAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", password: "", confirmPassword: "",
    namaPerguruan: "", telepon: "", alamat: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { toast.error("Password tidak cocok"); return; }
    if (form.password.length < 8) { toast.error("Password minimal 8 karakter"); return; }
    setLoading(true);
    const res = await registerAction({
      name: form.name, email: form.email, password: form.password,
      namaPerguruan: form.namaPerguruan, telepon: form.telepon, alamat: form.alamat,
    });
    setLoading(false);
    if (res.success) {
      toast.success("Akun berhasil dibuat! Silakan login.");
      router.push("/login");
    } else {
      toast.error(res.error ?? "Terjadi kesalahan");
    }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50 flex items-center justify-center p-4 py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <Trophy className="text-white" size={28} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Daftar Akun Perguruan</h1>
          <p className="text-gray-500 mt-1 text-sm">Buat akun untuk mendaftarkan atlet Anda</p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Form Pendaftaran</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="border-b pb-4 mb-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Data Akun</p>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Nama Lengkap *</Label>
                    <Input placeholder="Nama pengelola/PIC" required value={form.name} onChange={set("name")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email *</Label>
                    <Input type="email" placeholder="email@perguruan.com" required value={form.email} onChange={set("email")} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Password *</Label>
                      <Input type="password" placeholder="Min. 8 karakter" required value={form.password} onChange={set("password")} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Konfirmasi Password *</Label>
                      <Input type="password" placeholder="Ulangi password" required value={form.confirmPassword} onChange={set("confirmPassword")} />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Data Perguruan</p>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Nama Perguruan *</Label>
                    <Input placeholder="Nama resmi perguruan" required value={form.namaPerguruan} onChange={set("namaPerguruan")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Nomor Telepon *</Label>
                    <Input placeholder="08xx-xxxx-xxxx" required value={form.telepon} onChange={set("telepon")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Alamat</Label>
                    <Input placeholder="Alamat lengkap perguruan" value={form.alamat} onChange={set("alamat")} />
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 gap-2 mt-2" disabled={loading}>
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? "Mendaftarkan..." : "Daftar Sekarang"}
              </Button>
            </form>
            <p className="text-center text-sm text-gray-500 mt-4">
              Sudah punya akun?{" "}
              <Link href="/login" className="text-blue-600 hover:underline font-medium">Login di sini</Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
