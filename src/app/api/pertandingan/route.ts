import { NextRequest, NextResponse } from "next/server";
import { firestore } from "@/lib/firestore";
import { nextAuth as auth } from "@/lib/auth";
import type { SessionUser } from "@/types/session";

type DraftMatch = {
  jadwalId: string;
  kategoriId: string;
  babak: string;
  nomor: number;
  atlet1Id?: string | null;
  atlet2Id?: string | null;
  status: string;
  pemenangId?: string | null;
};

const ROUND_LABELS: Record<number, string> = {
  1: "FINAL",
  2: "SEMIFINAL",
  4: "QUARTERFINAL",
  8: "ROUND_OF_16",
  16: "ROUND_OF_32",
};

function getRoundLabel(matchCount: number) {
  return ROUND_LABELS[matchCount] || `ROUND_OF_${matchCount * 2}`;
}

// Generate tournament bracket from verified athletes
export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  if (!session || user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { jadwalId, kategoriId, perguruanIds } = body as {
    jadwalId?: string;
    kategoriId?: string;
    perguruanIds?: string[];
  };

  if (!jadwalId || !kategoriId) {
    return NextResponse.json({ error: "jadwalId dan kategoriId wajib diisi" }, { status: 400 });
  }

  const allowedPerguruanIds = Array.isArray(perguruanIds)
    ? new Set(perguruanIds.filter((item) => typeof item === "string" && item.trim().length > 0))
    : null;

  // Get verified athletes for this category
  const atlet = await firestore.atlet.findMany({
    where: { status: "VERIFIED", kategoriId },
    orderBy: { createdAt: "asc" },
  });

  const atletTerseleksi = allowedPerguruanIds
    ? atlet.filter((item) => item.perguruanId && allowedPerguruanIds.has(item.perguruanId))
    : atlet;

  const atletPerPerguruanMap = new Map<string, typeof atletTerseleksi>();
  atletTerseleksi.forEach((item) => {
    if (!item.perguruanId) return;
    const existing = atletPerPerguruanMap.get(item.perguruanId) ?? [];
    atletPerPerguruanMap.set(item.perguruanId, [...existing, item]);
  });

  const pesertaPerguruan = Array.from(atletPerPerguruanMap.values()).map((anggota) => {
    const shuffled = [...anggota].sort(() => Math.random() - 0.5);
    return shuffled[0];
  });

  if (pesertaPerguruan.length < 2) {
    return NextResponse.json({ error: "Minimal 2 perguruan terverifikasi untuk kategori ini" }, { status: 400 });
  }

  // Delete existing matches for this jadwal+kategori
  await firestore.pertandingan.deleteMany({ where: { jadwalId, kategoriId } });

  // Build single-elimination bracket
  const rounds = Math.ceil(Math.log2(pesertaPerguruan.length));
  const totalSlots = Math.pow(2, rounds);
  const shuffled = [...pesertaPerguruan].sort(() => Math.random() - 0.5);
  const pertandinganList: DraftMatch[] = [];
  let matchNumber = 1;
  const round1Matches = totalSlots / 2;

  const firstRoundPairs: Array<{ atlet1Id: string | null; atlet2Id: string | null }> = Array.from(
    { length: round1Matches },
    () => ({ atlet1Id: null, atlet2Id: null }),
  );

  // Distribute athletes so each first-round match gets at least one participant.
  shuffled.forEach((item, index) => {
    const pairIndex = index % round1Matches;
    if (index < round1Matches) {
      firstRoundPairs[pairIndex].atlet1Id = item.id;
      return;
    }
    firstRoundPairs[pairIndex].atlet2Id = item.id;
  });

  const firstRoundLabel = getRoundLabel(round1Matches);
  firstRoundPairs.forEach((pair) => {
    const autoWinner = pair.atlet1Id && !pair.atlet2Id ? pair.atlet1Id : null;
    pertandinganList.push({
      jadwalId,
      kategoriId,
      babak: firstRoundLabel,
      nomor: matchNumber++,
      atlet1Id: pair.atlet1Id,
      atlet2Id: pair.atlet2Id,
      status: autoWinner ? "SELESAI" : "BELUM_MULAI",
      pemenangId: autoWinner,
    });
  });

  const roundBuckets: Record<string, DraftMatch[]> = {
    [firstRoundLabel]: pertandinganList.filter((item) => item.babak === firstRoundLabel),
  };

  // Create upper rounds placeholders
  for (let round = round1Matches / 2; round >= 1; round /= 2) {
    const babak = getRoundLabel(round);
    const bucket: DraftMatch[] = [];
    for (let i = 0; i < round; i++) {
      const match: DraftMatch = { jadwalId, kategoriId, babak, nomor: matchNumber++, status: "BELUM_MULAI" };
      pertandinganList.push(match);
      bucket.push(match);
    }
    roundBuckets[babak] = bucket;
  }

  // Propagate auto-qualified participants to next rounds to create waiting slots.
  for (let round = round1Matches; round > 1; round /= 2) {
    const currentLabel = getRoundLabel(round);
    const nextLabel = getRoundLabel(round / 2);
    const currentMatches = roundBuckets[currentLabel] ?? [];
    const nextMatches = roundBuckets[nextLabel] ?? [];

    currentMatches.forEach((currentMatch, index) => {
      if (!currentMatch.pemenangId) return;
      const nextMatch = nextMatches[Math.floor(index / 2)];
      if (!nextMatch) return;

      if (index % 2 === 0) nextMatch.atlet1Id = currentMatch.pemenangId;
      else nextMatch.atlet2Id = currentMatch.pemenangId;
      nextMatch.status = "BELUM_MULAI";
      nextMatch.pemenangId = null;
    });
  }

  await firestore.pertandingan.createMany({ data: pertandinganList as Record<string, unknown>[] });

  const created = await firestore.pertandingan.findMany({
    where: { jadwalId, kategoriId },
    include: {
      atlet1: { include: { perguruan: { select: { id: true, nama: true } } } },
      atlet2: { include: { perguruan: { select: { id: true, nama: true } } } },
      pemenang: { include: { perguruan: { select: { id: true, nama: true } } } },
    },
    orderBy: { nomor: "asc" },
  });

  return NextResponse.json(created, { status: 201 });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const jadwalId = searchParams.get("jadwalId");
  const kategoriId = searchParams.get("kategoriId");

  const where: Record<string, unknown> = {};
  if (jadwalId) where.jadwalId = jadwalId;
  if (kategoriId) where.kategoriId = kategoriId;

  const pertandingan = await firestore.pertandingan.findMany({
    where,
    include: {
      atlet1: { include: { perguruan: { select: { id: true, nama: true } } } },
      atlet2: { include: { perguruan: { select: { id: true, nama: true } } } },
      pemenang: { include: { perguruan: { select: { id: true, nama: true } } } },
      kategori: true,
    },
    orderBy: { nomor: "asc" },
  });
  return NextResponse.json(pertandingan);
}
