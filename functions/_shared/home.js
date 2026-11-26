// Page d'accueil à blocs : rendu des sections propres à l'accueil.
import { esc, inline, paras, safeUrl, mediaId, list, renderBlocks, lf, lim, posStyle, widthClass } from "./blocks.js";
const SVG = "<svg class=\"sf-svg\" viewBox=\"0 0 600 440\" role=\"img\" aria-label=\"@@ARIA@@\">\n<defs><linearGradient id=\"sfg\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0\" stop-color=\"var(--orange)\"/><stop offset=\"1\" stop-color=\"var(--violet)\"/></linearGradient></defs>\n<circle class=\"sf-track\" cx=\"300\" cy=\"220\" r=\"140\"/>\n<circle class=\"sf-ring\" cx=\"300\" cy=\"220\" r=\"140\" transform=\"rotate(-90 300 220)\"/>\n<g class=\"sf-orbit\"><circle class=\"sf-dot\" cx=\"300\" cy=\"80\" r=\"6\"/></g>\n<text class=\"sf-360\" x=\"300\" y=\"226\" text-anchor=\"middle\">360</text>\n<text class=\"sf-sub\" x=\"300\" y=\"256\" text-anchor=\"middle\">Votre message</text>\n<g transform=\"translate(201 121)\"><g class=\"node\" data-i=\"0\"><circle class=\"halo\" r=\"46\"/><circle class=\"disc\" r=\"34\"/><g class=\"ico\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle r=\"12\"/><circle r=\"6.5\"/><circle r=\"1.6\" fill=\"currentColor\" stroke=\"none\"/></g></g></g><g transform=\"translate(399 121)\"><g class=\"node\" data-i=\"1\"><circle class=\"halo\" r=\"46\"/><circle class=\"disc\" r=\"34\"/><g class=\"ico\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"-14\" y=\"-9\" width=\"19\" height=\"18\" rx=\"3\"/><path d=\"M5 -3.5 14 -8v16l-9 -4.5z\"/></g></g></g><g transform=\"translate(399 319)\"><g class=\"node\" data-i=\"2\"><circle class=\"halo\" r=\"46\"/><circle class=\"disc\" r=\"34\"/><g class=\"ico\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"-13\" y=\"-11\" width=\"18\" height=\"5\" rx=\"2\"/><rect x=\"-5\" y=\"-2.5\" width=\"18\" height=\"5\" rx=\"2\"/><rect x=\"-13\" y=\"6\" width=\"11\" height=\"5\" rx=\"2\"/></g></g></g><g transform=\"translate(201 319)\"><g class=\"node\" data-i=\"3\"><circle class=\"halo\" r=\"46\"/><circle class=\"disc\" r=\"34\"/><g class=\"ico\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"-14\" y=\"-9\" width=\"28\" height=\"20\" rx=\"4\"/><circle cx=\"0\" cy=\"1\" r=\"5.5\"/><path d=\"M-5 -9 -3 -13h6l2 4\"/></g></g></g>\n<text class=\"sf-l\" x=\"153\" y=\"127\" text-anchor=\"end\">@@L0@@</text>\n<text class=\"sf-l\" x=\"447\" y=\"127\">@@L1@@</text>\n<text class=\"sf-l\" x=\"447\" y=\"325\">@@L2@@</text>\n<text class=\"sf-l\" x=\"153\" y=\"325\" text-anchor=\"end\">@@L3@@</text>\n</svg>";
const FORM = "<form id=\"cf\" novalidate>\n      <div class=\"row\">\n        <div class=\"fld\"><label>Nom<input name=\"nom\" autocomplete=\"name\" required aria-describedby=\"err-nom\"></label><small class=\"ferr\" id=\"err-nom\" hidden></small></div>\n        <div class=\"fld\"><label>E-mail<input name=\"email\" type=\"email\" autocomplete=\"email\" inputmode=\"email\" spellcheck=\"false\" required aria-describedby=\"err-email\"></label><small class=\"ferr\" id=\"err-email\" hidden></small></div>\n      </div>\n      <div class=\"row\">\n        <label>Type de projet<select name=\"type\"><option>Clip ou contenu musical</option><option>Vidéo d’entreprise</option><option>Commerce ou indépendant</option><option>Autre</option></select></label>\n        <div class=\"fld\"><label>Téléphone (facultatif)<input name=\"tel\" type=\"tel\" autocomplete=\"tel\" aria-describedby=\"err-tel\"></label><small class=\"ferr\" id=\"err-tel\" hidden></small></div>\n      </div>\n      <label>Rappel téléphonique (facultatif)<select name=\"rappel\"><option value=\"\">Pas de rappel, répondez-moi par e-mail</option><option>Le matin</option><option>L’après-midi</option><option>En fin de journée</option></select></label>\n      <div class=\"fld\"><label>Votre message<textarea name=\"message\" required aria-describedby=\"err-message\" placeholder=\"Votre activité, ce que vous voulez filmer, la date souhaitée…\"></textarea></label><small class=\"ferr\" id=\"err-message\" hidden></small></div>\n      <input class=\"hp\" name=\"website\" tabindex=\"-1\" autocomplete=\"off\" aria-hidden=\"true\">\n      <button class=\"btn\" type=\"submit\">Envoyer ma demande</button>\n      <p class=\"fine\">Ces informations servent uniquement à répondre à votre demande. Voir les <a href=\"mentions-legales.html\">mentions légales</a>.</p>\n      <p id=\"status\" role=\"status\" aria-live=\"polite\"></p>\n    </form>";

