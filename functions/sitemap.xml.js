// Plan du site pour Google : pages principales, pages publiées et articles du blog.
import { loadPosts } from "./_shared/blog.js";
const x = (s) => String(s).replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[c]));
export async function onRequestGet({ request, env }) {
  const o = new URL(request.url).origin;
  const urls = ["/", "/artistes.html", "/entreprises.html", "/commerces.html", "/offre", "/realisations", "/blog", "/mentions-legales.html", "/confidentialite", "/cookies", "/cgu", "/cgv"].map((p) => ({ p }));
  if (env.DB) {
    try {
      const { results } = await env.DB.prepare("SELECT id, data FROM docs WHERE coll='s_pages'").all();
      results.forEach((r) => { const d = JSON.parse(r.data); if (d.published && !d.noindex && r.id !== "blog" && r.id !== "realisations" && !["offre", "confidentialite", "cookies", "cgu", "cgv"].includes(r.id)) urls.push({ p: "/p/" + r.id }); });
    } catch (e) { /* pages principales seulement */ }
  }
  (await loadPosts(env)).forEach((p) => urls.push({ p: "/blog/" + p.slug, d: p.date }));
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((u) => `<url><loc>${x(o + u.p)}</loc>${u.d ? `<lastmod>${u.d}</lastmod>` : ""}</url>`).join("")}</urlset>`, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
