// Pages à adresse fixe (/realisations, /blog) : si une page du même nom est publiée depuis l'admin
// (Pages → slug « realisations » ou « blog »), elle est affichée ; sinon une page par défaut est servie.
import { verifyAccess } from "./access.js";
import { composeP } from "./compose.js";
import { esc } from "./blocks.js";

const HTML = { "Content-Type": "text/html; charset=utf-8" };

export function fixedPage(slug, fallback) {
  return async function onRequestGet({ request, env }) {
    const url = new URL(request.url);
    const tplRes = await env.ASSETS.fetch(new Request(new URL("/page-template.tpl", url.origin)));
    if (!tplRes.ok) return new Response("template manquant", { status: 500 });
    const tpl = await tplRes.text();
    let page = null, preview = false;
    if (env.DB) {
      try {
        const row = await env.DB.prepare("SELECT data FROM docs WHERE coll='s_pages' AND id=?1").bind(slug).first();
        if (row) {
          const p = JSON.parse(row.data);
          if (p.published) page = p;
          else if (url.searchParams.get("preview") === "1" && (await verifyAccess(request, env))) { page = p; preview = true; }
        }
      } catch (e) { /* page par défaut */ }
    }
    if (page) {
      return new Response(composeP(tpl, page, slug, { preview }), { headers: { ...HTML, "Cache-Control": preview ? "no-store" : "public, max-age=30, stale-while-revalidate=300" } });
    }
    const f = fallback();
    const html = composeP(tpl, { title: f.title, desc: f.desc, blocks: [], noindex: !!f.noindex }, slug, {})
      .replace("</main>", () => f.body + "</main>");
    return new Response(html, { headers: { ...HTML, "Cache-Control": "public, max-age=300, stale-while-revalidate=600" } });
  };
}

export const STYLE = `<style>
.rl{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr));gap:1.4rem;margin:2rem 0 3rem;padding:0;list-style:none}
.rl article{border:1px solid var(--line);border-radius:var(--radius-card,20px);background:var(--surface);overflow:hidden;display:flex;flex-direction:column}
.rl video{display:block;width:100%;aspect-ratio:4/5;object-fit:cover;background:#000}
.rl .rl-t{padding:1rem 1.2rem 1.3rem}.rl h2{font-size:1.2rem}.rl .rl-k{margin:.3rem 0 0;color:var(--muted);font-size:.9rem}.rl .rl-d{margin:.6rem 0 0;color:var(--mid);font-size:.95rem}
.rl-cta{display:flex;flex-wrap:wrap;gap:.8rem;margin:0 0 4rem}
</style>`;

const PROJECTS = [
  ["Kurtys - Chérie", "Artiste · Clip", "Prodige de l’afro-francophone.", "video-kurtys"],
  ["Slavery Parfums", "Marque de parfums", "Vidéo produit réalisée pour la marque.", "video-slavery"],
  ["Twins Moreno", "Créateurs de contenu", "Vidéo réalisée en collaboration avec Stane Christine pour les Twins Moreno, deux frères jumeaux populaires sur les réseaux sociaux.", "video-twins"],
  ["Sériderm", "Clinique de dermatologie esthétique, Rouen", "Vidéo réalisée dans le cadre du Baby Face Day, pour promouvoir le soin Baby Face.", "video-seriderm"],
  ["KAANE - Godbless", "Artiste · Street clip", "", "video-kaane"],
  ["NARKS - A Merveille", "Artiste · Clip YouTube", "", "video-narks-merveille"],
  ["ATOM - C’était toi", "Artiste · Teaser", "", "video-atom"],
  ["RJT - Kipiadi", "Commerce · Vidéo verticale", "", "video-vitrine"],
];

export function realisationsFallback() {
  const cards = PROJECTS.map(([t, k, d, f]) => `<li><article><video controls preload="none" playsinline poster="/${f}-poster.jpg" aria-label="${esc("Vidéo : " + t)}"><source src="/${f}.mp4" type="video/mp4"></video><div class="rl-t"><h2>${esc(t)}</h2><p class="rl-k">${esc(k)}</p>${d ? `<p class="rl-d">${esc(d)}</p>` : ""}</div></article></li>`).join("");
  return {
    title: "Réalisations", desc: "Clips, vidéos de marque et contenus réalisés par Wayle Production, studio vidéo à Rouen.",
    body: `${STYLE}<div><ul class="rl">${cards}</ul><div class="rl-cta"><a class="rdv" href="/#contact">Parler de votre projet</a><a class="rdv" href="/#references">Retour aux références</a></div></div>`,
  };
}

export function blogFallback() {
  return {
    title: "Blog", desc: "Le blog de Wayle Production : conseils et coulisses de la vidéo.", noindex: true,
    body: `${STYLE}<div><p style="max-width:40rem;color:var(--mid)">Les premiers articles arrivent bientôt. En attendant, découvrez nos projets ou écrivez-nous pour parler du vôtre.</p><div class="rl-cta" style="margin-top:1.5rem"><a class="rdv" href="/realisations">Voir les réalisations</a><a class="rdv" href="/#contact">Nous contacter</a></div></div>`,
  };
}
