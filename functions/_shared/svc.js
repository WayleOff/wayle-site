// Pages métiers (Artistes, Entreprises, Commerces) : rendu des sections avec le HTML d'origine.
import { esc, inline, safeUrl, mediaId, list, idx, renderBlocks, lf, lim, posStyle, widthClass } from "./blocks.js";
import { imgSrc } from "./home.js";

const FR = [[/(\S) ([?!:;»])/g, "$1\u00a0$2"], [/« /g, "«\u00a0"], [/(\d) (?=€)/g, "$1\u00a0"], [/(\d) (?=\d{3}\b)/g, "$1\u00a0"], [/\bdès (?=\d)/g, "dès\u00a0"]];
const fr = (s) => FR.reduce((a, r) => a.replace(r[0], r[1]), String(s == null ? "" : s));
const t = (s) => esc(fr(s));
const rich = (s) => inline(fr(s));
const FILE = /^\/?[A-Za-z0-9][A-Za-z0-9._-]{0,120}\.(jpe?g|png|webp|gif|avif)$/i;
const VIDEO = /^(\/?[A-Za-z0-9][A-Za-z0-9._-]{0,120}\.(mp4|webm)|https:\/\/[^\s"'<>]+\.(mp4|webm)(\?[^\s"'<>]*)?|\/api\/video\?id=[A-Za-z0-9_-]{6,64})$/i;
const vid = (s) => (VIDEO.test(String(s || "")) ? s : "");
const poster = (s) => (FILE.test(String(s || "")) || /^\/api\/media\?id=[A-Za-z0-9_-]{1,64}$/.test(String(s || "")) ? s : "");
const pos = (s) => (/^[0-9.]{1,5}% [0-9.]{1,5}%$/.test(String(s || "")) ? s : "");
const dim = (v, d) => (/^\d{2,4}$/.test(String(v || "")) ? v : d);
const slug = (s) => (/^[a-z][a-z0-9-]{0,40}$/.test(String(s || "")) ? s : "");
const btn = (l, u, ghost) => (l ? `<a class="btn${ghost ? " ghost" : ""}" href="${esc(safeUrl(u))}">${t(l)}</a>` : "");
const PLAY16 = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
const PLAY14 = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4v16l13-8z"/></svg>';
const ARR = (d) => `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;

function price(x, ctx, base) {
  if (!x.price && !x.from) return "";
  return `<div class="price">${x.from ? `<small${lf(ctx, base + ".from")}>${t(x.from)}</small> ` : ""}${ctx.live ? `<span${lf(ctx, base + ".price")}>${t(x.price)}</span>` : t(x.price)}${x.unit ? ` <small${lf(ctx, base + ".unit")}>${t(x.unit)}</small>` : ""}</div>`;
}
function lines(s) {
  const L = String(s || "").split("\n").map((l) => l.trim()).filter(Boolean);
  if (!L.length) return "";
  return "<ul>" + L.map((l) => { const k = l.indexOf(" : "); return k > 0 ? `<li><b>${t(l.slice(0, k))}</b><span>${t(l.slice(k + 3))}</span></li>` : `<li><b>${t(l)}</b><span></span></li>`; }).join("") + "</ul>";
}
function photos(x, n, ctx, base) {
  const P = idx(x.photos, 12).map((p) => ({ src: imgSrc(p), alt: p.alt || "", w: dim(p.w, "1000"), h: dim(p.h, "1000"), ps: posStyle(p.pos), k: p.__n })).filter((p) => p.src);
  if (!P.length) return "";
  const id = n === 0 ? "vph" : "vph" + n;
  return `<figure class="vit-ph" id="${id}" aria-roledescription="carrousel" aria-label="Exemples de photos réalisées par Wayle Production" tabindex="0">`
    + P.map((p, i) => `<img width="${p.w}" height="${p.h}" src="${esc(p.src)}" alt="${esc(p.alt)}" loading="lazy"${i === 0 ? ' class="on"' : ""}${p.ps ? ` style="${p.ps}"` : ""}${lim(ctx, `${base}.photos.${p.k}`)}>`).join("")
    + `<button type="button" class="vph-a prev" aria-label="Photo précédente">${ARR("M15 5l-7 7 7 7")}</button><button type="button" class="vph-a next" aria-label="Photo suivante">${ARR("M9 5l7 7-7 7")}</button>`
    + `<figcaption${lf(ctx, `${base}.photosCap`)}>${t(x.photosCap || "Exemples de photos")}</figcaption><div class="vph-d">`
    + P.map((p, i) => `<button type="button" aria-label="Photo ${i + 1} sur ${P.length}"${i === 0 ? ' aria-current="true"' : ""}></button>`).join("") + `</div></figure>`;
}
function article(x, ctx, n) {
  const B = "items." + n;
  if (x.kind === "custom") {
    return `<article class="custom"><div><h3${lf(ctx, B + ".title")}>${t(x.title)}</h3>${x.text ? `<p${lf(ctx, B + ".text")}>${rich(x.text)}</p>` : ""}</div><div class="custom-cta">${x.price ? `<div class="price">${t(x.price)}</div>` : ""}${btn(x.b1l, x.b1u)}${btn(x.b2l, x.b2u, true)}</div></article>`;
  }
  const v = vid(x.v), src = imgSrc(x), p = pos(x.pos), ph = photos(x, ctx.vph, ctx, B);
  if (ph) ctx.vph++;
  const id = slug(x.id);
  const attrs = (v ? ' class="has-video"' : "") + (id ? ` id="${id}"` : "") + (v ? ` data-src="${esc(v)}" data-poster="${esc(poster(x.vp))}" data-title="${t(x.vt)}" data-sub="${t(x.vs)}"` : "");
  const play = v ? (ph ? `<button class="play-ex" type="button">${PLAY14}<span>${t(x.play || "Voir un exemple")}</span></button>` : `<button type="button" class="play-ex">${PLAY16}${t(x.play || "Voir un exemple")}</button>`) : "";
  return `<article${attrs}>${src ? `<div class="o-ph" aria-hidden="true"><img src="${esc(src)}" width="${dim(x.w, "900")}" height="${dim(x.h, "900")}" alt="" loading="lazy" decoding="async"${p ? ` style="object-position:${p}"` : ""}${lim(ctx, B)}></div>` : ""}<h3${lf(ctx, B + ".title")}>${t(x.title)}</h3>${x.text ? `<p${lf(ctx, B + ".text")}>${rich(x.text)}</p>` : ""}${price(x, ctx, B)}${lines(x.lines)}${x.after ? `<p style="margin-top:1rem"${lf(ctx, B + ".after")}>${rich(x.after)}</p>` : ""}${ph}${play}</article>`;
}
function offers(b, ctx) {
  const perks = String(b.perks || "").split("\n").map((l) => l.trim()).filter(Boolean);
  return `
  <h2${b.sub ? ' class="sub-h"' : ""}${lf(ctx, "title")}>${t(b.title)}</h2>
  ${b.lead ? `<p class="lead"${lf(ctx, "lead")}>${rich(b.lead)}</p>` : ""}
  <div class="offers${b.layout === "duo" ? " duo" : ""}">${(Array.isArray(b.items) ? b.items : []).slice(0, 8).map((x, n) => (x && typeof x === "object" ? article(x, ctx, n) : "")).join("")}</div>
  ${perks.length ? `<ul class="perks">${perks.map((l) => `<li>${rich(l).replace(/<(\/?)strong>/g, "<$1b>")}</li>`).join("")}</ul>` : ""}
  ${b.note ? `<p class="note"${lf(ctx, "note")}>${rich(b.note)}</p>` : ""}
`;
}
/* configurateur : les données (formules, ajustements, options) sont lues par le script de la page */
const num = (v, d) => { const n = Math.round(Number(v)); return Number.isFinite(n) && n >= 0 && n < 100000 ? n : d; };
function config(b, ctx) {
  const ids = {};
  const uid = (v, pre, i) => { let s = /^[\w-]{1,20}$/.test(String(v || "")) ? String(v) : pre + i; while (ids[s]) s += "x"; ids[s] = 1; return s; };
  ctx.conf = {
    bases: list(b.bases, 8).filter((x) => x.n).map((x, i) => ({ id: uid(x.id, "b", i), n: fr(x.n), p: num(x.p, 0), d: fr(x.d || ""), voice: !!x.voice })),
    steps: list(b.steps, 10).filter((x) => x.l).map((x, i) => ({ k: uid(x.k, "s", i), l: fr(x.l), u: fr(x.u || "unité"), pu: num(x.pu, 0), max: Math.max(1, Math.min(50, num(x.max, 5))), sub: fr(x.sub || "") })),
    opts: list(b.opts, 10).filter((x) => x.l).map((x, i) => ({ k: uid(x.k, "o", i), l: fr(x.l), pu: num(x.pu, 0), sub: fr(x.sub || "") })),
  };
  return `
  <h2${lf(ctx, "title")}>${t(b.title)}</h2>
  ${b.lead ? `<p class="lead"${lf(ctx, "lead")}>${rich(b.lead)}</p>` : ""}
  ${CONF}
`;
}
const CONF = `<div class="conf">
    <div class="conf-form">
      <fieldset><legend>1. Votre formule de départ</legend>
        <div class="pick" id="cf-base"></div>
      </fieldset>
      <fieldset><legend>2. Vos ajustements</legend>
        <div id="cf-steps"></div>
      </fieldset>
      <fieldset><legend>3. Vos options</legend>
        <div id="cf-opts"></div>
      </fieldset>
    </div>
    <aside class="conf-sum" aria-live="polite">
      <h3>Votre estimation</h3>
      <ul id="cf-list"></ul>
      <div class="conf-total"><small>Total estimé</small><strong id="cf-total">—</strong><small>TTC, déplacement à Rouen et alentours compris</small></div>
      <a class="btn" id="cf-send" href="./#contact">Envoyer cette demande</a>
      <p class="fine">Aucun engagement. Votre sélection est reprise dans le formulaire de contact.</p>
    </aside>
  </div>`;
function steps(b, ctx) {
  return `
  <h2${lf(ctx, "title")}>${t(b.title)}</h2>
  <ol class="steps acc">
${list(b.items, 10).map((x, n) => `    <li><details${ctx.live ? " open" : ""}><summary><span class="n" aria-hidden="true">${String(n + 1).padStart(2, "0")}</span><strong${lf(ctx, `items.${n}.title`)}>${t(x.title)}</strong></summary><p${lf(ctx, `items.${n}.text`)}>${rich(x.text)}</p></details></li>`).join("\n")}
  </ol>
`;
}
function ref(b, ctx) {
  const src = imgSrc(b), link = esc(safeUrl(b.link || b.btnu));
  return `
    <div class="ref-grid">
      <div class="ref-txt"><h2${lf(ctx, "title")}>${t(b.title)}</h2>
  ${b.lead ? `<p class="lead"${lf(ctx, "lead")}>${rich(b.lead)}</p>` : ""}
  ${btn(b.btnl, b.btnu)}</div>
      ${src ? `<a class="ref-ph" href="${link}" tabindex="-1" aria-hidden="true"><img src="${esc(src)}" width="720" height="1280" alt="" loading="lazy" decoding="async"${posStyle(b.pos) ? ` style="${posStyle(b.pos)}"` : ""}${lim(ctx, "")}></a>` : ""}
    </div>
  `;
}
function cta(b, ctx) {
  return `
  <div class="band cta-band">
    <h2 style="max-width:22rem"${lf(ctx, "title")}>${t(b.title)}</h2>
    <div class="actions2">${btn(b.b1l, b.b1u)}${btn(b.b2l, b.b2u, true)}</div>
  </div>
`;
}
const SVC = { v_offers: offers, v_config: config, v_steps: steps, v_ref: ref, v_cta: cta };
export const SVC_TYPES = Object.keys(SVC);

export function renderSvc(h, opts) {
  const live = !!(opts && opts.live), ctx = { vph: 0, live, i: "hero" };
  const hero = h.hero || {};
  let out = `
<div class="page-hero"${live ? ' data-ls="hero"' : ""}>
  <h1${lf(ctx, "title")}>${t(hero.title)}</h1>
  ${hero.text ? `<p${lf(ctx, "text")}>${rich(hero.text)}</p>` : ""}
  ${btn(hero.b1l, hero.b1u)}${btn(hero.b2l, hero.b2u, true)}
</div>
`;
  let open = false, pending = [];
  const close = () => { if (open) { out += "</div></section>\n"; open = false; } };
  const flush = () => { if (pending.length) { close(); out += "\n" + renderBlocks(pending, { live }) + "\n"; pending = []; } };
  (Array.isArray(h.sections) ? h.sections : []).slice(0, 80).forEach((b, i) => {
    if (!b || typeof b !== "object" || b.hidden) return;
    if (SVC[b.t]) {
      flush(); ctx.i = i;
      const joined = b.join && open;
      if (!joined) { close(); const c = widthClass(b); out += `\n<section${slug(b.anchor) ? ` id="${b.anchor}"` : ""}${c ? ` class="${c}"` : ""}${live ? ` data-ls="${i}"` : ""}><div>`; open = true; }
      /* en mode direct, un groupe placé « à la suite » garde son propre repère */
      out += joined && live ? `<div data-ls="${i}">${SVC[b.t](b, ctx)}</div>` : SVC[b.t](b, ctx);
    } else if (b.t === "section") { flush(); close(); }
    else { close(); pending.push(Object.assign({}, b, { __i: i })); }
  });
  flush(); close();
  return { main: out, conf: ctx.conf || null };
}
