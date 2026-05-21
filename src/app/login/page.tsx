"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { signIn, getSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Trophy, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { SessionUser } from "@/types/session";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });
    setLoading(false);
    if (res?.ok) {
      const session = await getSession();
      toast.success("Login berhasil!");
      router.push((session?.user as SessionUser | undefined)?.role === "ADMIN" ? "/admin" : "/dashboard");
      router.refresh();
    } else {
      toast.error("Email atau password salah");
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-amber-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <Trophy className="text-white" size={28} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Sistem Manajemen Pertandingan</h1>
          <p className="text-gray-500 mt-1 text-sm">Masuk ke akun Anda</p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="email@example.com" required
                  value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input id="password" type={showPass ? "text" : "password"} placeholder="••••••••" required
                    value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="pr-10" />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 gap-2" disabled={loading}>
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? "Memproses..." : "Masuk"}
              </Button>
            </form>
            <p className="text-center text-sm text-gray-500 mt-4">
              Belum punya akun?{" "}
              <Link href="/register" className="text-blue-600 hover:underline font-medium">Daftar Akun Perguruan</Link>
            </p>
            <p className="text-center text-sm text-gray-500 mt-2">
              <Link href="/" className="text-gray-400 hover:text-gray-600">← Kembali ke Beranda</Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
