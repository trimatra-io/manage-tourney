import { NextRequest, NextResponse } from "next/server";
import { firestore } from "@/lib/firestore";
import { nextAuth as auth } from "@/lib/auth";
import type { SessionUser } from "@/types/session";

export async function GET() {
  const data = await firestore.kejuaraan.findMany({ orderBy: { nama: "asc" } });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  if (!session || user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json() as { nama?: string };
  const nama = body.nama?.trim();

  if (!nama) {
    return NextResponse.json({ error: "Nama kejuaraan wajib diisi" }, { status: 400 });
  }

  const existing = await firestore.kejuaraan.findMany({ orderBy: { createdAt: "desc" } });
  const matched = existing.find((item) => typeof item.nama === "string" && item.nama.toLowerCase() === nama.toLowerCase());
  if (matched) {
    return NextResponse.json(matched);
  }

  const created = await firestore.kejuaraan.create({ data: { nama } });
  return NextResponse.json(created, { status: 201 });
}