/* Typographie française : espaces insécables (mêmes règles que le script des pages). */
const FR = [[/(\S) ([?!:;»])/g, "$1 $2"], [/« /g, "« "], [/(\d) (?=€)/g, "$1 "], [/(\d) (?=\d{3}\b)/g, "$1 "], [/\bdès (?=\d)/g, "dès "]];
const fr = (s) => FR.reduce((a, r) => a.replace(r[0], r[1]), String(s == null ? "" : s));
const t = (s) => esc(fr(s));              // texte simple
const rich = (s) => inline(fr(s));        // texte avec **gras** et [liens](…)

/* image : envoyée depuis l'admin (media) ou fichier du site (img) */
const FILE = /^\/?[A-Za-z0-9][A-Za-z0-9._-]{0,120}\.(jpe?g|png|webp|gif|avif)$/i;
const VIDEO = /^(\/?[A-Za-z0-9][A-Za-z0-9._-]{0,120}\.(mp4|webm)|https:\/\/[^\s"'<>]+\.(mp4|webm)(\?[^\s"'<>]*)?|\/api\/video\?id=[A-Za-z0-9_-]{6,64})$/i;
export function imgSrc(o) {
  if (o && mediaId(o.media)) return "/api/media?id=" + o.media;
  if (o && FILE.test(String(o.img || ""))) return o.img;
  return "";
}
const vid = (s) => (VIDEO.test(String(s || "")) ? s : "");
const poster = (s) => (FILE.test(String(s || "")) || /^\/api\/media\?id=[A-Za-z0-9_-]{1,64}$/.test(String(s || "")) ? s : "");
const pos = (s) => (/^[0-9.]{1,5}% [0-9.]{1,5}%$/.test(String(s || "")) ? s : "");
const CATS = ["artistes", "entreprises", "commerces"];
const RCATS = { artistes: "Artistes", commerces: "Commerces", marques: "Marques", entreprises: "Entreprises" };
const anchor = (s) => (/^[a-z][a-z0-9-]{0,40}$/.test(String(s || "")) ? s : "");
const open = (b, cls, ctx, st) => { const c = [cls, widthClass(b)].filter(Boolean).join(" "); return `<section${anchor(b.anchor) ? ` id="${b.anchor}"` : ""}${c ? ` class="${c}"` : ""}${st ? ` style="${st.sec}"` : ""}${ctx && ctx.live ? ` data-ls="${ctx.i}"` : ""}><div${st ? ` style="${st.div}"` : ""}>`; };
/* Couleur de fond choisie pour un bandeau (contact) : « #rrggbb » seulement. Le texte et le bouton s'adaptent au contraste. */
const HEX = /^#[0-9a-f]{6}$/i;
const lumin = (h) => { const v = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4))); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
function bandStyle(bg) {
  if (!HEX.test(String(bg || ""))) return null;
  const L = lumin(bg), light = (1.05) / (L + 0.05) >= (L + 0.05) / (lumin("#1D1A17") + 0.05); // texte clair si plus contrasté
  const vars = light
    ? "--ink:#FBF6EE;--mid:rgba(251,246,238,.86);--muted:rgba(251,246,238,.82);--line:rgba(251,246,238,.32);--surface:rgba(255,255,255,.14);--surface-raised:rgba(255,255,255,.18);--bg:rgba(0,0,0,.2);--btn:#FBF6EE;--orange:#FBF6EE;--violet:#FBF6EE;"
    : "--ink:#1D1A17;--mid:#3B3732;--muted:#55504A;--line:rgba(29,26,23,.28);--surface:rgba(255,255,255,.5);--surface-raised:rgba(255,255,255,.7);--bg:rgba(255,255,255,.72);--btn:#1D1A17;--orange:#1D1A17;--violet:#1D1A17;";
  return { sec: `background:${bg};box-shadow:0 0 0 100vmax ${bg};clip-path:inset(0 -100vmax);--btn-ink:${light ? bg : "#FBF6EE"}`, div: `${vars}color:var(--ink)` };
}
const imgPos = (o) => { const s = posStyle(o && o.pos); return s ? ` style="${s}"` : ""; };
const btn = (l, u, ghost) => (l ? `<a class="btn${ghost ? " ghost" : ""}" href="${esc(safeUrl(u))}">${t(l)}</a>` : "");

