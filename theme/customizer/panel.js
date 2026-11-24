/* Panneau de personnalisation du thème (admin). Module ES autonome : mount(racine, contexte).
   Contexte : { api(method, qs, body), toast(msg, err), fail(e), setDirty(bool), legacy:{ get(), clear() } } */
import { SCHEMA, defaultTheme, getPath, setPath } from "../tokens/schema.js";
import { FONTS } from "../tokens/fonts.js";
import { validate, checkValue, diffFromDefaults } from "../tokens/validate.js";
import { compile } from "../engine/compile.js";
import { parse, toHex, toCss, withAlpha, mix, suggestText } from "../engine/color.js";
import { contrastReport } from "../engine/contrast.js";
import { PRESETS } from "../themes/presets.js";

const BYPATH = new Map(SCHEMA.map((t) => [t.path, t]));
const D = "colors.dark.";
const EASE_LABELS = { smooth: "Douce (d'origine)", ease: "Standard", "ease-in-out": "Lente au début et à la fin", spring: "Rebond léger" };
/* tab, chemin, libellé, aide, options */
const CTRL = [
  ["colors", D + "bg", "Fond du site", "Couleur derrière le dégradé"],
  ["colors", D + "surface", "Cartes et zones", "Fond translucide des cartes et formulaires", { alpha: true }],
  ["colors", D + "line", "Bordures et filets", "", { alpha: true }],
  ["colors", D + "ink", "Texte principal", "Titres et texte courant"],
  ["colors", D + "mid", "Texte secondaire", "Sous-titres, légendes", { alpha: true }],
  ["colors", D + "primary", "Couleur principale", "Accents chauds, points et puces"],
  ["colors", D + "secondary", "Couleur secondaire", "Accents froids, focus, liens"],
  ["colors", D + "btn", "Bouton plein", ""],
  ["colors", D + "btnInk", "Texte du bouton plein", ""],
  ["colors", D + "success", "Succès", "Message envoyé"],
  ["colors", D + "error", "Erreur", "Champ invalide"],
  ["colors", "background.style", "Fond", "", { labels: { mesh: "Dégradé", flat: "Uni" } }],
  ["colors", "background.mesh", "Dégradé", "", { labels: { wayle: "Wayle d'origine", auto: "Automatique (suit mes couleurs)" } }],
  ["type", "typography.fontHeading", "Police des titres", "Les polices s'affichent dans l'aperçu à droite"],
  ["type", "typography.fontBody", "Police du texte", ""],
  ["type", "typography.fontMono", "Police monospace", ""],
  ["type", "typography.baseSize", "Taille du texte", "1 rem = 16 px"],
  ["type", "typography.lineHeight", "Interligne du texte", ""],
  ["shape", "shape.radius.pill", "Boutons et pastilles", "", { choices: [[0, "Carré"], [8, "Léger"], [16, "Arrondi"], [999, "Pilule"]] }],
  ["shape", "shape.radius.xl", "Grands bandeaux", ""],
  ["shape", "shape.radius.card", "Cartes et formulaires", ""],
  ["shape", "shape.radius.md", "Blocs et citations", ""],
  ["shape", "shape.radius.img", "Images", ""],
  ["shape", "shape.radius.field", "Champs de formulaire", ""],
  ["shape", "layout.container", "Largeur du site", "Au-dessous de 1000 px le menu ne tient plus sur une ligne"],
  ["shape", "motion.easing", "Courbe des animations", "", { labels: EASE_LABELS }],
];
const TABS = [["themes", "Thèmes"], ["colors", "Couleurs"], ["type", "Typographie"], ["shape", "Formes"]];
const SECTIONS = { colors: [["Fond et surfaces", [D + "bg", D + "surface", D + "line", "background.style", "background.mesh"]], ["Texte", [D + "ink", D + "mid"]], ["Accents", [D + "primary", D + "secondary"]], ["Boutons", [D + "btn", D + "btnInk"]], ["Messages", [D + "success", D + "error"]]],
  type: [["Polices", ["typography.fontHeading", "typography.fontBody", "typography.fontMono"]], ["Tailles", ["typography.baseSize", "typography.lineHeight"]]],
  shape: [["Arrondis", ["shape.radius.pill", "shape.radius.xl", "shape.radius.card", "shape.radius.md", "shape.radius.img", "shape.radius.field"]], ["Mise en page", ["layout.container"]], ["Mouvement", ["motion.easing"]]] };
