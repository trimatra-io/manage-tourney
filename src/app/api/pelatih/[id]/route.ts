import { NextRequest, NextResponse } from "next/server";
import { firestore } from "@/lib/firestore";
import { nextAuth as auth } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const updated = await firestore.pelatih.update({
    where: { id },
    data: {
      nama: body.nama,
      sertifikasi: body.sertifikasi,
      telepon: body.telepon,
      isActive: Boolean(body.isActive),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await firestore.pelatih.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
