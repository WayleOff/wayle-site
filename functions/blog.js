// /blog : liste des articles publiés (admin → Blog). Sans article publié : page « Réalisations »-style d'attente,
// ou la page « blog » créée dans Admin → Pages si elle est publiée.
import { fixedPage, blogFallback } from "./_shared/fixedpage.js";
import { composeP } from "./_shared/compose.js";
import { loadPosts, indexBody } from "./_shared/blog.js";

const waiting = fixedPage("blog", blogFallback);

export async function onRequestGet(ctx) {
  const posts = await loadPosts(ctx.env);
  if (!posts.length) return waiting(ctx);
  const url = new URL(ctx.request.url);
  const tplRes = await ctx.env.ASSETS.fetch(new Request(new URL("/page-template.tpl", url.origin)));
  if (!tplRes.ok) return new Response("template manquant", { status: 500 });
  const html = composeP(await tplRes.text(), { title: "Blog", desc: "Conseils, coulisses et projets de Wayle Production, studio vidéo à Rouen.", blocks: [] }, "blog", {})
    .replace("</main>", () => indexBody(posts) + "</main>")
    .replace("</head>", () => `<link rel="canonical" href="${url.origin}/blog"><link rel="alternate" type="application/rss+xml" title="Blog Wayle Production" href="/blog/rss.xml"></head>`);
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } });
}
