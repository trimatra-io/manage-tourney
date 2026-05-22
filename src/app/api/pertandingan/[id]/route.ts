import { NextRequest, NextResponse } from "next/server";
import { firestore as prisma } from "@/lib/firestore";
import { nextAuth as auth } from "@/lib/auth";
import type { SessionUser } from "@/types/session";

const ROUND_ORDER = ["ROUND_OF_32", "ROUND_OF_16", "QUARTERFINAL", "SEMIFINAL", "FINAL"];

function getNextRound(round: string) {
  const idx = ROUND_ORDER.indexOf(round);
  if (idx < 0 || idx === ROUND_ORDER.length - 1) return null;
  return ROUND_ORDER[idx + 1];
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  if (!session || user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json()) as {
    skor1?: number | null;
    skor2?: number | null;
    status?: string;
    pemenangId?: string | null;
  };
  const data: {
    skor1?: number | null;
    skor2?: number | null;
    status?: string;
    pemenangId?: string | null;
  } = {};
  if (body.skor1 !== undefined) data.skor1 = body.skor1;
  if (body.skor2 !== undefined) data.skor2 = body.skor2;
  if (body.status !== undefined) data.status = body.status;
  if (body.pemenangId !== undefined) data.pemenangId = body.pemenangId;

  const updated = await prisma.pertandingan.update({ where: { id }, data });

  if (body.pemenangId) {
    const allMatches = await prisma.pertandingan.findMany({
      where: { jadwalId: updated.jadwalId, kategoriId: updated.kategoriId },
      orderBy: { nomor: "asc" },
    });

    const currentRoundMatches = allMatches
      .filter((item) => item.babak === updated.babak)
      .sort((left, right) => left.nomor - right.nomor);
    const currentIndex = currentRoundMatches.findIndex((item) => item.id === updated.id);
    const nextRound = getNextRound(updated.babak);

    if (currentIndex >= 0 && nextRound) {
      const nextRoundMatches = allMatches
        .filter((item) => item.babak === nextRound)
        .sort((left, right) => left.nomor - right.nomor);
      const targetMatch = nextRoundMatches[Math.floor(currentIndex / 2)];

      if (targetMatch) {
        const isLeftSlot = currentIndex % 2 === 0;
        const slotKey = isLeftSlot ? "atlet1Id" : "atlet2Id";
        const slotValue = targetMatch[slotKey as keyof typeof targetMatch] as string | null | undefined;

        if (slotValue !== body.pemenangId) {
          await prisma.pertandingan.update({
            where: { id: targetMatch.id },
            data: {
              [slotKey]: body.pemenangId,
              status: "BELUM_MULAI",
              pemenangId: null,
              skor1: null,
              skor2: null,
            },
          });
        }
      }
    }
  }

  const refreshed = await prisma.pertandingan.findUnique({ where: { id } });
  return NextResponse.json(refreshed ?? updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  if (!session || user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.pertandingan.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
