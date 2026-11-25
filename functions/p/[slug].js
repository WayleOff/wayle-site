// Pages créées depuis l'espace admin : /p/<adresse> — rendues côté serveur (bon pour Google).
import { verifyAccess } from "../_shared/access.js";
import { composeP } from "../_shared/compose.js";

const notFound = () => new Response("<!doctype html><meta charset=utf-8><title>Page introuvable</title><body style=\"font:16px system-ui;padding:3rem\"><h1>Page introuvable</h1><p><a href=\"/\">Retour à l’accueil</a></p>", { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } });

export async function onRequestGet({ request, env, params }) {
  const slug = String(params.slug || "");
  if (!/^[a-z0-9][a-z0-9-]{0,62}$/.test(slug) || !env.DB) return notFound();
  const url = new URL(request.url);
  const row = await env.DB.prepare("SELECT data FROM docs WHERE coll='s_pages' AND id=?1").bind(slug).first();
  if (!row) return notFound();
  const page = JSON.parse(row.data);
  let preview = false;
  if (!page.published) {
    if (url.searchParams.get("preview") !== "1" || !(await verifyAccess(request, env))) return notFound();
    preview = true;
  }
  const tplRes = await env.ASSETS.fetch(new Request(new URL("/page-template.tpl", url.origin)));
  if (!tplRes.ok) return new Response("template manquant", { status: 500 });
  let html = await tplRes.text();
  html = composeP(html, page, slug, { preview });
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": preview ? "no-store" : "public, max-age=30, stale-while-revalidate=300" } });
}
