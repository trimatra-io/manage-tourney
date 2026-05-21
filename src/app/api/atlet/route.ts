import { NextRequest, NextResponse } from "next/server";
import { firestore } from "@/lib/firestore";
import { nextAuth as auth } from "@/lib/auth";
import type { SessionUser } from "@/types/session";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const perguruanId = searchParams.get("perguruanId");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const user = session.user as SessionUser;
  if (user.role === "PERGURUAN") {
    where.perguruanId = user.perguruanId;
  } else if (perguruanId) {
    where.perguruanId = perguruanId;
  }

  const atlet = await firestore.atlet.findMany({
    where,
    include: { perguruan: { select: { nama: true } }, kategori: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(atlet);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const perguruanId = (session.user as SessionUser).perguruanId;
  if (!perguruanId) return NextResponse.json({ error: "No perguruan" }, { status: 403 });

  const atlet = await firestore.atlet.create({
    data: {
      nik: body.nik,
      nama: body.nama,
      ttl: body.ttl,
      beratBadan: parseFloat(body.beratBadan),
      tinggiBadan: parseFloat(body.tinggiBadan),
      fotoUrl: body.fotoUrl,
      berkasUrl: body.berkasUrl,
      perguruanId,
      kategoriId: body.kategoriId || null,
      isActive: Boolean(body.isActive),
    },
  });

  return NextResponse.json(atlet, { status: 201 });
}
