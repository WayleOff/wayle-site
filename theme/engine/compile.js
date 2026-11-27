/* Compile un thème validé en CSS. Seules des valeurs issues de validate() y entrent. */
import { EASINGS, MESH_WAYLE, COVER_WAYLE } from "../tokens/schema.js";
import { fontStack, fontImports } from "../tokens/fonts.js";
import { stripComments, checkCustomCss } from "../tokens/validate.js";
import { parse, mix, toCss, withAlpha } from "./color.js";

const kebab = (s) => s.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase());
/* noms historiques déjà utilisés par les pages */
const LEGACY = { primary: "orange", secondary: "violet", btnInk: "btn-ink" };
const NAMES = ["bg", "surface", "surfaceRaised", "ink", "mid", "muted", "line", "primary", "secondary", "accent", "btn", "btnInk", "link", "linkHover", "success", "warning", "error", "info"];
const varName = (k) => "--" + (LEGACY[k] || kebab(k));

function palette(c) {
  return NAMES.map((k) => varName(k) + ":" + c[k]).join(";");
}

/* dégradé automatique à partir de couleurs choisies (même formule que l'Apparence actuelle).
   Sur fond clair, les taches sont atténuées pour rester lisibles. */
const COVER_DARK = "#14082A";
const W = { r: 255, g: 255, b: 255, a: 1 }, K = { r: 0, g: 0, b: 0, a: 1 };
const at = (x, a, soft) => toCss(withAlpha(x, soft ? +(a * 0.4).toFixed(3) : a));
export function autoMesh(c, soft = false) {
  const p = parse(c.primary), s = parse(c.secondary);
  return [
    `radial-gradient(60% 50% at 80% 6%,${at(mix(s, K, 0.12), 0.9, soft)},transparent 70%)`,
    `radial-gradient(75% 60% at 22% 30%,${at(p, 0.72, soft)},transparent 68%)`,
    `radial-gradient(55% 45% at 88% 48%,${at(mix(p, K, 0.08), 0.5, soft)},transparent 70%)`,
    `radial-gradient(85% 55% at 45% 102%,${at(s, 0.95, soft)},transparent 70%)`,
    `radial-gradient(50% 40% at 4% 96%,${at(mix(p, W, 0.3), 0.55, soft)},transparent 70%)`,
    "var(--bg)",
  ].join(",");
}

/* version à trois taches du dégradé, pour le bandeau d'accueil */
export function autoCover(c, soft = false, base = "var(--bg)") {
  const p = parse(c.primary), s = parse(c.secondary);
  return [
    `radial-gradient(60% 50% at 80% 6%,${at(mix(s, K, 0.12), 0.9, soft)},transparent 70%)`,
    `radial-gradient(75% 60% at 22% 30%,${at(p, 0.72, soft)},transparent 68%)`,
    `radial-gradient(85% 55% at 45% 102%,${at(s, 0.95, soft)},transparent 70%)`,
    base,
  ].join(",");
}

/* variables propres à un schéma (clair ou sombre) : palette + fond */
function scheme(t, c, dark) {
  const flat = t.background.style === "flat", auto = t.background.mesh === "auto" || !dark; // le dégradé « Wayle » n'existe qu'en sombre
  const mesh = flat ? "var(--bg)" : auto ? autoMesh(c, !dark) : MESH_WAYLE;
  /* le bandeau d'accueil porte une vidéo : son fond de repli reste sombre même sur un thème clair */
  const cover = flat ? (dark ? "var(--bg)" : COVER_DARK) : auto ? autoCover(c, false, dark ? "var(--bg)" : COVER_DARK) : COVER_WAYLE;
  return `${palette(c)};--bg-mesh:${mesh};--bg-cover:${cover};color-scheme:${dark ? "dark" : "light"}`;
}