/* ---------- sections propres à l'accueil ---------- */
function services(b, ctx) {
  const it = list(b.items, 4);
  while (it.length < 4) it.push({ title: "", text: "", label: "", cap: "" });
  let svg = SVG.replace("@@ARIA@@", esc("Schéma circulaire : " + it.map((x) => String(x.label || "").toLowerCase()).filter(Boolean).join(", ") + " autour de votre message"));
  it.forEach((x, n) => { svg = svg.replace(`@@L${n}@@`, t(x.label)); });
  return `${open(b, "", ctx)}
  <h2${lf(ctx, "title")}>${t(b.title)}</h2>
  ${b.lead ? `<p class="lead"${lf(ctx, "lead")}>${rich(b.lead)}</p>` : ""}
  <div class="sf"><figure class="sf-fig">${svg}<figcaption class="sf-cap" aria-hidden="true"></figcaption></figure><dl class="skills">
${it.map((x, n) => `    <div data-cap="${t(x.cap)}"><dt${lf(ctx, `items.${n}.title`)}>${t(x.title)}</dt><dd${lf(ctx, `items.${n}.text`)}>${rich(x.text)}</dd></div>`).join("\n")}
  </dl></div>
</div></section>`;
}

function offerLine(l) {
  const k = l.indexOf(" : ");
  const lab = k > 0 ? l.slice(0, k) : l, val = k > 0 ? l.slice(k + 3).trim() : "";
  const m = /^(dès|à partir de)\s+(.+)$/i.exec(val);
  const span = val ? (m ? `${esc(m[1])} <em>${t(m[2])}</em>` : `<em>${t(val)}</em>`) : "";
  return `        <li><b>${t(lab)}</b><span>${span}</span></li>`;
}
function offers(b, ctx) {
  const items = list(b.items, 6);
  const chips = b.chips ? `
  <div class="chips" role="group" aria-label="Voir les offres et références qui vous concernent">
    <button class="chip" type="button" data-f="all" aria-pressed="true">Tout voir</button>
    <button class="chip" type="button" data-f="artistes" aria-pressed="false">Je suis artiste</button>
    <button class="chip" type="button" data-f="entreprises" aria-pressed="false">Une entreprise</button>
    <button class="chip" type="button" data-f="commerces" aria-pressed="false">Un commerce</button>
  </div>` : "";
  return `${open(b, "", ctx)}
  <h2${lf(ctx, "title")}>${t(b.title)}</h2>
  ${b.lead ? `<p class="lead"${lf(ctx, "lead")}>${rich(b.lead)}</p>` : ""}${chips}
  <div class="offers">
${items.map((x, n) => {
    const src = imgSrc(x), p = pos(x.pos);
    const w = /^\d{2,4}$/.test(String(x.w || "")) ? x.w : "900", h = /^\d{2,4}$/.test(String(x.h || "")) ? x.h : "900";
    const lines = String(x.lines || "").split("\n").map((l) => l.trim()).filter(Boolean);
    return `    <article${CATS.includes(x.cat) ? ` data-a="${x.cat}"` : ""}>
      ${src ? `<div class="o-ph" aria-hidden="true"><img src="${esc(src)}" width="${w}" height="${h}" alt="" loading="lazy" decoding="async"${p ? ` style="object-position:${p}"` : ""}${lim(ctx, `items.${n}`)}></div>` : ""}
      <h3${lf(ctx, `items.${n}.title`)}>${t(x.title)}</h3>
      ${x.text ? `<p${lf(ctx, `items.${n}.text`)}>${rich(x.text)}</p>` : ""}
      ${lines.length ? `<ul>\n${lines.map(offerLine).join("\n")}\n      </ul>` : ""}
          ${x.link ? `<a class="more" href="${esc(safeUrl(x.link))}">${t(x.linkLabel || "En savoir plus")}</a>` : ""}
    </article>`;
  }).join("\n")}
  </div>
  ${b.note ? `<p class="note"${lf(ctx, "note")}>${rich(b.note)}</p>` : ""}
</div></section>`;
}

