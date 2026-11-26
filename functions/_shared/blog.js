// Blog : articles stockés dans D1 (collection s_blog, un document par article, identifiant = adresse).
// Article : { title, desc, date:"AAAA-MM-JJ", published, cover:<id image>, coverAlt, tag, body, updated }
import { esc, paras, inline, embed, mediaId } from "./blocks.js";

export const SLUG = /^[a-z0-9][a-z0-9-]{0,62}$/;
export const todayParis = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Paris" }).format(new Date());
export const isLive = (p) => !!p && !!p.published && /^\d{4}-\d{2}-\d{2}$/.test(String(p.date || "")) && p.date <= todayParis();

export async function loadPosts(env) {
  if (!env.DB) return [];
  try {
    const { results } = await env.DB.prepare("SELECT id, data FROM docs WHERE coll='s_blog'").all();
    return results.map((r) => ({ slug: r.id, ...JSON.parse(r.data) })).filter(isLive).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  } catch (e) { return []; }
}

export const frDate = (d) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(d || ""));
  if (!m) return "";
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])));
};

export const readMinutes = (body) => Math.max(1, Math.round(String(body || "").split(/\s+/).filter(Boolean).length / 200));

/* Corps : paragraphes séparés par une ligne vide ; « ## Titre », « ### Sous-titre », « - liste », **gras**, [texte](lien),
   « ![description](identifiant-image) » et une adresse YouTube/Vimeo seule sur sa ligne pour une vidéo. */
export function renderPost(body) {
  const special = (l) => /^#{2,3}\s+.{1,200}$/.test(l) || /^!\[[^\]]{0,200}\]\([A-Za-z0-9_-]{1,64}\)$/.test(l) || (!/\s/.test(l) && !!embed(l));
  const chunks = []; let cur = [];
  const flush = () => { if (cur.length) chunks.push(cur.join("\n")); cur = []; };
  for (const raw of String(body || "").slice(0, 120000).split("\n")) {
    const l = raw.trim();
    if (!l) flush();
    else if (special(l)) { flush(); chunks.push(l); } // titres, images et vidéos sont toujours seuls, même sans ligne vide autour
    else cur.push(raw);
  }
  flush();
  return chunks.map((c) => {
    let m = /^(#{2,3})\s+(.{1,200})$/.exec(c);
    if (m) return `<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`;
    m = /^!\[([^\]]{0,200})\]\(([A-Za-z0-9_-]{1,64})\)$/.exec(c);
    if (m && mediaId(m[2])) return `<figure class="bp-img"><img src="/api/media?id=${esc(m[2])}" alt="${esc(m[1])}" loading="lazy">${m[1] ? `<figcaption>${esc(m[1])}</figcaption>` : ""}</figure>`;
    const v = !/\s/.test(c) ? embed(c) : "";
    if (v) return v;
    return paras(c);
  }).join("\n");
}

export const STYLE = `<style>
.bp{max-width:46rem}.bp p,.bp li{color:var(--mid);font-size:1.1rem;line-height:1.7}.bp p{margin:0 0 1.2rem}
.bp h2{font-size:clamp(1.6rem,3.6vw,2.2rem);font-weight:800;margin:2.4rem 0 .9rem}.bp h3{font-size:1.3rem;font-weight:700;margin:1.8rem 0 .6rem}
.bp a{text-decoration:underline;text-underline-offset:3px}.bp ul{margin:0 0 1.2rem;padding-left:1.2rem}
.bp-img{margin:1.8rem 0}.bp-img img{display:block;width:100%;height:auto;border-radius:var(--radius-md,14px)}.bp-img figcaption{font-size:.9rem;color:var(--muted);margin-top:.5rem}
.bp .blk-vid{margin:1.8rem 0}
.bp-meta{color:var(--muted);font-size:.95rem;margin:0 0 1rem}
.bp-cover{display:block;width:100%;max-width:58rem;height:auto;aspect-ratio:16/9;object-fit:cover;border-radius:var(--radius-md,14px);margin:0 0 2.2rem}
.bp-end{margin:3rem 0 4rem;display:flex;flex-wrap:wrap;gap:.8rem}
.bl{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,320px),1fr));gap:1.6rem;margin:1rem 0 4rem;padding:0;list-style:none}
.bl a{display:flex;flex-direction:column;height:100%;text-decoration:none;border:1px solid var(--line);border-radius:var(--radius-card,20px);background:var(--surface);overflow:hidden;transition:transform .2s}
.bl a:hover{transform:translateY(-2px)}.bl img{display:block;width:100%;aspect-ratio:16/9;object-fit:cover}
.bl .bl-t{padding:1rem 1.2rem 1.3rem}.bl h2{font-size:1.25rem}.bl .bl-m{margin:.3rem 0 0;color:var(--muted);font-size:.88rem}.bl .bl-d{margin:.6rem 0 0;color:var(--mid);font-size:.95rem}
@media (prefers-reduced-motion:reduce){.bl a{transition:none}.bl a:hover{transform:none}}
</style>`;

export function indexBody(posts) {
  return `${STYLE}<div><ul class="bl">${posts.map((p) => `<li><a href="/blog/${esc(p.slug)}">${mediaId(p.cover) ? `<img src="/api/media?id=${esc(p.cover)}" alt="${esc(p.coverAlt || "")}" loading="lazy">` : ""}<div class="bl-t"><h2>${esc(p.title)}</h2><p class="bl-m">${esc(frDate(p.date))}${p.tag ? " · " + esc(p.tag) : ""} · ${readMinutes(p.body)} min</p>${p.desc ? `<p class="bl-d">${esc(p.desc)}</p>` : ""}</div></a></li>`).join("")}</ul></div>`;
}

export function articleBody(p) {
  return `${STYLE}<div><article class="bp"><p class="bp-meta">${esc(frDate(p.date))}${p.tag ? " · " + esc(p.tag) : ""} · ${readMinutes(p.body)} min de lecture</p>${mediaId(p.cover) ? `<img class="bp-cover" src="/api/media?id=${esc(p.cover)}" alt="${esc(p.coverAlt || "")}">` : ""}${renderPost(p.body)}<div class="bp-end"><a class="rdv" href="/blog">Tous les articles</a><a class="rdv" href="/#contact">Parler de votre projet</a></div></article></div>`;
}

export function articleHead(p, origin, slug) {
  const url = `${origin}/blog/${slug}`;
  const img = mediaId(p.cover) ? `${origin}/api/media?id=${p.cover}` : "";
  const ld = { "@context": "https://schema.org", "@type": "BlogPosting", headline: p.title, description: p.desc || undefined, datePublished: p.date, dateModified: p.date, mainEntityOfPage: url, image: img || undefined, author: { "@type": "Organization", name: "Wayle Production" }, publisher: { "@type": "Organization", name: "Wayle Production" } };
  return `<link rel="canonical" href="${esc(url)}"><meta property="og:type" content="article"><meta property="og:title" content="${esc(p.title)}"><meta property="og:description" content="${esc(p.desc || "")}"><meta property="og:url" content="${esc(url)}">${img ? `<meta property="og:image" content="${esc(img)}"><meta name="twitter:image" content="${esc(img)}">` : ""}<meta name="twitter:card" content="${img ? "summary_large_image" : "summary"}"><script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>`;
}