/* bandeau vidéo « petit » : titre à gauche, vidéo cadrée à droite, commandes dessous. S = sélecteur du bandeau concerné. */
export function compactCover(S) {
  const c = (x) => x.split(",").map((y) => `${S}${y.startsWith(":") || y.startsWith("[") ? "" : " "}${y}`).join(",");
  return [
    `${S}{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.1fr);grid-template-areas:"p v" "p v" ". t" ". b";column-gap:clamp(2rem,5vw,4.5rem);row-gap:.9rem;align-items:center;width:min(calc(var(--container) - 3rem),calc(100% - 3rem));height:auto;min-height:0;margin:0 auto;padding:7rem 0 3rem;overflow:visible;background:none;color:var(--ink)}`,
    `${S}::after,${S}::before{display:none}`,
    `${c("video")}{grid-area:v;position:relative;inset:auto;width:100%;height:auto;aspect-ratio:4/3;max-height:34rem;object-fit:cover;border-radius:var(--radius-xl);background:var(--surface);transform:none}`,
    `${c(".cover-pitch")}{grid-area:p;position:static;max-width:none;align-self:center;color:var(--ink);text-shadow:none}`,
    `${c(".cover-pitch .cp1")}{font-size:clamp(2rem,4.2vw,3.5rem);line-height:1.04;letter-spacing:-.035em}`,
    `${c(".cover-pitch .cp2")}{margin-top:1rem;font-size:1.15rem;color:var(--mid);opacity:1}`,
    `${c(".cue:not(.cue-mini)")}{display:none}`,
    `${c(".cue-mini")}{color:var(--ink);background:var(--surface-raised);border:1px solid var(--line);-webkit-backdrop-filter:none;backdrop-filter:none}`,
    `${c(".cue-mini:hover")}{background:var(--surface)}`,
    `${c(".cover-tag")}{grid-area:t;position:static;justify-self:start;max-width:none;color:var(--ink);font-size:1rem;letter-spacing:0}`,
    `${c(".actions")}{grid-area:t;position:static;justify-self:end;flex-wrap:wrap}`,
    `${c(".bars")}{grid-area:b;position:static}`,
    `${c(".arrow,.sound")}{color:var(--ink);background:var(--surface-raised);border:1px solid var(--line);-webkit-backdrop-filter:none;backdrop-filter:none}`,
    `${c(".arrow:hover,.sound:hover")}{background:var(--surface)}`,
    `${c(".tr")}{background:var(--line)}${c(".tr b")}{background:var(--ink)}${c(".vol")}{accent-color:var(--ink)}`,
    `@media (max-width:900px){${S}{grid-template-columns:1fr;grid-template-areas:"p" "v" "t" "a" "b";padding-top:6rem}${c(".actions")}{grid-area:a;justify-self:start}${c("video")}{max-height:none}}`,
  ];
}

/* règles de composants et d'animation : émises uniquement quand elles diffèrent du thème Wayle, donc rien par défaut */
const BTN = ".btn:not(.ghost),nav a.cta,html .cta-bar .p";
const IMG = "img:not(.on-light):not(.on-dark)";
export function extras(t) {
  const c = t.components, m = t.motion, out = [];
  /* thème clair : menu totalement opaque */
  if (t.mode !== "dark") out.push(`:root[data-theme="light"] header{background:var(--bg);border-color:var(--line);box-shadow:0 8px 24px -10px rgba(0,0,0,.25)}:root[data-theme="light"] header::before{display:none}:root[data-theme="light"] .logo .on-light{display:block}:root[data-theme="light"] .logo .on-dark{display:none}`);
  if (c.button.style === "outline") out.push(`${BTN}{background:transparent;color:var(--ink);border:1.5px solid var(--btn)}`);
  if (c.button.style === "ghost") out.push(`${BTN}{background:var(--surface);color:var(--ink);box-shadow:none}`);
  if (c.button.case === "upper") out.push(`.btn,nav a.cta,html .cta-bar a{text-transform:uppercase;letter-spacing:.06em;font-size:.88em}`);
  if (c.card.hover !== "zoom") {
    out.push(`.offers article:hover .o-ph img,.ref-open:hover img{transform:none}`);
    if (c.card.hover === "lift") out.push(`.offers article,.ref-open{transition:transform calc(.25s*var(--dur-k,1)) var(--ease)}.offers article:hover,.ref-open:hover{transform:translateY(-4px)}`);
  }
  if (c.field.style === "underlined") out.push(`input,select,textarea{background:transparent;border-width:0 0 1.5px;border-radius:0;padding-left:.1rem;padding-right:.1rem}`);
  if (c.field.style === "filled") out.push(`input,select,textarea{background:var(--surface);border-color:transparent}`);
  if (c.image.filter !== "none") out.push(`${IMG}{filter:${c.image.filter === "grayscale" ? "grayscale(1)" : "sepia(.85)"}}`);
  /* taille du bandeau : « petit » par défaut du thème, ou choisi page par page (data-size sur le bandeau) */
  if (c.hero.size === "compact") out.push(...compactCover('.cover:not([data-size="full"])'));
  else out.push(...compactCover('.cover[data-size="compact"]'));
  if (c.hero.overlay > 0) out.push(`.cover::before{content:"";position:absolute;inset:0;z-index:1;pointer-events:none;background:rgba(20,8,40,${c.hero.overlay})}`);
  if (!m.smoothScroll || !m.enabled) out.push(`html,.refs{scroll-behavior:auto}`);
  if (m.reveal === "fade") out.push(`@keyframes rvIn{from{opacity:0}}html.rv [data-rv]:not(.in){translate:none}`);
  if (m.reveal === "zoom") out.push(`@keyframes rvIn{from{opacity:0;scale:.96}}html.rv [data-rv]:not(.in){translate:none;scale:.96}`);
  if (m.reveal === "none" || !m.enabled) out.push(`html.rv [data-rv]:not(.in){opacity:1;translate:none;scale:none}html.rv [data-rv].in{animation:none}`);
  if (!m.enabled) out.push(`*,*::before,*::after{animation:none!important;transition:none!important}`);
  return out;
}

