// Sert une page métier : la page statique tant qu'aucune version n'est publiée depuis l'admin,
// sinon les sections rendues côté serveur dans le gabarit de la page. ?preview=1 (admin) : brouillon.
import { verifyAccess } from "./access.js";
import { renderSvc } from "./svc.js";

const between = (html, a, b, rep) => {
  const i = html.indexOf(a), j = html.indexOf(b, i + a.length);
  if (i < 0 || j < 0) return null;
  return html.slice(0, i + a.length) + rep + html.slice(j);
};

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
      const r = renderSvc(page);
      const data = r.conf ? `<script type="application/json" id="conf-data">${JSON.stringify(r.conf).replace(/</g, "\\u003c")}</script>` : "";
      for (const [a, b, rep] of [["<!--PAGE-->", "<!--/PAGE-->", r.main], ["<!--PAGE-DATA-->", "<!--/PAGE-DATA-->", data]]) {
        const next = between(html, a, b, rep);
        if (next === null) return fallback();
        html = next;
      }
      if (draft) html = html.replace("<head>", '<head><meta name="robots" content="noindex">');
      return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": draft ? "no-store" : "public, max-age=30, stale-while-revalidate=300" } });
    } catch (e) { return fallback(); }
  };
}
