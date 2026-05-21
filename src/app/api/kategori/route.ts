import { NextRequest, NextResponse } from "next/server";
import { firestore } from "@/lib/firestore";
import { nextAuth as auth } from "@/lib/auth";
import type { SessionUser } from "@/types/session";

export async function GET() {
  const kategori = await firestore.kategori.findMany({ orderBy: { nama: "asc" } });
  return NextResponse.json(kategori);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  if (!session || user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const kategori = await firestore.kategori.create({
    data: { nama: body.nama, jenis: body.jenis, minBerat: body.minBerat, maxBerat: body.maxBerat },
  });
  return NextResponse.json(kategori, { status: 201 });
}
