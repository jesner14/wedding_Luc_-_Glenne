import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const GUEST_LIMIT = 200;

function loadEnvFile() {
  try {
    process.loadEnvFile?.(join(dirname(fileURLToPath(import.meta.url)), "..", ".env"));
  } catch {
    // optional local .env
  }
}

loadEnvFile();

function generateId() {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

function mapGuest(row) {
  return {
    id: row.id,
    name: row.name,
    attending: Boolean(row.attending),
    events: {
      coutume: Boolean(row.coutume),
      mairie: Boolean(row.mairie),
      eglise: Boolean(row.eglise),
      soiree: Boolean(row.soiree),
    },
    note: row.note || "",
    registeredAt: row.registered_at,
  };
}

const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS guests (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    attending INTEGER NOT NULL DEFAULT 1,
    coutume INTEGER NOT NULL DEFAULT 0,
    mairie INTEGER NOT NULL DEFAULT 0,
    eglise INTEGER NOT NULL DEFAULT 0,
    soiree INTEGER NOT NULL DEFAULT 0,
    note TEXT NOT NULL DEFAULT '',
    registered_at TEXT NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_guests_name ON guests(name)`,
];

const MIGRATION_STATEMENTS = [
  `ALTER TABLE guests ADD COLUMN coutume INTEGER NOT NULL DEFAULT 0`,
];

function createTursoDb(url, authToken) {
  const httpUrl = url.replace(/^libsql:\/\//, "https://").replace(/\/$/, "");
  const endpoint = `${httpUrl}/v2/pipeline`;

  async function pipeline(statements) {
    const requests = statements.map((sql) => ({
      type: "execute",
      stmt: typeof sql === "string" ? { sql } : sql,
    }));
    requests.push({ type: "close" });

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ requests }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.error || `Turso HTTP ${res.status}`);
    }

    const results = [];
    for (const item of data.results || []) {
      if (item.type === "error") {
        throw new Error(item.error?.message || "Turso query failed");
      }
      if (item.type === "ok" && item.response?.type === "execute") {
        results.push(item.response.result);
      }
    }
    return results;
  }

  async function pipelineAllowErrors(statements) {
    const requests = statements.map((sql) => ({
      type: "execute",
      stmt: typeof sql === "string" ? { sql } : sql,
    }));
    requests.push({ type: "close" });

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ requests }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.error || `Turso HTTP ${res.status}`);
    }
    return data.results || [];
  }

  function rowsFromResult(result) {
    const cols = result.cols?.map((c) => c.name) || [];
    return (result.rows || []).map((row) => {
      const obj = {};
      row.forEach((cell, i) => {
        const key = cols[i];
        obj[key] = cell && typeof cell === "object" && "value" in cell ? cell.value : cell;
      });
      return obj;
    });
  }

  return {
    async ensureSchema() {
      await pipeline(SCHEMA_STATEMENTS.map((sql) => ({ sql })));
      await pipelineAllowErrors(MIGRATION_STATEMENTS.map((sql) => ({ sql })));
    },
    async listGuests() {
      const [result] = await pipeline([
        {
          sql: `SELECT id, name, attending, coutume, mairie, eglise, soiree, note, registered_at
                FROM guests ORDER BY registered_at DESC`,
        },
      ]);
      const rows = rowsFromResult(result);
      return { guests: rows.map(mapGuest), count: rows.length, limit: GUEST_LIMIT };
    },
    async createGuest({ name, coutume, mairie, eglise, soiree, note }) {
      const [existingResult] = await pipeline([
        {
          sql: `SELECT id, name, attending, coutume, mairie, eglise, soiree, note, registered_at
                FROM guests WHERE name = ? COLLATE NOCASE`,
          args: [{ type: "text", value: name }],
        },
      ]);
      const existingRows = rowsFromResult(existingResult);
      if (existingRows[0]) {
        return { guest: mapGuest(existingRows[0]), existing: true };
      }

      const [countResult] = await pipeline([{ sql: `SELECT COUNT(*) AS c FROM guests` }]);
      const countRows = rowsFromResult(countResult);
      if (Number(countRows[0]?.c || 0) >= GUEST_LIMIT) {
        const err = new Error("Les confirmations sont closes (200 invités).");
        err.status = 403;
        throw err;
      }

      const guest = {
        id: generateId(),
        name,
        attending: 1,
        coutume: coutume ? 1 : 0,
        mairie: mairie ? 1 : 0,
        eglise: eglise ? 1 : 0,
        soiree: soiree ? 1 : 0,
        note,
        registered_at: new Date().toISOString(),
      };

      await pipeline([
        {
          sql: `INSERT INTO guests (id, name, attending, coutume, mairie, eglise, soiree, note, registered_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            { type: "text", value: guest.id },
            { type: "text", value: guest.name },
            { type: "integer", value: String(guest.attending) },
            { type: "integer", value: String(guest.coutume) },
            { type: "integer", value: String(guest.mairie) },
            { type: "integer", value: String(guest.eglise) },
            { type: "integer", value: String(guest.soiree) },
            { type: "text", value: guest.note },
            { type: "text", value: guest.registered_at },
          ],
        },
      ]);

      return { guest: mapGuest(guest), existing: false };
    },
  };
}

