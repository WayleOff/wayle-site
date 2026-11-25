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

function embed(url) {
  url = String(url || "").trim();
  let m = /(?:youtube\.com\/watch\?(?:[^#]*&)?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/.exec(url);
  if (m) return `<div class="blk-vid"><iframe src="https://www.youtube-nocookie.com/embed/${m[1]}" title="Vidéo" loading="lazy" allow="accelerometer; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div>`;
  m = /vimeo\.com\/(?:video\/)?(\d{6,12})/.exec(url);
  if (m) return `<div class="blk-vid"><iframe src="https://player.vimeo.com/video/${m[1]}" title="Vidéo" loading="lazy" allow="fullscreen; picture-in-picture" allowfullscreen></iframe></div>`;
  if (/^https:\/\/[^\s"'<>]+\.(mp4|webm)(\?[^\s"'<>]*)?$/i.test(url)) return `<div class="blk-vid"><video src="${esc(url)}" controls playsinline preload="metadata"></video></div>`;
  return "";
}

export const mediaId = (id) => /^[A-Za-z0-9_-]{1,64}$/.test(String(id || ""));
export const list = (a, max) => (Array.isArray(a) ? a : []).filter((i) => i && typeof i === "object").slice(0, max);

export function block(b) {
  if (!b || typeof b !== "object") return "";
  switch (b.t) {
    case "title": {
      const h = b.level === "h3" ? "h3" : "h2";
      return `<${h} class="blk-t">${esc(b.text)}</${h}>` + (b.lead ? `<p class="lead">${inline(b.lead)}</p>` : "");
    }
    case "text": return `<div class="blk-text">${paras(b.text)}</div>`;
    case "image": {
      if (!mediaId(b.media)) return "";
      return `<figure class="blk-img ${b.size === "medium" ? "md" : ""}"><img src="/api/media?id=${esc(b.media)}" alt="${esc(b.alt)}" loading="lazy">${b.caption ? `<figcaption>${esc(b.caption)}</figcaption>` : ""}</figure>`;
    }
    case "video": return embed(b.url);
    case "button": return `<p class="blk-btn"><a class="btn${b.style === "ghost" ? " ghost" : ""}" href="${esc(safeUrl(b.url))}">${esc(b.label || "En savoir plus")}</a></p>`;
    case "space": return `<div style="height:${{ s: 1.5, m: 3, l: 5 }[b.size] || 3}rem" aria-hidden="true"></div>`;
    case "faq": return `<div class="faq">${(b.items || []).slice(0, 40).map((i) => `<details><summary>${esc(i.q)}</summary><p>${inline(i.a)}</p></details>`).join("")}</div>`;
    case "cards": {
      const items = (b.items || []).slice(0, 6);
      if (!items.length) return "";
      const cols = Math.min(items.length, 3);
      return `<div class="offers" style="--cols:${cols}">` + items.map((i) => {
        const lis = String(i.lines || "").split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
          const k = l.indexOf(" : ");
          return k > 0 ? `<li><b>${esc(l.slice(0, k))}</b><span>${esc(l.slice(k + 3))}</span></li>` : `<li><b>${esc(l)}</b></li>`;
        }).join("");
        return `<article><h3>${esc(i.title)}</h3>${i.text ? `<p>${esc(i.text)}</p>` : ""}${i.price ? `<div class="price">${esc(i.price)}</div>` : ""}${lis ? `<ul>${lis}</ul>` : ""}${i.link ? `<p style="margin-top:1rem"><a class="btn" href="${esc(safeUrl(i.link))}">${esc(i.linkLabel || "En savoir plus")}</a></p>` : ""}</article>`;
      }).join("") + `</div>`;
    }
    case "skills": {
      const items = list(b.items, 12).filter((i) => i.title || i.text);
      if (!items.length) return "";
      return `<dl class="skills">${items.map((i) => `<div><dt>${esc(i.title)}</dt><dd>${inline(i.text)}</dd></div>`).join("")}</dl>`;
    }
    case "values": {
      const items = list(b.items, 6).filter((i) => i.title || i.text);
      if (!items.length) return "";
      const c = items.length % 3 === 0 ? 3 : items.length % 2 === 0 ? 2 : Math.min(items.length, 3);
      return `<div class="values blk-c${c}">${items.map((i) => `<div><h3>${esc(i.title)}</h3><p>${inline(i.text)}</p></div>`).join("")}</div>`;
    }
    case "steps": {
      const items = list(b.items, 10).filter((i) => i.title || i.text);
      if (!items.length) return "";
      return `<ol class="steps acc">${items.map((i, k) => `<li><details${k === 0 ? " open" : ""}><summary><span class="n" aria-hidden="true">${String(k + 1).padStart(2, "0")}</span><strong>${esc(i.title)}</strong></summary><p>${inline(i.text)}</p></details></li>`).join("")}</ol>`;
    }
    case "band": {
      const btns = [[b.b1l, b.b1u, ""], [b.b2l, b.b2u, " ghost"]].filter((x) => x[0])
        .map((x) => `<a class="btn${x[2]}" href="${esc(safeUrl(x[1]))}">${esc(x[0])}</a>`).join("");
      return `<div class="band"><div>${b.title ? `<h2>${esc(b.title)}</h2>` : ""}${b.text ? `<p>${inline(b.text)}</p>` : ""}${b.small ? `<p class="small">${inline(b.small)}</p>` : ""}</div>${btns ? `<div class="band-cta">${btns}</div>` : ""}</div>`;
    }
    case "textimg": {
      const img = mediaId(b.media) ? `<div class="ref-ph"><img src="/api/media?id=${esc(b.media)}" alt="${esc(b.alt)}" loading="lazy" decoding="async"></div>` : "";
      return `<div class="ref-grid${b.side === "left" ? " blk-left" : ""}"><div class="ref-txt">${b.title ? `<h2>${esc(b.title)}</h2>` : ""}<div class="blk-text">${paras(b.text)}</div>${b.btnl ? `<a class="btn" href="${esc(safeUrl(b.btnu))}">${esc(b.btnl)}</a>` : ""}</div>${img}</div>`;
    }
    case "quote": {
      if (!b.text) return "";
      return `<figure class="blk-quote"><blockquote><p>${inline(b.text)}</p></blockquote>${b.author ? `<figcaption>${esc(b.author)}</figcaption>` : ""}</figure>`;
    }
    case "projects": {
      const items = list(b.items, 12).filter((i) => i.title || mediaId(i.media));
      if (!items.length) return "";
      return `<div class="refs blk-refs">${items.map((i) => {
        const img = mediaId(i.media) ? `<img src="/api/media?id=${esc(i.media)}" alt="${esc(i.alt || i.title)}" loading="lazy" decoding="async">` : "";
        const pic = img && i.url ? `<a class="ref-open" href="${esc(safeUrl(i.url))}">${img}</a>` : img;
        return `<figure>${pic}${i.title ? `<h3>${esc(i.title)}</h3>` : ""}${i.text ? `<p>${inline(i.text)}</p>` : ""}</figure>`;
      }).join("")}</div>`;
    }
    default: return "";
  }
}

// Une page = une suite de sections. Le bloc « Nouvelle section » ferme la section en cours
// et en ouvre une autre (espacement et séparation comme sur les pages du site).
export function renderBlocks(blocks) {
  const groups = [[]];
  for (const b of (Array.isArray(blocks) ? blocks : []).slice(0, 200)) {
    if (b && b.t === "section") { if (groups[groups.length - 1].length) groups.push([]); continue; }
    groups[groups.length - 1].push(b);
  }
  return groups.filter((g) => g.length).map((g) => `<section><div class="blk">${g.map(block).join("\n")}</div></section>`).join("\n");
}
