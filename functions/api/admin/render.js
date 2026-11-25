// Aperçu du mode « Modifier en direct » (admin) : reçoit le contenu en cours d'édition, renvoie la page
// complète avec les repères d'édition. Rien n'est enregistré. Sous /api/admin : protégé par Cloudflare Access comme le reste de l’admin.
import { verifyAccess } from "../../_shared/access.js";
import { composeHome, composeSvc, composeP, SVC_KEYS } from "../../_shared/compose.js";

const MAX = 400000;
const text = (s, st = 200) => new Response(s, { status: st, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });

export async function onRequestPost({ request, env }) {
  if (!(await verifyAccess(request, env))) return text("unauthorized", 401);
  const url = new URL(request.url);
  if (request.headers.get("X-Wayle") !== "1") return text("forbidden", 403);
  const origin = request.headers.get("Origin");
  if (origin && origin !== url.origin) return text("forbidden", 403);
  const raw = await request.text();
  if (raw.length > MAX) return text("too_large", 413);
  let body;
  try { body = JSON.parse(raw); } catch (e) { return text("bad_json", 400); }
  const { kind, key, data } = body || {};
  if (!data || typeof data !== "object") return text("bad_body", 400);
  const opts = { live: true };
  const tplOf = (path) => env.ASSETS.fetch(new Request(new URL(path, url.origin))).then((r) => (r.ok ? r.text() : null));
  let html = null;
  if (kind === "home") { const t = await tplOf("/"); if (t && Array.isArray(data.sections)) html = composeHome(t, data, opts); }
  else if (kind === "svc" && SVC_KEYS.includes(key)) { const t = await tplOf("/" + key); if (t && Array.isArray(data.sections)) html = composeSvc(t, data, opts); }
  else if (kind === "p" && /^[a-z0-9][a-z0-9-]{0,62}$/.test(String(key || ""))) { const t = await tplOf("/page-template.tpl"); if (t) html = composeP(t, data, key, opts); }
  if (html === null) return text("cannot_render", 422);
  /* les liens relatifs (vidéos, images…) se résolvent depuis la racine du site */
  html = html.replace("<head>", '<head><base href="/"><meta name="robots" content="noindex">');
  return text(html);
}
