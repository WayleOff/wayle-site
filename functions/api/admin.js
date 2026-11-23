// API privée de gestion Wayle : Cloudflare Pages Function + base D1.
// Protégée deux fois : par Cloudflare Access (réglage dans Zero Trust) et par la vérification du jeton ici.
const COLLS = ["g_clients","g_projets","g_docs","g_prospects","g_config","g_notes","g_taches"];
const MAX_BODY = 200000;
let certCache = { at: 0, keys: null };

const b64u = (s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(s.length / 4) * 4, "=")), (c) => c.charCodeAt(0));
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

async function getKeys(team) {
  if (certCache.keys && Date.now() - certCache.at < 3600e3) return certCache.keys;
  const r = await fetch(`https://${team}/cdn-cgi/access/certs`);
  if (!r.ok) throw new Error("certs");
  certCache = { at: Date.now(), keys: (await r.json()).keys };
  return certCache.keys;
}

async function verifyAccess(request, env) {
  const team = env.ACCESS_TEAM_DOMAIN, aud = env.ACCESS_AUD;
  if (!team || !aud) return false; // non configuré : on refuse tout
  const tok = request.headers.get("Cf-Access-Jwt-Assertion");
  if (!tok) return false;
  const parts = tok.split(".");
  if (parts.length !== 3) return false;
  try {
    const header = JSON.parse(new TextDecoder().decode(b64u(parts[0])));
    const payload = JSON.parse(new TextDecoder().decode(b64u(parts[1])));
    if (header.alg !== "RS256") return false;
    const jwk = (await getKeys(team)).find((k) => k.kid === header.kid);
    if (!jwk) return false;
    const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
    const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64u(parts[2]), new TextEncoder().encode(parts[0] + "." + parts[1]));
    if (!ok) return false;
    const audOk = Array.isArray(payload.aud) ? payload.aud.includes(aud) : payload.aud === aud;
    if (!audOk || payload.iss !== `https://${team}` || payload.exp * 1000 < Date.now()) return false;
    if (env.ALLOWED_EMAIL && String(payload.email || "").toLowerCase() !== env.ALLOWED_EMAIL.toLowerCase()) return false;
    return true;
  } catch (e) { return false; }
}

export async function onRequest({ request, env }) {
  if (!(await verifyAccess(request, env))) return json({ error: "unauthorized" }, 401);
  if (!env.DB) return json({ error: "no_database" }, 500);
  const url = new URL(request.url);
  const method = request.method;
  if (method !== "GET") {
    // anti-CSRF : requête volontaire de notre page uniquement
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
    return json(results.map((r) => ({ id: r.id, data: JSON.parse(r.data) })));
  }

  if (!id) return json({ error: "id_required" }, 400);
  if (method === "DELETE") {
    await env.DB.prepare("DELETE FROM docs WHERE coll=?1 AND id=?2").bind(coll, id).run();
    return json({ ok: true });
  }
  if (method === "PUT" || method === "PATCH") {
    const raw = await request.text();
    if (raw.length > MAX_BODY) return json({ error: "too_large" }, 413);
    let body;
    try { body = JSON.parse(raw); } catch (e) { return json({ error: "bad_json" }, 400); }
    if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "bad_body" }, 400);
    delete body.id;
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
