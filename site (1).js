// Lecture PUBLIQUE des réglages du site (couleurs, favicon, menu, textes modifiés, liste des pages publiées).
// Aucune donnée privée ici : les écritures passent par /api/admin (protégé par Access).
export async function onRequestGet({ env }) {
  const H = { "Content-Type": "application/json", "Cache-Control": "public, max-age=30, stale-while-revalidate=300" };
  const empty = { config: {}, content: {}, pages: [], identity: null };
  if (!env.DB) return new Response(JSON.stringify(empty), { headers: H });
  try {
    const one = async (coll, id) => { const r = await env.DB.prepare("SELECT data FROM docs WHERE coll=?1 AND id=?2").bind(coll, id).first(); return r ? JSON.parse(r.data) : {}; };
    const config = await one("s_config", "main");
    const th = (await one("t_themes", "published")).theme || {};
    const idn = th.identity || {};
    const identity = { siteName: idn.siteName || "", logoLight: idn.logoLight || "", logoDark: idn.logoDark || "", ogImage: idn.ogImage || "" };
    const content = (await one("s_content", "main")).items || {};
    const { results } = await env.DB.prepare("SELECT id, data FROM docs WHERE coll='s_pages'").all();
    const pages = results.map((r) => ({ slug: r.id, ...JSON.parse(r.data) }))
      .filter((p) => p.published)
      .map((p) => ({ slug: p.slug, title: p.title, nav: !!p.nav, navLabel: p.navLabel || p.title, order: +p.order || 0 }))
      .sort((a, b) => a.order - b.order);
    return new Response(JSON.stringify({ config, content, pages, identity }), { headers: H });
  } catch (e) { return new Response(JSON.stringify(empty), { headers: H }); }
}
