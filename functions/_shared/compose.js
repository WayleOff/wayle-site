// Assemblage d'une page : gabarit HTML (fichier du site) + contenu (sections/blocs).
// Partagé par les pages publiques et par /api/render (aperçu du mode « Modifier en direct »).
import { renderHome, renderCover } from "./home.js";
import { renderSvc } from "./svc.js";
import { esc, renderBlocks } from "./blocks.js";

export const SVC_KEYS = ["artistes", "entreprises", "commerces"];

const between = (html, a, b, rep) => {
  const i = html.indexOf(a), j = html.indexOf(b, i + a.length);
  if (i < 0 || j < 0) return null;
  return html.slice(0, i + a.length) + rep + html.slice(j);
};
const jsonScript = (id, o) => `<script type="application/json" id="${id}">${JSON.stringify(o).replace(/</g, "\\u003c")}</script>`;
function fill(html, parts) {
  for (const [a, b, rep] of parts) { html = between(html, a, b, rep); if (html === null) return null; }
  return html;
}

/* titre et description pour Google (facultatifs : page.seo = { title, desc }) */
function seo(html, page) {
  const s = page && page.seo;
  if (html === null || !s || typeof s !== "object") return html;
  const t = String(s.title || "").trim().slice(0, 90), d = String(s.desc || "").trim().slice(0, 260);
  if (t) html = html.replace(/<title>[^<]*<\/title>/, () => `<title>${esc(t)}</title>`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, (m, a, b) => a + esc(t) + b);
  if (d) html = html.replace(/(<meta name="description" content=")[^"]*(")/, (m, a, b) => a + esc(d) + b)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, (m, a, b) => a + esc(d) + b);
  return html;
}

/* page d'accueil */
export function composeHome(html, home, opts) {
  const r = renderHome(home, opts), c = renderCover(home.cover, opts);
  const data = jsonScript("cover-data", c.data) + (r.pj ? jsonScript("pj-data", r.pj) : "");
  return seo(fill(html, [["<!--HOME-->", "<!--/HOME-->", r.main], ["<!--COVER-PITCH-->", "<!--/COVER-PITCH-->", c.pitch], ["<!--CUE-->", "<!--/CUE-->", c.cue], ["<!--HOME-DATA-->", "<!--/HOME-DATA-->", data]]), home);
}

/* pages Artistes, Entreprises, Commerces */
export function composeSvc(html, page, opts) {
  const r = renderSvc(page, opts);
  const data = r.conf ? jsonScript("conf-data", r.conf) : "";
  return seo(fill(html, [["<!--PAGE-->", "<!--/PAGE-->", r.main], ["<!--PAGE-DATA-->", "<!--/PAGE-DATA-->", data]]), page);
}

/* pages /p/<adresse> (gabarit page-template.tpl) */
export function composeP(tpl, page, slug, opts) {
  const title = String(page.title || slug || "");
  const desc = String(page.desc || "");
  return tpl.replace("<!--TITLE-->", esc(title) + " – Wayle Production")
    .replace("<!--DESC-->", esc(desc))
    .replace("<!--H1-->", esc(title))
    .replace("<!--LEAD-->", desc ? `<p>${esc(desc)}</p>` : "")
    .replace("<!--CONTENT-->", renderBlocks(page.blocks, opts))
    .replace("<!--ROBOTS-->", opts && (opts.preview || opts.live) || page.noindex ? "<meta name=\"robots\" content=\"noindex\">" : "");
}
