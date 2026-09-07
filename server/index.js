import { createServer } from "node:http";
import { getDb } from "./guests.js";

const PORT = Number(process.env.PORT || 3001);

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }

  try {
    const db = await getDb();

    if (req.method === "GET" && url.pathname === "/api/health") {
      json(res, 200, {
        ok: true,
        backend: process.env.TURSO_DATABASE_URL ? "turso" : "local-sqlite",
      });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/rsvp") {
      json(res, 200, await db.listGuests());
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/rsvp") {
      const body = await readBody(req);
      const name = String(body.name || "").trim();
      const mairie = Boolean(body.mairie);
      const eglise = Boolean(body.eglise);
      const soiree = Boolean(body.soiree);
      const note = String(body.note || "").trim();

      if (!name) {
        json(res, 400, { error: "Merci d’indiquer votre nom complet." });
        return;
      }
      if (!mairie && !eglise && !soiree) {
        json(res, 400, { error: "Merci de sélectionner au moins un événement." });
        return;
      }

      try {
        const result = await db.createGuest({ name, mairie, eglise, soiree, note });
        json(res, result.existing ? 200 : 201, result);
      } catch (err) {
        json(res, err.status || 500, { error: err.message || "Erreur serveur." });
      }
      return;
    }

    json(res, 404, { error: "Not found" });
  } catch (err) {
    console.error(err);
    json(res, 500, { error: "Erreur serveur." });
  }
});

server.listen(PORT, () => {
  const mode = process.env.TURSO_DATABASE_URL ? "Turso" : "SQLite local";
  console.log(`RSVP API (${mode}) on http://localhost:${PORT}`);
});
