// API privée Wayle : Cloudflare Pages Function + base D1.
// Protégée deux fois : par Cloudflare Access (Zero Trust) et par la vérification du jeton ici.
import { verifyAccess, json } from "../_shared/access.js";
import { validate, diffFromDefaults } from "../../theme/tokens/validate.js";

const COLLS = ["g_clients", "g_projets", "g_docs", "g_prospects", "g_config", "g_notes", "g_taches",
  "s_config", "s_content", "s_pages", "s_media", "c_portal", "c_activity",
  "t_themes"]; // thèmes : { theme:{écarts}, label } ; « published » est servi par /theme.css
const MAX_BODY = 200000;
const MAX_BODY_MEDIA = 1900000; // images du site (≈ 1,4 Mo après encodage)

export async function onRequest({ request, env }) {
  if (!(await verifyAccess(request, env))) return json({ error: "unauthorized" }, 401);
  if (!env.DB) return json({ error: "no_database" }, 500);
  const url = new URL(request.url);
  const method = request.method;
  if (method !== "GET") {
    // anti-CSRF : requête volontaire de nos pages uniquement
    if (request.headers.get("X-Wayle") !== "1") return json({ error: "forbidden" }, 403);
    const origin = request.headers.get("Origin");
    if (origin && origin !== url.origin) return json({ error: "forbidden" }, 403);
  }
  const coll = url.searchParams.get("c");
  const id = url.searchParams.get("id");
  if (!COLLS.includes(coll)) return json({ error: "bad_collection" }, 400);
  if (id !== null && !/^[A-Za-z0-9_-]{1,64}$/.test(id)) return json({ error: "bad_id" }, 400);

  if (method === "GET") {
    if (id) {
      const row = await env.DB.prepare("SELECT data FROM docs WHERE coll=?1 AND id=?2").bind(coll, id).first();
      return json(row ? { id, data: JSON.parse(row.data) } : { id, data: null });
    }
    const { results } = await env.DB.prepare("SELECT id, data FROM docs WHERE coll=?1").bind(coll).all();
    if (coll === "s_media") // la liste ne renvoie pas les images elles-mêmes
      return json(results.map((r) => { const d = JSON.parse(r.data); delete d.data; return { id: r.id, data: d }; }));
    return json(results.map((r) => ({ id: r.id, data: JSON.parse(r.data) })));
  }

  if (!id) return json({ error: "id_required" }, 400);
  if (method === "DELETE") {
    await env.DB.prepare("DELETE FROM docs WHERE coll=?1 AND id=?2").bind(coll, id).run();
    return json({ ok: true });
  }
  if (method === "PUT" || method === "PATCH") {
    const raw = await request.text();
    if (raw.length > (coll === "s_media" ? MAX_BODY_MEDIA : MAX_BODY)) return json({ error: "too_large" }, 413);
    let body;
    try { body = JSON.parse(raw); } catch (e) { return json({ error: "bad_json" }, 400); }
    if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "bad_body" }, 400);
    delete body.id;
    if (coll === "s_media") {
      if (!/^image\/(png|jpeg|webp|gif)$/.test(String(body.type || "")) || typeof body.data !== "string" || !/^[A-Za-z0-9+/=]+$/.test(body.data))
        return json({ error: "bad_media" }, 400);
    }
    if (coll === "t_themes") {
      // validation stricte côté serveur : rien d'inconnu n'est stocké, donc rien d'inconnu n'arrive dans le CSS public
      if (method !== "PUT") return json({ error: "method_not_allowed" }, 405);
      const v = validate(body.theme);
      if (!v.ok) return json({ error: "invalid_theme", details: v.errors.slice(0, 20) }, 400);
      body = { theme: diffFromDefaults(v.theme), label: String(body.label || "").slice(0, 60) };
    }
    let data = body;
    if (method === "PATCH") {
      const row = await env.DB.prepare("SELECT data FROM docs WHERE coll=?1 AND id=?2").bind(coll, id).first();
      if (!row) return json({ error: "not_found" }, 404);
      data = Object.assign(JSON.parse(row.data), body);
    }
    await env.DB.prepare("INSERT INTO docs (coll,id,data,updated_at) VALUES (?1,?2,?3,?4) ON CONFLICT(coll,id) DO UPDATE SET data=?3, updated_at=?4")
      .bind(coll, id, JSON.stringify(data), Date.now()).run();
    return json({ ok: true });
  }
  return json({ error: "method_not_allowed" }, 405);
}
