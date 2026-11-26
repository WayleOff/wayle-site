// /gestion : redirige vers l'outil de prospection (sous-domaine) dès que l'adresse est renseignée dans
// Admin → Menus → « Outil de gestion ». Sans adresse, l'ancienne page de gestion reste servie telle quelle.
export const GESTION_HOST = /^([a-z0-9-]+\.)*(wayle\.fr|vercel\.app)$/i;

export async function onRequestGet({ env, next }) {
  try {
    if (env.DB) {
      const row = await env.DB.prepare("SELECT data FROM docs WHERE coll='s_config' AND id='main'").first();
      const u = row && JSON.parse(row.data).gestionUrl;
      if (typeof u === "string" && u.length <= 200) {
        const t = new URL(u);
        if (t.protocol === "https:" && GESTION_HOST.test(t.hostname) && !t.username && !t.password)
          return new Response(null, { status: 302, headers: { Location: t.href, "Cache-Control": "no-store" } });
      }
    }
  } catch (e) { /* page de gestion d'origine */ }
  return next();
}
