const url = process.env.TURSO_DATABASE_URL.replace(/^libsql:\/\//, "https://").replace(/\/$/, "");
const token = process.env.TURSO_AUTH_TOKEN;

async function pipeline(stmts) {
  const requests = stmts.map((sql) => ({ type: "execute", stmt: { sql } }));
  requests.push({ type: "close" });
  const res = await fetch(`${url}/v2/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ requests }),
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

await pipeline([
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
  `ALTER TABLE guests ADD COLUMN coutume INTEGER NOT NULL DEFAULT 0`,
]);
