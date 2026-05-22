import { Timestamp } from "firebase-admin/firestore";
import { adminDb as db } from "@/lib/firebase-admin";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

type QueryArgs = {
  where?: AnyRecord;
  include?: AnyRecord;
  orderBy?: AnyRecord;
  take?: number;
  select?: AnyRecord;
};

const COLLECTIONS: Record<string, string> = {
  user: "users",
  perguruan: "perguruan",
  atlet: "atlet",
  pelatih: "pelatih",
  kejuaraan: "kejuaraan",
  kategori: "kategori",
  jadwal: "jadwal",
  jadwalKategori: "jadwal_kategori",
  pertandingan: "pertandingan",
};

function now() {
  return new Date();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeValue(value: any): any {
  if (value instanceof Timestamp) return value.toDate();
  if (Array.isArray(value)) return value.map(normalizeValue);
  if (value && typeof value === "object") {
    const next: AnyRecord = {};
    Object.entries(value).forEach(([key, nestedValue]) => {
      next[key] = normalizeValue(nestedValue);
    });
    return next;
  }
  return value;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function stripUndefined(value: any): any {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (value instanceof Date || value instanceof Timestamp) return value;

  if (Array.isArray(value)) {
    return value
      .map((item) => stripUndefined(item))
      .filter((item) => item !== undefined);
  }

  if (value && typeof value === "object") {
    const next: AnyRecord = {};
    Object.entries(value).forEach(([key, nestedValue]) => {
      const cleaned = stripUndefined(nestedValue);
      if (cleaned !== undefined) {
        next[key] = cleaned;
      }
    });
    return next;
  }

  return value;
}

function applyWhere<T extends AnyRecord>(rows: T[], where?: AnyRecord): T[] {
  if (!where) return rows;
  return rows.filter((row) =>
    Object.entries(where).every(([key, value]) => {
      if (value === undefined) return true;
      return row[key] === value;
    }),
  );
}

function applyOrder<T extends AnyRecord>(rows: T[], orderBy?: AnyRecord): T[] {
  if (!orderBy) return rows;
  const [field, direction] = Object.entries(orderBy)[0] as [string, "asc" | "desc"];
  const sign = direction === "desc" ? -1 : 1;

  return [...rows].sort((left, right) => {
    const leftValue = left[field] instanceof Date ? left[field].getTime() : left[field];
    const rightValue = right[field] instanceof Date ? right[field].getTime() : right[field];
    if (leftValue === rightValue) return 0;
    return leftValue > rightValue ? sign : -sign;
  });
}

function applyTake<T>(rows: T[], take?: number): T[] {
  if (!take || take < 1) return rows;
  return rows.slice(0, take);
}

function pickSelect(data: AnyRecord, select?: AnyRecord) {
  if (!select) return data;
  const out: AnyRecord = {};
  Object.entries(select).forEach(([key, enabled]) => {
    if (enabled) out[key] = data[key];
  });
  return out;
}

async function readAll(model: string): Promise<AnyRecord[]> {
  const snap = await db.collection(COLLECTIONS[model]).get();
  return snap.docs.map((doc) => normalizeValue({ id: doc.id, ...doc.data() }));
}

async function readOne(model: string, id: string): Promise<AnyRecord | null> {
  const doc = await db.collection(COLLECTIONS[model]).doc(id).get();
  if (!doc.exists) return null;
  return normalizeValue({ id: doc.id, ...doc.data() });
}

async function hydrateAtlet(atlet: AnyRecord, include?: AnyRecord) {
  if (!include) return atlet;
  const out: AnyRecord = { ...atlet };

  if (include.perguruan) {
    const perguruan = atlet.perguruanId ? await readOne("perguruan", atlet.perguruanId) : null;
    out.perguruan = include.perguruan.select ? pickSelect(perguruan ?? {}, include.perguruan.select) : perguruan;
  }

  if (include.kategori) {
    out.kategori = atlet.kategoriId ? await readOne("kategori", atlet.kategoriId) : null;
  }

  if (include.kemenangan) {
    let data = applyWhere(await readAll("pertandingan"), { pemenangId: atlet.id });
    const cfg = typeof include.kemenangan === "object" ? include.kemenangan : {};
    data = applyWhere(data, cfg.where);
    if (cfg.include?.jadwal || cfg.include?.kategori) {
      data = await Promise.all(
        data.map(async (match) => {
          const row: AnyRecord = { ...match };
          if (cfg.include?.jadwal) row.jadwal = match.jadwalId ? await readOne("jadwal", match.jadwalId) : null;
          if (cfg.include?.kategori) row.kategori = match.kategoriId ? await readOne("kategori", match.kategoriId) : null;
          return row;
        }),
      );
    }
    out.kemenangan = data;
  }

  if (include.pertandingan1 || include.pertandingan2) {
    const loadMatchList = async (field: "atlet1Id" | "atlet2Id", cfg: AnyRecord) => {
      let data = applyWhere(await readAll("pertandingan"), { [field]: atlet.id });
      data = applyWhere(data, cfg.where);
      data = applyOrder(data, cfg.orderBy);
      if (cfg.include) {
        data = await Promise.all(data.map((item) => hydratePertandingan(item, cfg.include)));
      }
      return data;
    };

    if (include.pertandingan1) {
      const cfg = typeof include.pertandingan1 === "object" ? include.pertandingan1 : {};
      out.pertandingan1 = await loadMatchList("atlet1Id", cfg);
    }

    if (include.pertandingan2) {
      const cfg = typeof include.pertandingan2 === "object" ? include.pertandingan2 : {};
      out.pertandingan2 = await loadMatchList("atlet2Id", cfg);
    }
  }

  return out;
}

async function hydratePertandingan(data: AnyRecord, include?: AnyRecord) {
  if (!include) return data;
  const out: AnyRecord = { ...data };

  const hydrateMatchAtlet = async (atletId?: string | null, cfg?: AnyRecord | boolean) => {
    if (!atletId) return null;
    const atlet = await readOne("atlet", atletId);
    if (!atlet) return null;
    if (!cfg || cfg === true) return atlet;
    return hydrateAtlet(atlet, cfg.include ?? cfg);
  };

  if (include.atlet1) out.atlet1 = await hydrateMatchAtlet(data.atlet1Id, include.atlet1);
  if (include.atlet2) out.atlet2 = await hydrateMatchAtlet(data.atlet2Id, include.atlet2);
  if (include.pemenang) out.pemenang = await hydrateMatchAtlet(data.pemenangId, include.pemenang);
  if (include.kategori) out.kategori = data.kategoriId ? await readOne("kategori", data.kategoriId) : null;
  if (include.jadwal) out.jadwal = data.jadwalId ? await readOne("jadwal", data.jadwalId) : null;
  return out;
}

async function hydrateJadwal(data: AnyRecord, include?: AnyRecord) {
  if (!include) return data;
  const out: AnyRecord = { ...data };

  if (include.jadwalKategori) {
    const cfg = typeof include.jadwalKategori === "object" ? include.jadwalKategori : {};
    let links = applyWhere(await readAll("jadwalKategori"), { jadwalId: data.id });
    if (cfg.include?.kategori) {
      links = await Promise.all(
        links.map(async (row) => ({
          ...row,
          kategori: row.kategoriId ? await readOne("kategori", row.kategoriId) : null,
        })),
      );
    }
    out.jadwalKategori = links;
  }

  if (include.pertandingan) {
    const cfg = typeof include.pertandingan === "object" ? include.pertandingan : {};
    let matches = applyWhere(await readAll("pertandingan"), { jadwalId: data.id });
    matches = applyWhere(matches, cfg.where);
    matches = applyOrder(matches, cfg.orderBy);
    if (cfg.include) {
      matches = await Promise.all(matches.map((match) => hydratePertandingan(match, cfg.include)));
    }
    out.pertandingan = matches;
  }

  return out;
}

async function hydratePelatih(data: AnyRecord, include?: AnyRecord) {
  if (!include?.perguruan) return data;
  const perguruan = data.perguruanId ? await readOne("perguruan", data.perguruanId) : null;
  return {
    ...data,
    perguruan: include.perguruan.select ? pickSelect(perguruan ?? {}, include.perguruan.select) : perguruan,
  };
}

async function hydrateUser(data: AnyRecord, include?: AnyRecord) {
  if (!include?.perguruan) return data;
  const list = applyWhere(await readAll("perguruan"), { userId: data.id });
  return { ...data, perguruan: list[0] ?? null };
}

function createDelegate(model: string) {
  const collection = () => db.collection(COLLECTIONS[model]);

  return {
    async count(args: QueryArgs = {}) {
      const rows = await readAll(model);
      return applyWhere(rows, args.where).length;
    },

    async findMany(args: QueryArgs = {}) {
      let rows = applyWhere(await readAll(model), args.where);
      rows = applyOrder(rows, args.orderBy);
      rows = applyTake(rows, args.take);

      if (args.include) {
        if (model === "atlet") rows = await Promise.all(rows.map((row) => hydrateAtlet(row, args.include)));
        if (model === "jadwal") rows = await Promise.all(rows.map((row) => hydrateJadwal(row, args.include)));
        if (model === "pelatih") rows = await Promise.all(rows.map((row) => hydratePelatih(row, args.include)));
        if (model === "pertandingan") rows = await Promise.all(rows.map((row) => hydratePertandingan(row, args.include)));
        if (model === "user") rows = await Promise.all(rows.map((row) => hydrateUser(row, args.include)));
      }

      return rows;
    },

    async findUnique(args: QueryArgs) {
      const where = args.where ?? {};
      const key = Object.keys(where)[0];
      if (!key) return null;

      let row: AnyRecord | null = null;
      if (key === "id") {
        row = await readOne(model, where.id);
      } else {
        const rows = applyWhere(await readAll(model), where);
        row = rows[0] ?? null;
      }

      if (!row) return null;
      if (!args.include) return row;
      if (model === "atlet") return hydrateAtlet(row, args.include);
      if (model === "jadwal") return hydrateJadwal(row, args.include);
      if (model === "pelatih") return hydratePelatih(row, args.include);
      if (model === "pertandingan") return hydratePertandingan(row, args.include);
      if (model === "user") return hydrateUser(row, args.include);
      return row;
    },

    async create(args: { data: AnyRecord }) {
      const data = stripUndefined({ ...args.data });
      const id = collection().doc().id;
      const createdAt = data.createdAt ?? now();
      const updatedAt = data.updatedAt ?? now();

      if (model === "user" && data.perguruan?.create) {
        const perguruanId = db.collection(COLLECTIONS.perguruan).doc().id;
        const perguruanData = stripUndefined({
          ...data.perguruan.create,
          userId: id,
          createdAt,
          updatedAt,
        });
        await db.collection(COLLECTIONS.perguruan).doc(perguruanId).set(perguruanData);
        delete data.perguruan;
      }

      const payload = stripUndefined({ ...data, createdAt, updatedAt });
      await collection().doc(id).set(payload);
      return { id, ...payload };
    },

    async createMany(args: { data: AnyRecord[] }) {
      const batch = db.batch();
      for (const item of args.data) {
        const ref = collection().doc();
        batch.set(ref, stripUndefined({ ...item, createdAt: item.createdAt ?? now(), updatedAt: item.updatedAt ?? now() }));
      }
      await batch.commit();
      return { count: args.data.length };
    },

    async update(args: { where: AnyRecord; data: AnyRecord }) {
      const id = args.where.id;
      if (!id) throw new Error("update requires where.id");
      const payload = stripUndefined({ ...args.data, updatedAt: now() });
      await collection().doc(id).set(payload, { merge: true });
      return (await readOne(model, id)) as AnyRecord;
    },

    async delete(args: { where: AnyRecord }) {
      const id = args.where.id;
      if (!id) throw new Error("delete requires where.id");
      const current = await readOne(model, id);
      await collection().doc(id).delete();
      return current;
    },

    async deleteMany(args: { where?: AnyRecord }) {
      const rows = applyWhere(await readAll(model), args.where);
      if (rows.length === 0) return { count: 0 };
      const batch = db.batch();
      rows.forEach((row) => batch.delete(collection().doc(row.id)));
      await batch.commit();
      return { count: rows.length };
    },
  };
}

export const firestore = {
  user: createDelegate("user"),
  perguruan: createDelegate("perguruan"),
  atlet: createDelegate("atlet"),
  pelatih: createDelegate("pelatih"),
  kejuaraan: createDelegate("kejuaraan"),
  kategori: createDelegate("kategori"),
  jadwal: createDelegate("jadwal"),
  jadwalKategori: createDelegate("jadwalKategori"),
  pertandingan: createDelegate("pertandingan"),
};
