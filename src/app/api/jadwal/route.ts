import { NextRequest, NextResponse } from "next/server";
import { firestore } from "@/lib/firestore";
import { nextAuth as auth } from "@/lib/auth";
import type { SessionUser } from "@/types/session";

export async function GET() {
  const jadwal = await firestore.jadwal.findMany({
    include: { jadwalKategori: { include: { kategori: true } }, pertandingan: true },
    orderBy: { tanggal: "asc" },
  });
  return NextResponse.json(jadwal);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  if (!session || user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const jadwal = await firestore.jadwal.create({
    data: {
      nama: body.nama,
      tanggal: new Date(body.tanggal),
      lokasi: body.lokasi,
      status: body.status ?? "DRAFT",
    },
  });
  return NextResponse.json(jadwal, { status: 201 });
}