function band(b, ctx) {
  const cta = btn(b.b1l, b.b1u) + btn(b.b2l, b.b2u, true);
  return `${open(b, "", ctx)}
  <div class="band">
    <div>
      <h2${lf(ctx, "title")}>${t(b.title)}</h2>
      ${b.text ? `<p${lf(ctx, "text")}>${rich(b.text)}</p>` : ""}
      ${b.small ? `<p class="small"${lf(ctx, "small")}>${rich(b.small)}</p>` : ""}
    </div>
    ${cta ? `<div class="band-cta">${cta}</div>` : ""}
  </div>
</div></section>`;
}

/* les projets ouverts en grand sont décrits dans un bloc JSON lu par le script de la page */
function refs(b, ctx) {
  const items = list(b.items, 24);
  const P = {}, order = [];
  const figs = items.map((x, n) => {
    const key = "p" + n, src = imgSrc(x), cat = RCATS[x.cat] ? x.cat : "";
    const a = cat === "marques" ? "entreprises" : CATS.includes(cat) ? cat : "";
    const video = vid(x.v);
    const hasDlg = !!(x.pt || video || x.pd);
    if (hasDlg) {
      P[key] = { t: fr(x.pt || x.title || ""), k: fr(x.pk || ""), d: String(x.pd || "").split(/\n\s*\n/).map((s) => fr(s.trim())).filter(Boolean), v: video, vp: poster(x.vp), sq: x.sq ? 1 : 0 };
      order.push(key);
    }
    const img = src ? `<img width="384" height="501" src="${esc(src)}" alt="${esc(x.alt || "")}" loading="lazy"${imgPos(x)}${lim(ctx, `items.${n}`)}>` : "";
    const pic = hasDlg ? `<button class="ref-open" type="button" data-p="${key}" aria-label="${esc("Voir le projet " + (x.title || ""))}">${img}</button>`
      : x.url ? `<a class="ref-open" href="${esc(safeUrl(x.url))}">${img}</a>` : img;
    return `    <figure${a ? ` data-a="${a}"` : ""}${cat ? ` data-c="${cat}"` : ""}>${pic}<h3${lf(ctx, `items.${n}.title`)}>${t(x.title)}</h3>${x.text ? `<p${lf(ctx, `items.${n}.text`)}>${rich(x.text)}</p>` : ""}</figure>`;
  });
  ctx.pj = { P, order };
  const moreL = b.moreOff ? "" : String(b.moreL || "Voir toutes les réalisations").trim().slice(0, 60);
  const more = moreL ? `\n  <p class="ref-more"><a class="rdv" href="${esc(safeUrl(b.moreU || "/realisations"))}"${lf(ctx, "moreL")}>${t(moreL)}</a></p>` : "";
  const quote = b.quote ? `\n  <figure class="quote"><blockquote style="margin:0"><p${lf(ctx, "quote")}>${rich(b.quote)}</p></blockquote>${b.author ? `<figcaption${lf(ctx, "author")}>${t(b.author)}</figcaption>` : ""}</figure>` : "";
  return `${open(b, "", ctx)}
  <h2${lf(ctx, "title")}>${t(b.title)}</h2>
  ${b.lead ? `<p class="lead"${lf(ctx, "lead")}>${rich(b.lead)}</p>` : ""}
  <div class="ref-bar">
    <div class="rchips" role="group" aria-label="Trier les références par type de client">
      <button class="rchip" type="button" data-c="all" aria-pressed="true">Tous</button>
${Object.keys(RCATS).map((c) => `      <button class="rchip" type="button" data-c="${c}" aria-pressed="false">${RCATS[c]}</button>`).join("\n")}
    </div>
    <div class="ref-nav"><button type="button" id="rf-p" aria-label="Références précédentes">‹</button><button type="button" id="rf-n" aria-label="Références suivantes">›</button></div>
  </div>
  <div class="refs" id="refs" role="region" aria-label="Projets récents" tabindex="0">
${figs.join("\n")}
  </div>
${more}
  <p class="ref-empty" id="ref-empty" hidden>De nouveaux projets arrivent bientôt dans cette catégorie.</p>${quote}
</div></section>`;
}

