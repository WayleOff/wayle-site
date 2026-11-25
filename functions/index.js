// Page d'accueil. Tant qu'aucun accueil à blocs n'est publié depuis l'admin, on sert index.html tel quel.
// Une fois publié, les sections sont rendues côté serveur dans le gabarit index.html (bon pour Google).
// /?preview=1 (connecté à l'admin) montre le brouillon.
import { verifyAccess } from "./_shared/access.js";
import { composeHome } from "./_shared/compose.js";

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
    html = composeHome(html, home);
    if (html === null) return fallback(); // gabarit inattendu : on ne prend aucun risque
    if (home.__preview) html = html.replace("<head>", '<head><meta name="robots" content="noindex">');
    return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": home.__preview ? "no-store" : "public, max-age=30, stale-while-revalidate=300" } });
  } catch (e) { return fallback(); }
}
