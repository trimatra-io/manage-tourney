"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Trophy, Users, Calendar, BarChart3, Shield, ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSession } from "next-auth/react";
import type { SessionUser } from "@/types/session";

const features = [
  { icon: Users, title: "Manajemen Atlet", desc: "Daftarkan dan kelola data atlet dari perguruan Anda dengan mudah" },
  { icon: Shield, title: "Verifikasi Admin", desc: "Proses verifikasi berkas atlet yang aman dan terpantau" },
  { icon: Calendar, title: "Jadwal Pertandingan", desc: "Jadwal yang terupdate dan dapat diakses kapan saja" },
  { icon: BarChart3, title: "Hasil & Laporan", desc: "Pantau hasil pertandingan secara real-time" },
  { icon: Trophy, title: "Bagan Otomatis", desc: "Generate tournament bracket otomatis berbasis data terverifikasi" },
  { icon: Star, title: "Akses Publik", desc: "Informasi pertandingan dapat diakses oleh umum" },
];

export default function LandingPage() {
  const [sessionRole, setSessionRole] = useState<"ADMIN" | "PERGURUAN" | null>(null);

  useEffect(() => {
    void getSession().then((session) => {
      const role = (session?.user as SessionUser | undefined)?.role;
      setSessionRole(role === "ADMIN" || role === "PERGURUAN" ? role : null);
    });
  }, []);

  const authTarget = sessionRole === "ADMIN"
    ? { href: "/admin", label: "Admin" }
    : sessionRole === "PERGURUAN"
      ? { href: "/dashboard", label: "Perguruan" }
      : { href: "/login", label: "Log in" };

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-900 via-blue-950 to-slate-900 text-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 flex items-center justify-between border-b border-white/15 bg-slate-950/35 px-8 py-4 backdrop-blur-xl shadow-lg shadow-slate-950/20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center shadow-md shadow-amber-950/30">
            <Trophy size={18} className="text-white" />
          </div>
          <span className="font-bold text-lg">Pertandingan</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/" className="text-sm text-gray-300 hover:text-white transition-colors">Home</Link>
          <Link href="/publik" className="text-sm text-gray-300 hover:text-white transition-colors">Atlet</Link>
          <Link href={authTarget.href} className="text-sm text-gray-300 hover:text-white transition-colors">
            {authTarget.label}
          </Link>
          <Link href="/register">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 gap-1 shadow-lg shadow-blue-950/30">
              Perguruan <ArrowRight size={14} />
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-r from-blue-600/20 to-amber-600/10 pointer-events-none" />
        <div className="max-w-5xl mx-auto px-8 py-24 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 mb-6 backdrop-blur-xl shadow-lg shadow-black/10">
              <Trophy size={14} className="text-amber-400" />
              <span className="text-amber-300 text-sm font-medium">Sistem Manajemen Resmi</span>
            </div>
            <h1 className="text-5xl font-extrabold mb-5 leading-tight">
              SELAMAT DATANG DI<br />
                <span className="bg-linear-to-r from-blue-400 to-amber-400 bg-clip-text text-transparent">
                SISTEM MANAJEMEN PERTANDINGAN
              </span>
            </h1>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-10">
              Platform terpadu untuk pendaftaran atlet, verifikasi berkas, manajemen jadwal,
              dan pelaksanaan pertandingan secara digital.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 gap-2 px-8 text-base font-semibold shadow-xl shadow-blue-900/50 backdrop-blur-xl">
                <Users size={18} />
                DAFTAR / MASUK AKUN PERGURUAN
              </Button>
            </Link>
            <Link href={authTarget.href}>
              <Button size="lg" variant="outline" className="border-amber-500/50 bg-white/5 text-amber-300 hover:bg-white/10 gap-2 px-8 text-base font-semibold backdrop-blur-xl">
                <Shield size={18} />
                {sessionRole === "ADMIN"
                  ? "SUDAH MASUK SEBAGAI ADMIN"
                  : sessionRole === "PERGURUAN"
                    ? "SUDAH MASUK SEBAGAI PERGURUAN"
                    : "MASUK PENGELOLA SISTEM (ADMIN)"}
              </Button>
            </Link>
          </motion.div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="text-gray-500 text-sm mt-4">
            → Fungsi: Form pendaftaran Akun Perguruan (Nama, Email, HP)
          </motion.p>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-8 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">Fitur Sistem</h2>
          <p className="text-gray-400">Semua yang Anda butuhkan dalam satu platform</p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="rounded-xl border border-white/10 bg-white/8 p-5 backdrop-blur-xl shadow-lg shadow-black/10 hover:bg-white/12 transition-colors">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mb-3 backdrop-blur">
                <f.icon size={20} className="text-blue-400" />
              </div>
              <h3 className="font-semibold mb-1">{f.title}</h3>
              <p className="text-gray-400 text-sm">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/10 py-16 text-center bg-white/5 backdrop-blur-sm">
        <h2 className="text-2xl font-bold mb-4">Lihat Informasi Pertandingan Publik</h2>
        <p className="text-gray-400 mb-6 text-sm">Jadwal, bagan, dan hasil pertandingan tersedia untuk umum</p>
        <Link href="/publik">
          <Button size="lg" variant="outline" className="border-white/30 bg-white/5 text-white hover:bg-white/10 gap-2 backdrop-blur-xl">
            <BarChart3 size={18} /> Pusat Informasi Publik
          </Button>
        </Link>
      </section>
    </div>
  );
}

