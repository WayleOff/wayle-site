// Page d'accueil. Tant qu'aucun accueil à blocs n'est publié depuis l'admin, on sert index.html tel quel.
// Une fois publié, les sections sont rendues côté serveur dans le gabarit index.html (bon pour Google).
// /?preview=1 (connecté à l'admin) montre le brouillon.
import { verifyAccess } from "./_shared/access.js";
import { renderHome, renderCover } from "./_shared/home.js";

const between = (html, a, b, rep) => {
  const i = html.indexOf(a), j = html.indexOf(b, i + a.length);
  if (i < 0 || j < 0) return null;
  return html.slice(0, i + a.length) + rep + html.slice(j);
};
const jsonScript = (id, o) => `<script type="application/json" id="${id}">${JSON.stringify(o).replace(/</g, "\\u003c")}</script>`;

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const preview = url.searchParams.get("preview") === "1";
  const fallback = () => env.ASSETS.fetch(request);
  if (!env.DB) return fallback();
  let home = null;
  try {
    const id = preview && (await verifyAccess(request, env)) ? "draft" : "live";
    const row = await env.DB.prepare("SELECT data FROM docs WHERE coll='s_home' AND id=?1").bind(id).first();
    home = row ? JSON.parse(row.data) : null;
    if (home) home.__preview = id === "draft";
  } catch (e) { return fallback(); }
  if (!home || !Array.isArray(home.sections)) return fallback();

  try {
    const tpl = await env.ASSETS.fetch(new Request(new URL("/", url.origin)));
    if (!tpl.ok) return fallback();
    let html = await tpl.text();
    const r = renderHome(home), c = renderCover(home.cover);
    const data = jsonScript("cover-data", c.data) + (r.pj ? jsonScript("pj-data", r.pj) : "");
    for (const [a, b, rep] of [["<!--HOME-->", "<!--/HOME-->", r.main], ["<!--COVER-PITCH-->", "<!--/COVER-PITCH-->", c.pitch], ["<!--CUE-->", "<!--/CUE-->", c.cue], ["<!--HOME-DATA-->", "<!--/HOME-DATA-->", data]]) {
      const next = between(html, a, b, rep);
      if (next === null) return fallback(); // gabarit inattendu : on ne prend aucun risque
      html = next;
    }
    if (home.__preview) html = html.replace("<head>", '<head><meta name="robots" content="noindex">');
    return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": home.__preview ? "no-store" : "public, max-age=30, stale-while-revalidate=300" } });
  } catch (e) { return fallback(); }
}