/* @font-face des polices .woff2 envoyées, seulement si elles servent (titres, texte ou monospace).
   « font-weight:100 900 » : la police couvre tous les graisses demandées, le navigateur ne fabrique pas de faux gras. */
export function customFaces(t) {
  const ty = t.typography, used = new Set([ty.fontHeading, ty.fontBody, ty.fontMono]), out = [];
  for (const n of [1, 2]) {
    const f = ty["custom" + n];
    if (f && f.file && used.has("Police importée " + n)) out.push(`@font-face{font-family:"Police importée ${n}";src:url(${f.file}) format("woff2");font-weight:100 900;font-style:normal;font-display:swap}`);
  }
  return out;
}

export function compile(t) {
  const L = t.colors.light, D = t.colors.dark, ty = t.typography, r = t.shape.radius;
  const root = [
    "--mode:" + t.mode,
    "--font-heading:" + fontStack(ty.fontHeading),
    "--font-body:" + fontStack(ty.fontBody),
    "--font-mono:" + fontStack(ty.fontMono),
    "--text-base:" + ty.baseSize + "rem",
    "--leading:" + ty.lineHeight,
    "--container:" + t.layout.container + "px",
    "--ease:" + EASINGS[t.motion.easing],
    "--dur-k:" + +(t.motion.duration / 0.35).toFixed(4),
    "--radius-pill:" + r.pill + "px",
    "--radius-xl:" + r.xl + "px",
    "--radius-card:" + r.card + "px",
    "--radius-md:" + r.md + "px",
    "--radius-img:" + r.img + "px",
    "--radius-field:" + r.field + "px",
    "--color-primary:var(--orange)",
    "--color-secondary:var(--violet)",
  ];
  const imports = fontImports([ty.fontHeading, ty.fontBody, ty.fontMono]);
  const lightBlock = scheme(t, L, false), darkBlock = scheme(t, D, true);
  let css = imports.join("\n") + (imports.length ? "\n" : "");
  const faces = customFaces(t);
  if (faces.length) css += faces.join("\n") + "\n";
  css += `/* thème : ${t.name.replace(/[^\p{L}\p{N} ._'-]/gu, "")} */\n:root{${root.join(";")};${lightBlock}}\n`;
  /* les pages tiennent « sans attribut » pour sombre ; un petit script pose data-theme pour clair et auto */
  if (t.mode === "dark") css += `:root:not([data-theme="light"]){${darkBlock}}\n`;
  else css += `:root[data-theme="dark"]{${darkBlock}}\n`;
  const x = extras(t);
  if (x.length) css += x.join("\n") + "\n";
  /* CSS personnalisé : en dernier pour primer. Re-contrôlé ici (défense en profondeur) et émis sans commentaires. */
  const adv = t.advanced;
  if (adv && adv.customCssOn && adv.customCss && !checkCustomCss(adv.customCss)) css += "/* css personnalisé */\n" + stripComments(adv.customCss).trim() + "\n";
  return css;
}
