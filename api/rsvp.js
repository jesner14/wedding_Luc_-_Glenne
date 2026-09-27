import { getDb } from "../server/guests.js";

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string" && req.body) {
    return JSON.parse(req.body);
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.end();
    return;
  }

  try {
    if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
      send(res, 500, {
        error:
          "Turso n’est pas configuré. Ajoute TURSO_DATABASE_URL et TURSO_AUTH_TOKEN dans Vercel.",
      });
      return;
    }

    const db = await getDb();

    if (req.method === "GET") {
      send(res, 200, await db.listGuests());
      return;
    }

    if (req.method === "POST") {
      const body = await readJsonBody(req);
      const name = String(body.name || "").trim();
      const coutume = Boolean(body.coutume);
      const mairie = Boolean(body.mairie);
      const eglise = Boolean(body.eglise);
      const soiree = Boolean(body.soiree);
      const note = String(body.note || "").trim();

      if (!name) {
        send(res, 400, { error: "Merci d’indiquer votre nom complet." });
        return;
      }
      if (!coutume && !mairie && !eglise && !soiree) {
        send(res, 400, { error: "Merci de sélectionner au moins un événement." });
        return;
      }

      try {
        const result = await db.createGuest({ name, coutume, mairie, eglise, soiree, note });
        send(res, result.existing ? 200 : 201, result);
      } catch (err) {
        send(res, err.status || 500, { error: err.message || "Erreur serveur." });
      }
      return;
    }

    send(res, 405, { error: "Method not allowed" });
  } catch (err) {
    console.error(err);
    send(res, 500, { error: err.message || "Erreur serveur." });
  }
}