async function createLocalDb() {
  const { DatabaseSync } = await import("node:sqlite");
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const dataDir = join(__dirname, "..", "data");
  mkdirSync(dataDir, { recursive: true });
  const db = new DatabaseSync(join(dataDir, "wedding.db"));
  db.exec(SCHEMA_STATEMENTS.join(";\n") + ";");
  for (const sql of MIGRATION_STATEMENTS) {
    try {
      db.exec(sql);
    } catch {
      // column already exists
    }
  }

  return {
    async ensureSchema() {},
    async listGuests() {
      const rows = db
        .prepare(
          `SELECT id, name, attending, coutume, mairie, eglise, soiree, note, registered_at
           FROM guests ORDER BY registered_at DESC`
        )
        .all();
      return { guests: rows.map(mapGuest), count: rows.length, limit: GUEST_LIMIT };
    },
    async createGuest({ name, coutume, mairie, eglise, soiree, note }) {
      const existing = db
        .prepare(
          `SELECT id, name, attending, coutume, mairie, eglise, soiree, note, registered_at
           FROM guests WHERE name = ? COLLATE NOCASE`
        )
        .get(name);
      if (existing) return { guest: mapGuest(existing), existing: true };

      const countRow = db.prepare(`SELECT COUNT(*) AS c FROM guests`).get();
      if (Number(countRow.c) >= GUEST_LIMIT) {
        const err = new Error("Les confirmations sont closes (200 invités).");
        err.status = 403;
        throw err;
      }

      const guest = {
        id: generateId(),
        name,
        attending: 1,
        coutume: coutume ? 1 : 0,
        mairie: mairie ? 1 : 0,
        eglise: eglise ? 1 : 0,
        soiree: soiree ? 1 : 0,
        note,
        registered_at: new Date().toISOString(),
      };

      db.prepare(
        `INSERT INTO guests (id, name, attending, coutume, mairie, eglise, soiree, note, registered_at)
         VALUES (@id, @name, @attending, @coutume, @mairie, @eglise, @soiree, @note, @registered_at)`
      ).run(guest);

      return { guest: mapGuest(guest), existing: false };
    },
  };
}

let cachedDb;

export async function getDb() {
  if (cachedDb) return cachedDb;

  const url = process.env.TURSO_DATABASE_URL || "";
  const token = process.env.TURSO_AUTH_TOKEN || "";

  if (url.startsWith("libsql://") || url.startsWith("https://")) {
    cachedDb = createTursoDb(url, token);
  } else {
    cachedDb = await createLocalDb();
  }

  await cachedDb.ensureSchema();
  return cachedDb;
}

export { GUEST_LIMIT };
