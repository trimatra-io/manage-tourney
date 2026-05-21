import { NextRequest, NextResponse } from "next/server";
import { firestore } from "@/lib/firestore";
import { nextAuth as auth } from "@/lib/auth";
import type { SessionUser } from "@/types/session";

async function ensureAdmin() {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  if (!session || user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const forbidden = await ensureAdmin();
  if (forbidden) return forbidden;

  const { id } = await params;
  const body = await req.json() as { nama?: string };
  const nama = body.nama?.trim();

  if (!nama) {
    return NextResponse.json({ error: "Nama kejuaraan wajib diisi" }, { status: 400 });
  }

  const data = await firestore.kejuaraan.findMany({ orderBy: { nama: "asc" } });
  const duplicate = data.find((item) => item.id !== id && typeof item.nama === "string" && item.nama.toLowerCase() === nama.toLowerCase());
  if (duplicate) {
    return NextResponse.json({ error: "Nama kejuaraan sudah ada" }, { status: 409 });
  }

  const updated = await firestore.kejuaraan.update({ where: { id }, data: { nama } });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const forbidden = await ensureAdmin();
  if (forbidden) return forbidden;

  const { id } = await params;
  const target = await firestore.kejuaraan.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json({ error: "Data kejuaraan tidak ditemukan" }, { status: 404 });
  }

  const jadwalList = await firestore.jadwal.findMany({ orderBy: { createdAt: "desc" } });
  const inUse = jadwalList.some((item) => {
    if (typeof item.nama !== "string") return false;
    return item.nama.trim().toLowerCase() === String(target.nama).trim().toLowerCase();
  });

  if (inUse) {
    return NextResponse.json({ error: "Kejuaraan sudah dipakai di jadwal, tidak bisa dihapus" }, { status: 400 });
  }

  await firestore.kejuaraan.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