const DEVICES = [["desktop", "Ordinateur", 1440], ["tablet", "Tablette", 820], ["mobile", "Mobile", 390]];
const PAGES = [["/", "Accueil"], ["/artistes", "Artistes"], ["/entreprises", "Entreprises"], ["/commerces", "Commerces"]];

const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const fold = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const clone = (o) => JSON.parse(JSON.stringify(o));
const stable = (o) => JSON.stringify(o, (k, v) => (v && typeof v === "object" && !Array.isArray(v) ? Object.keys(v).sort().reduce((a, x) => ((a[x] = v[x]), a), {}) : v));
const core = (t) => { const d = diffFromDefaults(t); delete d.name; delete d.description; return stable(d); };
const GRADE = { AAA: "ok", AA: "ok", "AA large": "warn", "échec": "bad" };

const CSS = `
.tc{--tcw:380px;display:grid;grid-template-rows:auto 1fr;height:100vh;min-height:560px}
.tc-top{display:flex;gap:.7rem;align-items:center;flex-wrap:wrap;padding:.7rem 1rem;border-bottom:1px solid var(--line);background:#100A1C}
.tc-top h1{font-size:1.15rem;margin:0}.tc-top .sp{flex:1}
.tc-top .nm{color:var(--mid);font-size:.85rem}
.tc-body{display:grid;grid-template-columns:var(--tcw) minmax(0,1fr);min-height:0}
.tc-side{border-right:1px solid var(--line);overflow:auto;padding:.9rem 1rem 3rem;min-height:0}
.tc-tabs{display:flex;gap:.2rem;margin:.7rem 0 1rem;border-bottom:1px solid var(--line)}
.tc-tabs button{background:none;border:0;border-bottom:2px solid transparent;color:var(--mid);padding:.5rem .65rem;cursor:pointer;font-weight:600;font-size:.9rem}
.tc-tabs button[aria-selected=true]{color:var(--ink);border-color:var(--accent)}
.tc-search{width:100%;background:#150E22;border:1px solid var(--line);border-radius:10px;padding:.5rem .7rem}
.tc h3{margin:1.3rem 0 .6rem;font-size:.78rem;text-transform:uppercase;letter-spacing:.07em;color:var(--mid)}
.tc-c{display:grid;gap:.3rem;margin-bottom:.95rem}
.tc-c>label,.tc-c>.l{font-weight:600;font-size:.88rem}
.tc-c .h{color:var(--mid);font-size:.78rem}
.tc-r{display:flex;gap:.5rem;align-items:center}
.tc-r input[type=range]{flex:1;accent-color:var(--accent)}
.tc-r input[type=color]{width:2.4rem;height:2.1rem;padding:0;border:1px solid var(--line);border-radius:8px;background:none;cursor:pointer;flex:none}
.tc-r input[type=text],.tc-r input[type=number],.tc-c select{background:#150E22;border:1px solid var(--line);border-radius:8px;padding:.4rem .5rem;width:100%}
.tc-r input[type=number]{width:5.2rem;flex:none}
.tc-r .px{color:var(--mid);font-size:.8rem;min-width:1.6rem}
.tc-r input[aria-invalid=true]{border-color:var(--err)}
.tc-sw{width:2.1rem;height:2.1rem;border-radius:8px;border:1px solid var(--line);flex:none;background-image:linear-gradient(45deg,#777 25%,transparent 25%,transparent 75%,#777 75%),linear-gradient(45deg,#777 25%,transparent 25%,transparent 75%,#777 75%);background-size:10px 10px;background-position:0 0,5px 5px;position:relative;overflow:hidden}
.tc-sw i{position:absolute;inset:0}
.tc-pre{display:grid;gap:.6rem}
.tc-pc{display:grid;gap:.5rem;text-align:left;width:100%;background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:.8rem;cursor:pointer;color:var(--ink)}
.tc-pc:hover{border-color:var(--viol)}.tc-pc[aria-pressed=true]{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent)}
.tc-pc .sw{height:46px;border-radius:10px;display:flex;align-items:flex-end;gap:.4rem;padding:.4rem;border:1px solid #fff2}
.tc-pc .sw span{width:16px;height:16px;border-radius:50%}
.tc-pc b{font-size:.95rem}.tc-pc small{color:var(--mid)}
.tc-ct{width:100%;border-collapse:collapse;font-size:.82rem}
.tc-ct td{padding:.35rem .3rem;border-bottom:1px solid var(--line);vertical-align:middle}
.tc-ct .aa{display:inline-grid;place-items:center;width:2rem;height:1.6rem;border-radius:6px;font-weight:800;border:1px solid #fff2}
.tc-g{display:inline-block;padding:.05rem .45rem;border-radius:999px;font-size:.72rem;font-weight:700}
.tc-g.ok{background:#1d4a33;color:#5ED08F}.tc-g.warn{background:#4a3a1d;color:#FFC36B}.tc-g.bad{background:#4d2222;color:#FF8A75}
.tc-ct button{background:none;border:1px solid var(--line);border-radius:999px;color:var(--ink);padding:.1rem .55rem;font-size:.75rem;cursor:pointer}
.tc-prev{display:grid;grid-template-rows:auto 1fr;min-width:0;min-height:0;background:#0b0714}
.tc-pt{display:flex;gap:.5rem;align-items:center;flex-wrap:wrap;padding:.55rem .8rem;border-bottom:1px solid var(--line)}
.tc-pt select{width:auto;background:#150E22;border:1px solid var(--line);border-radius:8px;padding:.3rem .5rem}
.tc-seg{display:inline-flex;border:1px solid var(--line);border-radius:999px;overflow:hidden}
.tc-seg button{background:none;border:0;color:var(--mid);padding:.3rem .75rem;cursor:pointer;font-size:.85rem}
.tc-seg button[aria-pressed=true]{background:var(--panel2);color:var(--ink)}
.tc-stage{position:relative;overflow:hidden;min-height:0;display:grid;justify-items:center;align-items:start;padding:.8rem}
.tc-stage iframe{border:1px solid var(--line);border-radius:10px;background:#000;transform-origin:top left;position:absolute;top:.8rem}
.tc-note{background:#2A1F42;border:1px solid var(--line);border-radius:12px;padding:.6rem .8rem;font-size:.82rem;color:var(--mid);margin-bottom:.9rem}
.tc-note b{color:var(--ink)}
@media (max-width:1000px){.tc{height:auto}.tc-body{grid-template-columns:1fr}.tc-side{max-height:none}.tc-prev{height:70vh}}
main.wide{max-width:none;padding:0}
`;

