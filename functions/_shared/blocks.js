// Blocs des pages : rendu HTML partagé par /p/<adresse> et la page d'accueil.
export const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function safeUrl(u) {
  u = String(u || "").trim();
  if (/^(https?:\/\/|mailto:|tel:|\/|#)/i.test(u)) return u;
  if (/^[a-z0-9_-]+\.html(#[\w-]*)?$/i.test(u)) return "/" + u; // page du site (artistes.html…)
  if (/^\.\/[\w.\/-]*(#[\w-]*)?$/.test(u)) return u; // lien relatif (./#contact)
  if (/^[a-z0-9.\-]+\.[a-z]{2,}(\/|$)/i.test(u)) return "https://" + u;
  return "#";
}

// Mise en forme volontairement minimale : **gras**, [texte](lien). Tout le reste est échappé.
export function inline(t) {
  let s = esc(t);
  s = s.replace(/\[([^\]]{1,200})\]\(([^)\s]{1,500})\)/g, (m, a, u) => `<a href="${esc(safeUrl(u.replace(/&amp;/g, "&")))}">${a}</a>`);
  s = s.replace(/\*\*([^*]{1,300})\*\*/g, "<strong>$1</strong>");
  return s;
}

export function paras(t) {
  return String(t || "").split(/\n{2,}/).map((p) => p.trim()).filter(Boolean).map((p) => {
    const lines = p.split("\n");
    if (lines.every((l) => /^\s*[-•]\s+/.test(l))) return "<ul class=\"blk-list\">" + lines.map((l) => "<li>" + inline(l.replace(/^\s*[-•]\s+/, "")) + "</li>").join("") + "</ul>";
    return "<p>" + lines.map(inline).join("<br>") + "</p>";
  }).join("");
}

/* Vidéos YouTube / Vimeo : rien n'est chargé avant le clic (aucune requête vers Google ou Vimeo, donc aucun traceur à
   consentir). Le script de site.js remplace le bouton par le lecteur au clic. Les vidéos du site (mp4) restent directes. */
function facade(src, host, allow) {
  return `<div class="blk-vid blk-vid-ph" data-embed="${esc(src)}" data-allow="${esc(allow)}"><button type="button" class="vid-play" aria-label="Lire la vidéo (${esc(host)})"><svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg><span>Lire la vidéo</span></button><p class="vid-note">En lisant la vidéo, vous la chargez depuis ${esc(host)}, qui peut déposer des cookies. <a href="/cookies">En savoir plus</a></p></div>`;
}
export function embed(url) {
  url = String(url || "").trim();
  let m = /(?:youtube\.com\/watch\?(?:[^#]*&)?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/.exec(url);
  if (m) return facade(`https://www.youtube-nocookie.com/embed/${m[1]}?autoplay=1`, "YouTube (Google)", "accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen");
  m = /vimeo\.com\/(?:video\/)?(\d{6,12})/.exec(url);
  if (m) return facade(`https://player.vimeo.com/video/${m[1]}?autoplay=1`, "Vimeo", "autoplay; fullscreen; picture-in-picture");
  if (/^(https:\/\/[^\s"'<>]+\.(mp4|webm)(\?[^\s"'<>]*)?|\/api\/video\?id=[A-Za-z0-9_-]{6,64})$/i.test(url)) return `<div class="blk-vid"><video src="${esc(url)}" controls playsinline preload="metadata"></video></div>`;
  return "";
}

/* ---------- mode « Modifier en direct » ----------
   Quand ctx.live est vrai (aperçu de l'admin uniquement), le HTML porte des repères :
   data-ls = numéro de la section/du bloc, data-lf = champ texte modifiable sur place,
   data-lim = image (changement par double-clic, cadrage par glisser). Hors mode direct : rien. */
export const lf = (ctx, path) => (ctx && ctx.live ? ` data-lf="${ctx.i}:${path}"` : "");
export const lim = (ctx, path) => (ctx && ctx.live ? ` data-lim="${ctx.i}:${path}"` : "");
export const posStyle = (s) => (/^[0-9.]{1,5}% [0-9.]{1,5}%$/.test(String(s || "")) ? `object-position:${s}` : "");
const WIDTHS = { narrow: "sz-narrow", wide: "sz-wide", full: "sz-full" };
export const widthClass = (b) => WIDTHS[b && b.w] || "";
/* ajoute data-ls et la classe de largeur sur la (les) balise(s) racine d'un bloc */
function decorate(h, b, ctx, roots) {
  const cls = widthClass(b), ls = ctx && ctx.live ? ` data-ls="${ctx.i}"` : "";
  if (!h || (!cls && !ls)) return h;
  let n = 0;
  return h.replace(/<([a-z0-9]+)((?:\s[^>]*)?)>/gi, (m, tag, attrs, off) => {
    if (n >= roots || (n > 0 && !isRoot(h, off))) return m;
    n++;
    if (cls) attrs = /\sclass="/.test(attrs) ? attrs.replace(/\sclass="/, ` class="${cls} `) : attrs + ` class="${cls}"`;
    return `<${tag}${attrs}${ls}>`;
  });
}
/* une balise est « racine » si tout ce qui la précède est refermé */
function isRoot(h, off) {
  const before = h.slice(0, off);
  const open = (before.match(/<(?!\/|br|img|input|hr|source|meta|link)[a-z0-9]+[\s>]/gi) || []).length;
  const close = (before.match(/<\/[a-z0-9]+>/gi) || []).length;
  return open === close;
}

export const mediaId = (id) => /^[A-Za-z0-9_-]{1,64}$/.test(String(id || ""));
export const list = (a, max) => (Array.isArray(a) ? a : []).filter((i) => i && typeof i === "object").slice(0, max);
/* comme list(), en gardant la position d'origine (__n) pour les repères du mode direct */
export const idx = (a, max) => (Array.isArray(a) ? a : []).slice(0, max).map((i, n) => (i && typeof i === "object" ? Object.assign({}, i, { __n: n }) : null)).filter(Boolean);

export function block(b, ctx) {
  if (!b || typeof b !== "object") return "";
  const h = blockHtml(b, ctx || {});
  return decorate(h, b, ctx, b.t === "title" && b.lead ? 2 : 1);
}
function blockHtml(b, ctx) {
  switch (b.t) {
    case "title": {
      const h = b.level === "h3" ? "h3" : "h2";
      return `<${h} class="blk-t"${lf(ctx, "text")}>${esc(b.text)}</${h}>` + (b.lead ? `<p class="lead"${lf(ctx, "lead")}>${inline(b.lead)}</p>` : "");
    }
    case "text": return `<div class="blk-text"${lf(ctx, "text")}>${paras(b.text)}</div>`;
    case "image": {
      if (!mediaId(b.media)) return "";
      return `<figure class="blk-img ${b.size === "medium" ? "md" : b.size === "small" ? "sm" : ""}"><img src="/api/media?id=${esc(b.media)}" alt="${esc(b.alt)}" loading="lazy"${lim(ctx, "")}>${b.caption ? `<figcaption${lf(ctx, "caption")}>${esc(b.caption)}</figcaption>` : ""}</figure>`;
    }
    case "video": return embed(b.url);
    case "button": return `<p class="blk-btn"><a class="btn${b.style === "ghost" ? " ghost" : ""}" href="${esc(safeUrl(b.url))}"${lf(ctx, "label")}>${esc(b.label || "En savoir plus")}</a></p>`;
    case "space": return `<div style="height:${{ s: 1.5, m: 3, l: 5 }[b.size] || 3}rem" aria-hidden="true"></div>`;
    case "faq": return `<div class="faq">${(b.items || []).slice(0, 40).map((i, n) => `<details><summary${lf(ctx, `items.${n}.q`)}>${esc(i.q)}</summary><p${lf(ctx, `items.${n}.a`)}>${inline(i.a)}</p></details>`).join("")}</div>`;
    case "cards": {
      const items = (b.items || []).slice(0, 6);
      if (!items.length) return "";
      const cols = Math.min(items.length, 3);
      return `<div class="offers" style="--cols:${cols}">` + items.map((i, n) => {
        const lis = String(i.lines || "").split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
          const k = l.indexOf(" : ");
          return k > 0 ? `<li><b>${esc(l.slice(0, k))}</b><span>${esc(l.slice(k + 3))}</span></li>` : `<li><b>${esc(l)}</b></li>`;
        }).join("");
        return `<article><h3${lf(ctx, `items.${n}.title`)}>${esc(i.title)}</h3>${i.text ? `<p${lf(ctx, `items.${n}.text`)}>${esc(i.text)}</p>` : ""}${i.price ? `<div class="price"${lf(ctx, `items.${n}.price`)}>${esc(i.price)}</div>` : ""}${lis ? `<ul>${lis}</ul>` : ""}${i.link ? `<p style="margin-top:1rem"><a class="btn" href="${esc(safeUrl(i.link))}">${esc(i.linkLabel || "En savoir plus")}</a></p>` : ""}</article>`;
      }).join("") + `</div>`;
    }
    case "skills": {
      const items = idx(b.items, 12).filter((i) => i.title || i.text);
      if (!items.length) return "";
      return `<dl class="skills">${items.map((i) => `<div><dt${lf(ctx, `items.${i.__n}.title`)}>${esc(i.title)}</dt><dd${lf(ctx, `items.${i.__n}.text`)}>${inline(i.text)}</dd></div>`).join("")}</dl>`;
    }
    case "values": {
      const items = idx(b.items, 6).filter((i) => i.title || i.text);
      if (!items.length) return "";
      const c = items.length % 3 === 0 ? 3 : items.length % 2 === 0 ? 2 : Math.min(items.length, 3);
      return `<div class="values blk-c${c}">${items.map((i) => `<div><h3${lf(ctx, `items.${i.__n}.title`)}>${esc(i.title)}</h3><p${lf(ctx, `items.${i.__n}.text`)}>${inline(i.text)}</p></div>`).join("")}</div>`;
    }
    case "steps": {
      const items = idx(b.items, 10).filter((i) => i.title || i.text);
      if (!items.length) return "";
      return `<ol class="steps acc">${items.map((i, k) => `<li><details${k === 0 || ctx.live ? " open" : ""}><summary><span class="n" aria-hidden="true">${String(k + 1).padStart(2, "0")}</span><strong${lf(ctx, `items.${i.__n}.title`)}>${esc(i.title)}</strong></summary><p${lf(ctx, `items.${i.__n}.text`)}>${inline(i.text)}</p></details></li>`).join("")}</ol>`;
    }
    case "band": {
      const btns = [[b.b1l, b.b1u, ""], [b.b2l, b.b2u, " ghost"]].filter((x) => x[0])
        .map((x) => `<a class="btn${x[2]}" href="${esc(safeUrl(x[1]))}">${esc(x[0])}</a>`).join("");
      return `<div class="band"><div>${b.title ? `<h2${lf(ctx, "title")}>${esc(b.title)}</h2>` : ""}${b.text ? `<p${lf(ctx, "text")}>${inline(b.text)}</p>` : ""}${b.small ? `<p class="small"${lf(ctx, "small")}>${inline(b.small)}</p>` : ""}</div>${btns ? `<div class="band-cta">${btns}</div>` : ""}</div>`;
    }
    case "textimg": {
      const ps = posStyle(b.pos);
      const img = mediaId(b.media) ? `<div class="ref-ph"><img src="/api/media?id=${esc(b.media)}" alt="${esc(b.alt)}" loading="lazy" decoding="async"${ps ? ` style="${ps}"` : ""}${lim(ctx, "")}></div>` : (ctx.live ? `<div class="ref-ph blk-noimg"${lim(ctx, "")}>Double-cliquez pour choisir une photo</div>` : "");
      return `<div class="ref-grid${b.side === "left" ? " blk-left" : ""}"><div class="ref-txt">${b.title ? `<h2${lf(ctx, "title")}>${esc(b.title)}</h2>` : ""}<div class="blk-text"${lf(ctx, "text")}>${paras(b.text)}</div>${b.btnl ? `<a class="btn" href="${esc(safeUrl(b.btnu))}">${esc(b.btnl)}</a>` : ""}</div>${img}</div>`;
    }
    case "quote": {
      if (!b.text) return "";
      return `<figure class="blk-quote"><blockquote><p${lf(ctx, "text")}>${inline(b.text)}</p></blockquote>${b.author ? `<figcaption${lf(ctx, "author")}>${esc(b.author)}</figcaption>` : ""}</figure>`;
    }
    case "projects": {
      const items = idx(b.items, 12).filter((i) => i.title || mediaId(i.media));
      if (!items.length) return "";
      return `<div class="refs blk-refs">${items.map((i) => {
        const ps = posStyle(i.pos);
        const img = mediaId(i.media) ? `<img src="/api/media?id=${esc(i.media)}" alt="${esc(i.alt || i.title)}" loading="lazy" decoding="async"${ps ? ` style="${ps}"` : ""}${lim(ctx, `items.${i.__n}`)}>` : "";
        const pic = img && i.url ? `<a class="ref-open" href="${esc(safeUrl(i.url))}">${img}</a>` : img;
        return `<figure>${pic}${i.title ? `<h3${lf(ctx, `items.${i.__n}.title`)}>${esc(i.title)}</h3>` : ""}${i.text ? `<p${lf(ctx, `items.${i.__n}.text`)}>${inline(i.text)}</p>` : ""}</figure>`;
      }).join("")}</div>`;
    }
    default: return "";
  }
}

// Une page = une suite de sections. Le bloc « Nouvelle section » ferme la section en cours
// et en ouvre une autre (espacement et séparation comme sur les pages du site).
// En mode direct, chaque bloc garde son numéro : b.__i (fourni par l'accueil/les pages métiers) ou sa position.
export function renderBlocks(blocks, ctx) {
  const groups = [[]], live = !!(ctx && ctx.live);
  (Array.isArray(blocks) ? blocks : []).slice(0, 200).forEach((b, k) => {
    if (!b || typeof b !== "object" || b.hidden) return;
    if (b.t === "section") { if (groups[groups.length - 1].length) groups.push([]); return; }
    groups[groups.length - 1].push([b, b.__i != null ? b.__i : k]);
  });
  return groups.filter((g) => g.length).map((g) => `<section><div class="blk">${g.map(([b, i]) => block(b, { live, i })).join("\n")}</div></section>`).join("\n");
}