function steps(b, ctx) {
  const items = list(b.items, 10);
  return `${open(b, "", ctx)}
  <h2${lf(ctx, "title")}>${t(b.title)}</h2>
  ${b.lead ? `<p class="lead"${lf(ctx, "lead")}>${rich(b.lead)}</p>` : ""}
  <ol class="steps">
${items.map((x, n) => `    <li><details${ctx.live ? " open" : ""}><summary><span class="n" aria-hidden="true">${String(n + 1).padStart(2, "0")}</span><strong${lf(ctx, `items.${n}.title`)}>${t(x.title)}</strong></summary><p${lf(ctx, `items.${n}.text`)}>${rich(x.text)}</p></details></li>`).join("\n")}
  </ol>
</div></section>`;
}

function about(b, ctx) {
  const src = imgSrc(b);
  const ps = String(b.text || "").split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
  const vals = list(b.items, 6);
  return `${open(b, "", ctx)}
  <div class="about">
    <div>
      <h2 style="margin-bottom:1.2rem"${lf(ctx, "title")}>${t(b.title)}</h2>
${ps.map((p) => `      <p>${rich(p)}</p>`).join("\n")}
    </div>
    ${src ? `<img width="1000" height="415" src="${esc(src)}" alt="${esc(b.alt || "")}" loading="lazy"${imgPos(b)}${lim(ctx, "")}>` : ""}
  </div>
  ${vals.length ? `<div class="values">
${vals.map((x, n) => `    <div><h3${lf(ctx, `items.${n}.title`)}>${t(x.title)}</h3><p${lf(ctx, `items.${n}.text`)}>${rich(x.text)}</p></div>`).join("\n")}
  </div>` : ""}
</div></section>`;
}