export function mount(root, ctx) {
  const st = { T: defaultTheme(), pub: null, hist: [], hi: -1, tab: "themes", q: "", page: "/", device: "desktop", dirty: false, lastKey: "", lastAt: 0, draftTimer: 0, ready: false, notes: [] };
  const cleanup = [];
  const on = (t, ev, fn, o) => { t.addEventListener(ev, fn, o); cleanup.push(() => t.removeEventListener(ev, fn, o)); };
  if (!document.getElementById("tc-css")) { const s = document.createElement("style"); s.id = "tc-css"; s.textContent = CSS; document.head.appendChild(s); }
  root.classList.add("wide");
  root.innerHTML = '<p class="sub" style="padding:1.5rem">Chargement du thème…</p>';

  /* ---------- chargement : thème publié, brouillon, anciennes couleurs ---------- */
  Promise.all([ctx.api("GET", "c=t_themes&id=published"), ctx.api("GET", "c=t_themes&id=draft")]).then(([p, d]) => {
    st.pub = validate(p.data && p.data.theme).theme;
    let start = st.pub;
    if (d.data && d.data.theme) { const dv = validate(d.data.theme).theme; if (core(dv) !== core(st.pub)) { start = dv; st.notes.push("Brouillon repris : vos dernières modifications non publiées ont été retrouvées."); } }
    else if (!(p.data && p.data.theme)) { const m = migrateLegacy(); if (m) { start = m; st.notes.push("Les couleurs de l'ancienne page Apparence ont été reprises. Publiez pour les conserver."); } }
    st.T = clone(start); st.hist = [JSON.stringify(st.T)]; st.hi = 0; st.ready = true;
    build(); refreshDirty(); sendCss();
  }).catch((e) => { root.innerHTML = '<div class="warn" style="margin:1.5rem">Impossible de charger le thème (' + esc(e.message || "erreur") + ').</div>'; });

  function migrateLegacy() {
    const c = ctx.legacy && ctx.legacy.get && ctx.legacy.get(); if (!c || !Object.keys(c).length) return null;
    const t = defaultTheme(), W = { r: 255, g: 255, b: 255, a: 1 };
    const p = parse(c.primary || ""), s = parse(c.secondary || ""), b = parse(c.base || "");
    if (p) t.colors.dark.primary = toHex(mix(p, W, 0.2));
    if (s) t.colors.dark.secondary = toHex(mix(s, W, 0.5));
    if (b) t.colors.dark.bg = toHex(b);
    t.background.mesh = "auto"; t.name = "Personnalisé"; t.description = "";
    return validate(t).theme;
  }

  /* ---------- état, historique, aperçu ---------- */
  const displayName = () => { const c = core(st.T); const m = PRESETS.find((p) => core(validate(p.theme).theme) === c); return m ? m.name : "Personnalisé"; };
  function refreshDirty() {
    st.dirty = core(st.T) !== core(st.pub);
    ctx.setDirty && ctx.setDirty(st.dirty);
    const d = root.querySelector("#tc-dirty"); if (d) d.textContent = st.dirty ? "Modifications non publiées" : "À jour";
    const n = root.querySelector("#tc-name"); if (n) n.textContent = displayName();
    const pb = root.querySelector("#tc-pub"); if (pb) pb.disabled = !st.dirty;
    const rv = root.querySelector("#tc-rev"); if (rv) rv.hidden = !st.dirty;
    const u = root.querySelector("#tc-undo"), r = root.querySelector("#tc-redo"); if (u) u.disabled = st.hi <= 0; if (r) r.disabled = st.hi >= st.hist.length - 1;
  }
  function commit(key) {
    const s = JSON.stringify(st.T), now = Date.now();
    if (s === st.hist[st.hi]) return;
    st.hist = st.hist.slice(0, st.hi + 1);
    if (key && key === st.lastKey && now - st.lastAt < 800 && st.hi > 0) st.hist[st.hi] = s; else { st.hist.push(s); st.hi++; }
    if (st.hist.length > 100) { st.hist.shift(); st.hi--; }
    st.lastKey = key || ""; st.lastAt = now;
  }
  function changed(key) { commit(key); refreshDirty(); sendCss(); scheduleDraft(); }
  function sendCss() {
    const f = root.querySelector("#tc-frame"); if (!f || !f.contentWindow) return;
    try { f.contentWindow.postMessage({ type: "wayle-theme", css: compile(validate(st.T).theme) }, location.origin); } catch (e) {}
  }
  function scheduleDraft() {
    clearTimeout(st.draftTimer);
    st.draftTimer = setTimeout(() => {
      if (!st.dirty) { ctx.api("DELETE", "c=t_themes&id=draft").catch(() => {}); return; }
      ctx.api("PUT", "c=t_themes&id=draft", { theme: st.T, label: "Brouillon" }).catch(() => {});
    }, 1500);
  }
  function setTheme(t, key, rerender = true) { st.T = clone(validate(t).theme); changed(key); if (rerender) renderTab(); }
  function undo(d) { const i = st.hi + d; if (i < 0 || i >= st.hist.length) return; st.hi = i; st.T = JSON.parse(st.hist[i]); st.lastKey = ""; refreshDirty(); sendCss(); scheduleDraft(); renderTab(); }

  /* ---------- construction ---------- */
  function build() {
    root.innerHTML = `<div class="tc">
      <div class="tc-top"><h1>Thème</h1><span class="nm">· <span id="tc-name"></span></span><span class="sp"></span>
        <span class="hint" id="tc-dirty" role="status"></span>
        <button class="btn ghost sm" id="tc-undo" type="button" title="Annuler (Ctrl+Z)" aria-label="Annuler">↶ Annuler</button>
        <button class="btn ghost sm" id="tc-redo" type="button" title="Rétablir (Ctrl+Maj+Z)" aria-label="Rétablir">↷ Rétablir</button>
        <button class="btn ghost sm" id="tc-rev" type="button" hidden>Revenir au thème publié</button>
        <button class="btn" id="tc-pub" type="button" disabled>Publier</button></div>
      <div class="tc-body"><div class="tc-side">
        <input class="tc-search" id="tc-q" type="search" placeholder="Rechercher un réglage…" aria-label="Rechercher un réglage">
        <div class="tc-tabs" role="tablist" id="tc-tabs">${TABS.map((t) => `<button role="tab" type="button" data-tab="${t[0]}">${t[1]}</button>`).join("")}</div>
        ${st.notes.map((n) => `<div class="tc-note">${esc(n)}</div>`).join("")}
        <div id="tc-content"></div></div>
      <div class="tc-prev"><div class="tc-pt">
        <select id="tc-page" aria-label="Page à prévisualiser">${PAGES.map((p) => `<option value="${p[0]}">${p[1]}</option>`).join("")}</select>
        <span class="tc-seg" role="group" aria-label="Appareil">${DEVICES.map((d) => `<button type="button" data-dev="${d[0]}" aria-pressed="${d[0] === st.device}">${d[1]}</button>`).join("")}</span>
        <span class="sp" style="flex:1"></span><a class="hint" href="/" target="_blank" rel="noopener" id="tc-open">Ouvrir le site ↗</a></div>
        <div class="tc-stage" id="tc-stage"><iframe id="tc-frame" title="Aperçu du site" src="/"></iframe></div></div></div></div>`;
    st.notes = [];
    const $ = (s) => root.querySelector(s);
    const fr = $("#tc-frame");
    on(fr, "load", sendCss);
    fit();
    if (window.ResizeObserver) { const ro = new ResizeObserver(fit); ro.observe($("#tc-stage")); cleanup.push(() => ro.disconnect()); }
    on(window, "resize", fit);
    $("#tc-undo").onclick = () => undo(-1); $("#tc-redo").onclick = () => undo(1);
    $("#tc-rev").onclick = () => { if (confirm("Abandonner vos modifications non publiées ?")) { st.T = clone(st.pub); commit(""); refreshDirty(); sendCss(); scheduleDraft(); renderTab(); } };
    $("#tc-pub").onclick = publish;
    $("#tc-page").onchange = (e) => { st.page = e.target.value; fr.src = st.page; $("#tc-open").href = st.page; };
    root.querySelectorAll("[data-dev]").forEach((b) => (b.onclick = () => { st.device = b.dataset.dev; root.querySelectorAll("[data-dev]").forEach((x) => x.setAttribute("aria-pressed", x === b)); fit(); }));
    $("#tc-tabs").onclick = (e) => { const b = e.target.closest("[data-tab]"); if (b) { st.tab = b.dataset.tab; st.q = ""; $("#tc-q").value = ""; renderTab(); } };
    $("#tc-q").oninput = (e) => { st.q = e.target.value; renderTab(); };
    const side = $("#tc-content");
    side.addEventListener("input", onInput); side.addEventListener("change", onInput); side.addEventListener("click", onClick);
    on(document, "keydown", (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const tg = e.target; if (tg && /^(INPUT|TEXTAREA)$/.test(tg.tagName) && tg.type !== "range" && tg.type !== "color") return;
      const k = e.key.toLowerCase();
      if (k === "z") { e.preventDefault(); undo(e.shiftKey ? 1 : -1); } else if (k === "y") { e.preventDefault(); undo(1); }
    });
    renderTab();
  }
  function fit() {
    const stage = root.querySelector("#tc-stage"), fr = root.querySelector("#tc-frame"); if (!stage || !fr) return;
    const w = (DEVICES.find((d) => d[0] === st.device) || DEVICES[0])[2];
    const cw = stage.clientWidth - 16, ch = stage.clientHeight - 16, k = Math.min(1, cw / w);
    fr.style.width = w + "px"; fr.style.height = Math.max(200, ch / k) + "px"; fr.style.transform = `scale(${k})`;
    fr.style.left = Math.max(8, (stage.clientWidth - w * k) / 2) + "px";
  }

  /* ---------- rendu des contrôles ---------- */
  const keywords = (p) => { const c = meta(p), tab = TABS.find((t) => t[0] === c[0]); const sec = (SECTIONS[c[0]] || []).find((x) => x[1].includes(p)); return (tab ? tab[1] : "") + " " + (sec ? sec[0] : ""); };
  const meta = (p) => CTRL.find((c) => c[1] === p);
  function valueOf(p) { return getPath(st.T, p); }
  function control(p) {
    const m = meta(p), t = BYPATH.get(p), v = valueOf(p), o = m[4] || {}, id = "c-" + p.replace(/\./g, "-");
    const head = `<label for="${id}">${esc(m[2])}</label>`, hint = m[3] ? `<span class="h">${esc(m[3])}</span>` : "";
    let body = "";
    if (t.type === "color") {
      const c = parse(v) || { r: 0, g: 0, b: 0, a: 1 };
      body = `<div class="tc-r">${o.alpha ? `<span class="tc-sw"><i data-sw="${p}" style="background:${esc(v)}"></i></span>` : ""}
        <input type="color" id="${id}" data-p="${p}" data-k="pick" value="${toHex({ ...c, a: 1 })}" aria-label="${esc(m[2])} : sélecteur">
        <input type="text" data-p="${p}" data-k="text" value="${esc(v)}" spellcheck="false" aria-label="${esc(m[2])} : valeur"></div>`
        + (o.alpha ? `<div class="tc-r"><span class="h" style="min-width:5rem">Opacité</span><input type="range" min="0" max="100" step="1" data-p="${p}" data-k="alpha" value="${Math.round(c.a * 100)}" aria-label="${esc(m[2])} : opacité"><span class="px" data-av="${p}">${Math.round(c.a * 100)} %</span></div>` : "");
    } else if (t.type === "number" && o.choices) {
      const ch = o.choices.slice(); if (!ch.some((x) => x[0] === v)) ch.push([v, "Personnalisé (" + v + " px)"]);
      body = `<select id="${id}" data-p="${p}" data-k="choice">${ch.map((x) => `<option value="${x[0]}"${x[0] === v ? " selected" : ""}>${esc(x[1])}</option>`).join("")}</select>`;
    } else if (t.type === "number") {
      body = `<div class="tc-r"><input type="range" id="${id}" min="${t.min}" max="${t.max}" step="${t.step || 1}" value="${v}" data-p="${p}" data-k="num"><input type="number" min="${t.min}" max="${t.max}" step="${t.step || 1}" value="${v}" data-p="${p}" data-k="numt" aria-label="${esc(m[2])} : valeur"><span class="px">${esc(t.unit || "")}</span></div>`;
    } else if (t.type === "font") {
      body = `<select id="${id}" data-p="${p}" data-k="enum">${FONTS.map((f) => `<option${f.name === v ? " selected" : ""}>${esc(f.name)}</option>`).join("")}</select>`;
    } else if (t.type === "enum") {
      const lab = o.labels || {};
      body = `<select id="${id}" data-p="${p}" data-k="enum">${t.options.map((x) => `<option value="${esc(x)}"${x === v ? " selected" : ""}>${esc(lab[x] || x)}</option>`).join("")}</select>`;
    }
    return `<div class="tc-c" data-ctl="${p}">${head}${body}${hint}</div>`;
  }
  function contrastHtml() {
    const rep = contrastReport(validate(st.T).theme).filter((r) => r.mode === "dark");
    return `<h3>Lisibilité (WCAG)</h3><p class="hint" style="margin:0 0 .5rem">Indicatif : vous restez libre de vos choix.</p><table class="tc-ct">` + rep.map((r) => {
      const c = st.T.colors.dark, bgc = r.bg === "bg" ? c.bg : c[r.bg];
      const fix = !r.ok && ["ink", "mid", "btnInk", "primary", "secondary", "error", "success"].includes(r.fg) ? `<button type="button" data-fix="${r.fg}|${r.bg}|${/large/.test(r.label) ? 3 : 4.5}">Corriger</button>` : "";
      return `<tr><td>${esc(r.label)}</td><td><span class="aa" style="color:${esc(c[r.fg])};background:${esc(bgc)}">Aa</span></td><td>${r.ratio}</td><td><span class="tc-g ${GRADE[r.grade]}">${esc(r.grade)}</span></td><td>${fix}</td></tr>`;
    }).join("") + `</table>`;
  }
  function themesHtml() {
    const cur = core(st.T);
    return `<div class="tc-pre">` + PRESETS.map((p) => {
      const v = validate(p.theme).theme, c = v.colors.dark, on = core(v) === cur;
      return `<button type="button" class="tc-pc" data-preset="${p.id}" aria-pressed="${on}"><span class="sw" style="background:${esc(c.bg)}"><span style="background:${esc(c.primary)}"></span><span style="background:${esc(c.secondary)}"></span><span style="background:${esc(c.ink)}"></span></span><b>${esc(p.name)}</b><small>${esc(p.description)}</small></button>`;
    }).join("") + `</div><p class="hint" style="margin-top:1rem">Les thèmes clairs (Minimal clair, Éditorial, Corporate) arrivent à la prochaine étape : le verre du menu et des cartes doit d'abord devenir réglable.</p>`;
  }
  function renderTab() {
    const box = root.querySelector("#tc-content"); if (!box) return;
    root.querySelectorAll("[data-tab]").forEach((b) => b.setAttribute("aria-selected", !st.q && b.dataset.tab === st.tab));
    let h = "";
    if (st.q.trim()) {
      const q = fold(st.q.trim()), hits = CTRL.filter((c) => fold(c[2] + " " + c[3] + " " + keywords(c[1])).includes(q));
      h = hits.length ? hits.map((c) => control(c[1])).join("") : `<p class="hint">Aucun réglage ne correspond à « ${esc(st.q)} ».</p>`;
    } else if (st.tab === "themes") h = themesHtml();
    else {
      h = (SECTIONS[st.tab] || []).map((s) => `<h3>${esc(s[0])}</h3>` + s[1].filter((p) => !(p === "background.mesh" && st.T.background.style === "flat")).map(control).join("")).join("");
      if (st.tab === "colors") h += contrastHtml();
      h += `<p style="margin-top:1.2rem"><button class="btn ghost sm" type="button" data-reset-tab="${st.tab}">Remettre les valeurs Wayle pour cet onglet</button></p>`;
    }
    box.innerHTML = h;
  }

  /* ---------- événements ---------- */
  function setValue(p, v, key) {
    const t = BYPATH.get(p); if (!t) return false;
    if (checkValue(t, v)) return false;
    setPath(st.T, p, v);
    if ((p === D + "primary" || p === D + "secondary") && st.T.background.mesh === "wayle" && st.T.background.style === "mesh") { st.T.background.mesh = "auto"; const s = root.querySelector('[data-p="background.mesh"]'); if (s) s.value = "auto"; }
    changed(key || p);
    return true;
  }
  function syncColor(p) {
    const v = valueOf(p), c = parse(v), box = root.querySelector(`[data-ctl="${p}"]`); if (!box || !c) return;
    const sw = box.querySelector("[data-sw]"); if (sw) sw.style.background = v;
    const pk = box.querySelector('[data-k="pick"]'); if (pk) pk.value = toHex({ ...c, a: 1 });
    const al = box.querySelector('[data-k="alpha"]'); if (al) { al.value = Math.round(c.a * 100); const av = box.querySelector("[data-av]"); if (av) av.textContent = Math.round(c.a * 100) + " %"; }
    const tx = box.querySelector('[data-k="text"]'); if (tx && document.activeElement !== tx) tx.value = v;
  }
  function refreshContrast() {
    if (st.tab !== "colors" || st.q) return;
    const old = root.querySelector(".tc-ct"); if (!old) return;
    const tmp = document.createElement("div"); tmp.innerHTML = contrastHtml();
    old.replaceWith(tmp.querySelector(".tc-ct"));
  }
  function onInput(e) {
    const el = e.target, p = el.dataset.p; if (!p) return;
    const k = el.dataset.k, t = BYPATH.get(p), cur = valueOf(p);
    if (k === "pick") { const c = parse(cur) || { a: 1 }; const n = parse(el.value); if (setValue(p, n.a < 1 || c.a < 1 ? toCss(withAlpha(n, c.a)) : el.value.toUpperCase(), p)) { syncColor(p); refreshContrast(); } }
    else if (k === "alpha") { const c = parse(cur); if (setValue(p, toCss(withAlpha(c, el.value / 100)), p)) { syncColor(p); refreshContrast(); } }
    else if (k === "text") { const ok = parse(el.value) && setValue(p, el.value.trim(), p); el.setAttribute("aria-invalid", !ok); if (ok) { syncColor(p); refreshContrast(); } }
    else if (k === "num" || k === "numt") {
      const n = parseFloat(el.value); if (!Number.isFinite(n)) return;
      if (setValue(p, n, p)) { el.setAttribute("aria-invalid", false); const box = el.closest("[data-ctl]"); box.querySelectorAll("[data-p]").forEach((x) => { if (x !== el) x.value = n; }); } else el.setAttribute("aria-invalid", true);
    }
    else if (k === "choice") setValue(p, parseFloat(el.value), p);
    else if (k === "enum") { if (setValue(p, el.value, p) && (p === "background.style" || p === "background.mesh")) renderTab(); }
  }
  function onClick(e) {
    const pr = e.target.closest("[data-preset]");
    if (pr) { const p = PRESETS.find((x) => x.id === pr.dataset.preset); if (p) setTheme(p.theme, "preset"); return; }
    const fx = e.target.closest("[data-fix]");
    if (fx) { const [fg, bg, tg] = fx.dataset.fix.split("|"), c = st.T.colors.dark; const bgc = bg === "bg" ? c.bg : c[bg]; setValue(D + fg, suggestText(c[fg], parse(bgc) ? toCss({ ...parse(bgc), a: 1 }) : "#000", +tg).toUpperCase(), "fix" + fg); renderTab(); return; }
    const rs = e.target.closest("[data-reset-tab]");
    if (rs) { const def = defaultTheme(); for (const s of SECTIONS[rs.dataset.resetTab] || []) for (const p of s[1]) setPath(st.T, p, getPath(def, p)); changed("reset"); renderTab(); }
  }

  /* ---------- publication ---------- */
  function publish() {
    const btn = root.querySelector("#tc-pub"); btn.disabled = true;
    const v = validate(st.T); if (!v.ok) { ctx.toast("Thème invalide : " + v.errors[0].path, true); refreshDirty(); return; }
    v.theme.name = displayName(); if (v.theme.name === "Personnalisé") v.theme.description = "";
    ctx.api("PUT", "c=t_themes&id=published", { theme: v.theme, label: v.theme.name })
      .then(() => ctx.api("DELETE", "c=t_themes&id=draft").catch(() => {}))
      .then(() => (ctx.legacy && ctx.legacy.clear ? ctx.legacy.clear() : null))
      .then(() => { st.pub = clone(v.theme); st.T = clone(v.theme); clearTimeout(st.draftTimer); refreshDirty(); ctx.toast("Thème publié. Visible sur le site dans une minute environ."); })
      .catch((e) => { ctx.fail(e); refreshDirty(); });
  }

  return function unmount() {
    clearTimeout(st.draftTimer); cleanup.forEach((f) => f()); root.classList.remove("wide"); root.innerHTML = "";
    ctx.setDirty && ctx.setDirty(false);
  };
}
