import { NextRequest, NextResponse } from "next/server";
import { firestore } from "@/lib/firestore";
import { nextAuth as auth } from "@/lib/auth";
import type { SessionUser } from "@/types/session";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const jadwal = await firestore.jadwal.findUnique({
    where: { id },
    include: {
      jadwalKategori: { include: { kategori: true } },
      pertandingan: { include: { atlet1: true, atlet2: true, pemenang: true, kategori: true } },
    },
  });
  if (!jadwal) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(jadwal);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  if (!session || user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.nama) data.nama = body.nama;
  if (body.tanggal) data.tanggal = new Date(body.tanggal);
  if (body.lokasi) data.lokasi = body.lokasi;
  if (body.status) data.status = body.status;

  const jadwal = await firestore.jadwal.update({ where: { id }, data });
  return NextResponse.json(jadwal);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  if (!session || user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await firestore.jadwal.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
