import { NextRequest, NextResponse } from "next/server";
import { firestore } from "@/lib/firestore";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const perguruanId = searchParams.get("perguruanId");
  const kategoriId = searchParams.get("kategoriId");

  if (!perguruanId) {
    return NextResponse.json({ error: "perguruanId wajib diisi" }, { status: 400 });
  }

  const where: Record<string, unknown> = {
    perguruanId,
    status: "VERIFIED",
  };

  if (kategoriId) where.kategoriId = kategoriId;

  const atlet = await firestore.atlet.findMany({
    where,
    include: { perguruan: { select: { id: true, nama: true } }, kategori: { select: { id: true, nama: true } } },
    orderBy: { nama: "asc" },
  });

  const safePayload = atlet.map((item) => ({
    id: item.id,
    nama: item.nama,
    perguruanId: item.perguruanId,
    perguruan: item.perguruan,
    kategori: item.kategori,
  }));

  return NextResponse.json(safePayload);
}
