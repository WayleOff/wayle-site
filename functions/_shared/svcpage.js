// Sert une page métier : la page statique tant qu'aucune version n'est publiée depuis l'admin,
// sinon les sections rendues côté serveur dans le gabarit de la page. ?preview=1 (admin) : brouillon.
import { verifyAccess } from "./access.js";
import { composeSvc } from "./compose.js";

export function svcPage(key) {
  return async function onRequestGet({ request, env }) {
    const url = new URL(request.url);
    const preview = url.searchParams.get("preview") === "1";
    const fallback = () => env.ASSETS.fetch(request);
    if (!env.DB) return fallback();
    let page = null, draft = false;
    try {
      draft = preview && (await verifyAccess(request, env));
      const row = await env.DB.prepare("SELECT data FROM docs WHERE coll='s_svc' AND id=?1").bind(key + (draft ? "-draft" : "-live")).first();
      page = row ? JSON.parse(row.data) : null;
    } catch (e) { return fallback(); }
    if (!page || !Array.isArray(page.sections)) return fallback();
    try {
      const tpl = await env.ASSETS.fetch(new Request(new URL("/" + key, url.origin)));
      if (!tpl.ok) return fallback();
      let html = await tpl.text();
      html = composeSvc(html, page);
      if (html === null) return fallback();
      if (draft) html = html.replace("<head>", '<head><meta name="robots" content="noindex">');
      return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": draft ? "no-store" : "public, max-age=30, stale-while-revalidate=300" } });
    } catch (e) { return fallback(); }
  };
}