function faq(b, ctx) {
  const items = list(b.items, 40);
  return `${open(b, "", ctx)}
  <h2${lf(ctx, "title")}>${t(b.title)}</h2>
  <div class="faq">
${items.map((x, n) => `    <details${ctx.live ? " open" : ""}><summary${lf(ctx, `items.${n}.q`)}>${t(x.q)}</summary><p${lf(ctx, `items.${n}.a`)}>${rich(x.a)}</p></details>`).join("\n")}
  </div>
</div></section>`;
}

function contact(b, ctx) {
  const links = String(b.links || "").split("\n").map((l) => l.split("|").map((s) => s.trim())).filter((x) => x[0] && x[1]);
  const mail = /^[^\s@<>"]+@[^\s@<>"]+\.[a-z]{2,}$/i.test(String(b.email || "")) ? b.email : "";
  return `${open(b, "contact", ctx, bandStyle(b.bg))}
  <div class="contact-grid">
    <div>
      <h2${lf(ctx, "title")}>${t(b.title)}</h2>
      ${b.lead ? `<p class="lead"${lf(ctx, "lead")}>${rich(b.lead)}</p>` : ""}
      ${mail ? `<a class="mail" href="mailto:${esc(mail)}" style="font-size:1.25rem;border-bottom-width:3px">${esc(mail)}</a>` : ""}
      ${b.rdvl ? `<p><a class="rdv" href="${esc(safeUrl(b.rdvu))}" target="_blank" rel="noopener">${t(b.rdvl)}</a></p>` : ""}
      ${links.length ? `<ul>
${links.map((x) => { const u = safeUrl(x[1]); return `        <li><a href="${esc(u)}"${/^https?:/i.test(u) ? ' rel="noopener"' : ""}>${t(x[0])}</a></li>`; }).join("\n")}
      </ul>` : ""}
    </div>
    ${FORM}
  </div>
</div></section>`;
}

const HOME = { h_services: services, h_offers: offers, h_band: band, h_refs: refs, h_steps: steps, h_about: about, h_faq: faq, h_contact: contact };
export const HOME_TYPES = Object.keys(HOME);

/* Le contenu de <main> : grand titre, puis les sections dans l'ordre (les blocs génériques
   consécutifs sont regroupés dans une section, comme sur les pages /p/). */
export function renderHome(h, opts) {
  const live = !!(opts && opts.live), ctx = { live, i: "hero" };
  const hero = h.hero || {};
  let out = `\n<div class="hero"${live ? ' data-ls="hero"' : ""}>
  <h1${lf(ctx, "title")}>${t(hero.title)}</h1>
  ${hero.text ? `<p${lf(ctx, "text")}>${rich(hero.text)}</p>` : ""}
  ${btn(hero.b1l, hero.b1u)}${btn(hero.b2l, hero.b2u, true)}
</div>\n`;
  let pending = [];
  const flush = () => { if (pending.length) { out += "\n" + renderBlocks(pending, { live }) + "\n"; pending = []; } };
  (Array.isArray(h.sections) ? h.sections : []).slice(0, 80).forEach((b, i) => {
    if (!b || typeof b !== "object" || b.hidden) return;
    if (HOME[b.t]) { flush(); ctx.i = i; out += "\n" + HOME[b.t](b, ctx) + "\n"; }
    else if (b.t === "section") { flush(); }
    else pending.push(Object.assign({}, b, { __i: i }));
  });
  flush();
  return { main: out, pj: ctx.pj || null };
}

export function renderCover(c, opts) {
  c = c || {};
  const ctx = { live: !!(opts && opts.live), i: "cover" };
  const v = (a) => list(a, 8).map((x) => ({ s: vid(x.s), p: poster(x.p), t: fr(x.t || "") })).filter((x) => x.s);
  return { size: c.size === "compact" || c.size === "full" ? c.size : "", pitch: `<div class="cover-pitch"><p class="cp1"${lf(ctx, "pitch1")}>${t(c.pitch1)}</p><p class="cp2"${lf(ctx, "pitch2")}>${t(c.pitch2)}</p></div>`, cue: t(c.cue || "Découvrir"), data: { wide: v(c.wide), tall: v(c.tall) } };
}
