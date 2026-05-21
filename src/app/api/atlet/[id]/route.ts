import { NextRequest, NextResponse } from "next/server";
import { firestore } from "@/lib/firestore";
import { nextAuth as auth } from "@/lib/auth";
import type { SessionUser } from "@/types/session";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const atlet = await firestore.atlet.findUnique({
    where: { id },
    include: { perguruan: true, kategori: true },
  });
  if (!atlet) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(atlet);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const user = session.user as SessionUser;
  const role = user.role;

  const atlet = await firestore.atlet.findUnique({ where: { id } });
  if (!atlet) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (role === "ADMIN") {
    if (body.status !== undefined) data.status = body.status;
    if (body.catatan !== undefined) data.catatan = body.catatan;
    if (body.kategoriId !== undefined) data.kategoriId = body.kategoriId;
    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);
  }
  if (role === "PERGURUAN") {
    if (atlet.status !== "PENDING") {
      return NextResponse.json({ error: "Cannot edit verified/rejected athlete" }, { status: 403 });
    }
    const fields = ["nik", "nama", "ttl", "beratBadan", "tinggiBadan", "fotoUrl", "berkasUrl", "kategoriId"];
    fields.forEach((f) => { if (body[f] !== undefined) data[f] = body[f]; });
  }

  const updated = await firestore.atlet.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user2 = session.user as SessionUser;
  const role2 = user2.role;
  const atlet = await firestore.atlet.findUnique({ where: { id } });
  if (!atlet) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (role2 === "PERGURUAN") {
    const perguruanId = user2.perguruanId;
    if (atlet.perguruanId !== perguruanId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  await firestore.atlet.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
