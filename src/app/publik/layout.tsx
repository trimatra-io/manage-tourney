import Link from "next/link";
import { Trophy, Calendar, GitBranch, BarChart3 } from "lucide-react";

export const dynamic = "force-dynamic";

export default function PublikLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-gray-800">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <Trophy size={16} className="text-white" />
            </div>
            Pusat Informasi
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/publik" className="flex items-center gap-1.5 text-gray-600 hover:text-green-700 transition-colors">
              <Calendar size={15} /> Jadwal
            </Link>
            <Link href="/publik/bagan" className="flex items-center gap-1.5 text-gray-600 hover:text-green-700 transition-colors">
              <GitBranch size={15} /> Bagan Resmi
            </Link>
            <Link href="/publik/hasil" className="flex items-center gap-1.5 text-gray-600 hover:text-green-700 transition-colors">
              <BarChart3 size={15} /> Hasil & Laporan
            </Link>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
