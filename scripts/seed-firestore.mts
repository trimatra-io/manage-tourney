import "dotenv/config";
import { adminAuth, adminDb } from "../src/lib/firebase-admin";

async function ensureAdminUser() {
  const adminEmail = "admin@pertandingan.id";
  const adminPassword = "Admin@12345";

  let uid: string;
  try {
    const existing = await adminAuth.getUserByEmail(adminEmail);
    uid = existing.uid;
    console.log("ℹ️  Admin auth already exists");
  } catch {
    const created = await adminAuth.createUser({
      email: adminEmail,
      password: adminPassword,
      displayName: "Administrator",
    });
    uid = created.uid;
    console.log("✅ Admin auth created:", adminEmail, "/", adminPassword);
  }

  await adminDb.collection("users").doc(uid).set(
    {
      name: "Administrator",
      email: adminEmail,
      role: "ADMIN",
      updatedAt: new Date(),
      createdAt: new Date(),
    },
    { merge: true },
  );

  console.log("✅ Admin firestore profile ready");
}

async function ensureKategori() {
  const categories = [
    { nama: "Kelas 45kg", jenis: "PUTRA", minBerat: 0, maxBerat: 45 },
    { nama: "Kelas 50kg", jenis: "PUTRA", minBerat: 45.1, maxBerat: 50 },
    { nama: "Kelas 55kg", jenis: "PUTRA", minBerat: 50.1, maxBerat: 55 },
    { nama: "Kelas 60kg", jenis: "PUTRA", minBerat: 55.1, maxBerat: 60 },
    { nama: "Kelas 45kg", jenis: "PUTRI", minBerat: 0, maxBerat: 45 },
    { nama: "Kelas 50kg", jenis: "PUTRI", minBerat: 45.1, maxBerat: 50 },
  ];

  const snapshot = await adminDb.collection("kategori").get();
  const existingKeys = new Set(
    snapshot.docs.map((doc) => {
      const data = doc.data();
      return `${data.nama}::${data.jenis}`;
    }),
  );

  let created = 0;
  const batch = adminDb.batch();

  for (const category of categories) {
    const key = `${category.nama}::${category.jenis}`;
    if (existingKeys.has(key)) continue;
    const ref = adminDb.collection("kategori").doc();
    batch.set(ref, {
      ...category,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    created += 1;
  }

  if (created > 0) {
    await batch.commit();
  }

  console.log(`✅ ${created} kategori created`);
}

async function main() {
  await ensureAdminUser();
  await ensureKategori();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
