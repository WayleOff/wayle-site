// Feuille de style du thème, PUBLIQUE : compilée à partir du thème publié (D1, coll « t_themes », id « published »).
// Sans thème enregistré (ou en cas d'erreur), on sert le thème par défaut : le site ne change pas.
import { cssFromStored } from "../theme/engine/index.js";

export async function onRequestGet({ env }) {
  const H = { "Content-Type": "text/css; charset=utf-8", "Cache-Control": "public, max-age=60, stale-while-revalidate=600", "X-Content-Type-Options": "nosniff" };
  let stored = null;
  try {
    if (env.DB) {
      const r = await env.DB.prepare("SELECT data FROM docs WHERE coll='t_themes' AND id='published'").first();
      if (r) stored = JSON.parse(r.data).theme || null;
    }
  } catch (e) { stored = null; }
  return new Response(cssFromStored(stored), { headers: H });
}
