import { NextRequest, NextResponse } from "next/server";
import { firestore } from "@/lib/firestore";
import { nextAuth as auth } from "@/lib/auth";
import type { SessionUser } from "@/types/session";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as SessionUser;
  const where: Record<string, unknown> =
    user.role === "PERGURUAN"
      ? { perguruanId: user.perguruanId }
      : {};

  const pelatih = await firestore.pelatih.findMany({
    where,
    include: { perguruan: { select: { nama: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(pelatih);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as SessionUser;
  const perguruanId = user.perguruanId;
  if (!perguruanId) return NextResponse.json({ error: "No perguruan" }, { status: 403 });

  const body = await req.json();
  const pelatih = await firestore.pelatih.create({
    data: {
      nama: body.nama,
      sertifikasi: body.sertifikasi,
      telepon: body.telepon,
      isActive: Boolean(body.isActive),
      perguruanId,
    },
  });
  return NextResponse.json(pelatih, { status: 201 });
}
