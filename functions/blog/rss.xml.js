// Flux RSS du blog : /blog/rss.xml
import { loadPosts } from "../_shared/blog.js";
const x = (s) => String(s == null ? "" : s).replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[c]));
export async function onRequestGet({ request, env }) {
  const o = new URL(request.url).origin, posts = (await loadPosts(env)).slice(0, 30);
  const items = posts.map((p) => `<item><title>${x(p.title)}</title><link>${o}/blog/${x(p.slug)}</link><guid>${o}/blog/${x(p.slug)}</guid><pubDate>${new Date(p.date + "T08:00:00Z").toUTCString()}</pubDate><description>${x(p.desc || "")}</description></item>`).join("");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Blog – Wayle Production</title><link>${o}/blog</link><description>Conseils, coulisses et projets de Wayle Production, studio vidéo à Rouen.</description><language>fr-FR</language>${items}</channel></rss>`, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=300" } });
}
