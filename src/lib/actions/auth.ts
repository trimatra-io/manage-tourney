"use server";

import { signIn, signOut } from "@/lib/auth";
import { firestore } from "@/lib/firestore";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { AuthError } from "next-auth";

export async function loginAction(email: string, password: string) {
  try {
    await signIn("credentials", { email, password, redirect: false });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { success: false, error: "Email atau password salah" };
    }
    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirect: false });
}

export async function registerAction(data: {
  name: string;
  email: string;
  password: string;
  namaPerguruan: string;
  telepon: string;
  alamat?: string;
}) {
  const existing = await firestore.user.findUnique({ where: { email: data.email } });
  if (existing) return { success: false, error: "Email sudah terdaftar" };

  try {
    const userRecord = await adminAuth.createUser({
      email: data.email,
      password: data.password,
      displayName: data.name,
    });

    const userRef = adminDb.collection("users").doc(userRecord.uid);
    const perguruanRef = adminDb.collection("perguruan").doc();
    const createdAt = new Date();
    const batch = adminDb.batch();

    batch.set(userRef, {
      name: data.name,
      email: data.email,
      role: "PERGURUAN",
      createdAt,
      updatedAt: createdAt,
    });

    batch.set(perguruanRef, {
      nama: data.namaPerguruan,
      email: data.email,
      telepon: data.telepon,
      alamat: data.alamat ?? null,
      userId: userRecord.uid,
      createdAt,
      updatedAt: createdAt,
    });

    await batch.commit();
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "auth/email-already-exists"
    ) {
      return { success: false, error: "Email sudah terdaftar" };
    }

    throw error;
  }

  return { success: true };
}
