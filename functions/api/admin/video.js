// Envoi et suppression des vidéos depuis l'admin (stockage Cloudflare R2, liaison « VIDEOS »).
// Sous /api/admin : protégé par Cloudflare Access comme le reste de l'admin. La lecture publique est dans /api/video.
import { verifyAccess } from "../../_shared/access.js";

const MAX_BYTES = 90 * 1024 * 1024; // les Pages Functions acceptent 100 Mo par requête
const json = (o, st = 200) => new Response(JSON.stringify(o), { status: st, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });

async function guard(request, env) {
  if (!(await verifyAccess(request, env))) return json({ error: "unauthorized" }, 401);
  const url = new URL(request.url);
  if (request.headers.get("X-Wayle") !== "1") return json({ error: "forbidden" }, 403);
  const origin = request.headers.get("Origin");
  if (origin && origin !== url.origin) return json({ error: "forbidden" }, 403);
  return null;
}

/* GET : le stockage vidéo est-il activé ? */
export async function onRequestGet({ request, env }) {
  const bad = await guard(request, env); if (bad) return bad;
  return json({ configured: !!env.VIDEOS, max: MAX_BYTES });
}

/* POST ?name=...&type=video/mp4 : corps = le fichier vidéo */
export async function onRequestPost({ request, env }) {
  const bad = await guard(request, env); if (bad) return bad;
  if (!env.VIDEOS) return json({ error: "not_configured" }, 501);
  const url = new URL(request.url);
  const type = String(url.searchParams.get("type") || "");
  if (!/^video\/(mp4|webm)$/.test(type)) return json({ error: "bad_type" }, 415);
  const len = parseInt(request.headers.get("Content-Length") || "0", 10);
  if (!len) return json({ error: "length_required" }, 411);
  if (len > MAX_BYTES) return json({ error: "too_large" }, 413);
  if (!request.body) return json({ error: "empty" }, 400);
  const rnd = [...crypto.getRandomValues(new Uint8Array(6))].map((x) => x.toString(36).padStart(2, "0")).join("").slice(0, 8);
  const id = "v" + Date.now().toString(36) + rnd;
  await env.VIDEOS.put("v/" + id, request.body, { httpMetadata: { contentType: type } });
  return json({ id, src: "/api/video?id=" + id, size: len });
}

/* DELETE ?id=... */
export async function onRequestDelete({ request, env }) {
  const bad = await guard(request, env); if (bad) return bad;
  if (!env.VIDEOS) return json({ error: "not_configured" }, 501);
  const id = new URL(request.url).searchParams.get("id") || "";
  if (!/^[A-Za-z0-9_-]{6,64}$/.test(id)) return json({ error: "bad_id" }, 400);
  await env.VIDEOS.delete("v/" + id);
  return json({ ok: true });
}
