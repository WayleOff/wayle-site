/* Compile un thème validé en CSS. Seules des valeurs issues de validate() y entrent. */
import { EASINGS, MESH_WAYLE } from "../tokens/schema.js";
import { fontStack } from "../tokens/fonts.js";
import { parse, mix, toCss, withAlpha } from "./color.js";

const kebab = (s) => s.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase());
/* noms historiques déjà utilisés par les pages */
const LEGACY = { primary: "orange", secondary: "violet", btnInk: "btn-ink" };
const NAMES = ["bg", "surface", "surfaceRaised", "ink", "mid", "muted", "line", "primary", "secondary", "accent", "btn", "btnInk", "link", "linkHover", "success", "warning", "error", "info"];
const varName = (k) => "--" + (LEGACY[k] || kebab(k));

function palette(c) {
  return NAMES.map((k) => varName(k) + ":" + c[k]).join(";");
}

/* dégradé automatique à partir de couleurs choisies (même formule que l'Apparence actuelle) */
export function autoMesh(dark) {
  const p = parse(dark.primary), s = parse(dark.secondary), b = dark.bg;
  const W = { r: 255, g: 255, b: 255, a: 1 }, K = { r: 0, g: 0, b: 0, a: 1 };
  const c = (x, a) => toCss(withAlpha(x, a));
  return [
    `radial-gradient(60% 50% at 80% 6%,${c(mix(s, K, 0.12), 0.9)},transparent 70%)`,
    `radial-gradient(75% 60% at 22% 30%,${c(p, 0.72)},transparent 68%)`,
    `radial-gradient(55% 45% at 88% 48%,${c(mix(p, K, 0.08), 0.5)},transparent 70%)`,
    `radial-gradient(85% 55% at 45% 102%,${c(s, 0.95)},transparent 70%)`,
    `radial-gradient(50% 40% at 4% 96%,${c(mix(p, W, 0.3), 0.55)},transparent 70%)`,
    "var(--bg)",
  ].join(",");
}

export function compile(t) {
  const L = t.colors.light, D = t.colors.dark, ty = t.typography, r = t.shape.radius;
  const mesh = t.background.style === "flat" ? "var(--bg)" : t.background.mesh === "auto" ? autoMesh(D) : MESH_WAYLE;
  const root = [
    "--font-heading:" + fontStack(ty.fontHeading),
    "--font-body:" + fontStack(ty.fontBody),
    "--font-mono:" + fontStack(ty.fontMono),
    "--text-base:" + ty.baseSize + "rem",
    "--leading:" + ty.lineHeight,
    "--container:" + t.layout.container + "px",
    "--ease:" + EASINGS[t.motion.easing],
    "--radius-pill:" + r.pill + "px",
    "--radius-xl:" + r.xl + "px",
    "--radius-card:" + r.card + "px",
    "--radius-md:" + r.md + "px",
    "--radius-img:" + r.img + "px",
    "--radius-field:" + r.field + "px",
    "--bg-mesh:" + mesh,
    "--color-primary:var(--orange)",
    "--color-secondary:var(--violet)",
  ];
  const lightBlock = `${palette(L)};color-scheme:light`;
  const darkBlock = `${palette(D)};color-scheme:dark`;
  let css = `/* thème : ${t.name.replace(/[^\p{L}\p{N} ._'-]/gu, "")} */\n:root{${root.join(";")};${lightBlock}}\n`;
  if (t.mode === "dark") css += `:root:not([data-theme="light"]){${darkBlock}}\n`;
  else if (t.mode === "light") css += `:root[data-theme="dark"]{${darkBlock}}\n`;
  else css += `@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){${darkBlock}}}\n:root[data-theme="dark"]{${darkBlock}}\n`;
  return css;
}
