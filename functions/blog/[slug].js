// /blog/<adresse> : un article. Les brouillons et articles programmés ne sont visibles qu'avec ?preview=1 (admin connecté).
import { verifyAccess } from "../_shared/access.js";
import { composeP } from "../_shared/compose.js";
import { SLUG, isLive, articleBody, articleHead } from "../_shared/blog.js";

const notFound = () => new Response("<!doctype html><meta charset=utf-8><title>Article introuvable</title><body style=\"font:16px system-ui;padding:3rem\"><h1>Article introuvable</h1><p><a href=\"/blog\">Retour au blog</a></p>", { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } });

export async function onRequestGet({ request, env, params }) {
  const slug = String(params.slug || "");
  if (!SLUG.test(slug) || !env.DB) return notFound();
  const url = new URL(request.url);
  const row = await env.DB.prepare("SELECT data FROM docs WHERE coll='s_blog' AND id=?1").bind(slug).first();
  if (!row) return notFound();
  const p = JSON.parse(row.data);
  let preview = false;
  if (!isLive(p)) {
    if (url.searchParams.get("preview") !== "1" || !(await verifyAccess(request, env))) return notFound();
    preview = true;
  }
  const tplRes = await env.ASSETS.fetch(new Request(new URL("/page-template.tpl", url.origin)));
  if (!tplRes.ok) return new Response("template manquant", { status: 500 });
  let html = composeP(await tplRes.text(), { title: p.title, desc: p.desc || "", blocks: [], noindex: preview }, slug, { preview });
  html = html.replace(/<div class="page-hero">[\s\S]*?<\/div>/, () => `<div class="page-hero"><h1 style="max-width:none;font-size:clamp(2rem,5vw,3.6rem)">${p.title.replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c]))}</h1></div>`)
    .replace("</main>", () => articleBody(p) + "</main>")
    .replace("</head>", () => articleHead(p, url.origin, slug) + "</head>");
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": preview ? "no-store" : "public, max-age=60, stale-while-revalidate=300" } });
}
