/* Génération de palettes : à partir d'une couleur, d'une image, ou au hasard.
   Modules purs (aucun accès au DOM) : testables, et le résultat reste toujours lisible (contraste WCAG ajusté).
   Toutes les fonctions renvoient des valeurs de couleur au format #RRGGBB ou rgba(...) déjà acceptées par validate(). */
import { parse, toHex, hslToRgb, rgbToHsl, suggestText, contrast, mix } from "./color.js";

const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
const hsl = (h, s, l) => { const [r, g, b] = hslToRgb(((h % 360) + 360) % 360, clamp(s, 0, 1), clamp(l, 0, 1)); return toHex({ r, g, b }); };
const W = "#FFFFFF";

export const HARMONIES = { analogue: "Analogue (voisine)", complementaire: "Complémentaire (opposée)", triade: "Triade (équilibrée)", mono: "Monochrome (une seule teinte)" };
const SHIFT = { analogue: 35, complementaire: 180, triade: 120, mono: 0 };

/* générateur pseudo-aléatoire reproductible (pour les tests) */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/* texte lisible (≥ ratio) sur un fond opaque : ajuste uniquement la luminosité */
const readable = (fg, bg, ratio) => (contrast(fg, bg) >= ratio ? fg : suggestText(fg, bg, ratio));
/* meilleure encre (blanc ou quasi-noir teinté) sur une couleur de bouton */
function inkOn(c, hue) {
  const dark = hsl(hue, 0.35, 0.1);
  return contrast(W, c) >= contrast(dark, c) ? W : dark;
}
/* bouton plein : part de la couleur principale, puis l'éclaircit ou l'assombrit si aucune encre n'atteint 4,5 */
function buttonPair(primary, hue) {
  const ink = inkOn(primary, hue);
  return [readable(primary, ink, 4.5), ink];
}

/* palette complète d'un schéma à partir d'une couleur de base.
   base = { h, s, l } de la couleur principale ; secondary = teinte (degrés) ou null (selon l'harmonie). */
function scheme(dark, { h, s }, secH, sSat) {
  const tint = clamp(s, 0.08, 0.9);
  if (dark) {
    const bg = hsl(h, clamp(tint * 0.6, 0.12, 0.5), 0.1);
    const primary = readable(hsl(h, clamp(s, 0.45, 0.95), 0.62), bg, 4.5);
    const secondary = readable(hsl(secH, clamp(sSat, 0.4, 0.9), 0.74), bg, 4.5);
    const [btn, btnInk] = buttonPair(primary, h);
    const link = readable(secondary, bg, 4.5);
    return {
      bg, surface: "rgba(255,255,255,.07)", surfaceRaised: "rgba(255,255,255,.14)", line: "rgba(255,255,255,.2)",
      ink: hsl(h, 0.2, 0.97), mid: "rgba(255,255,255,.82)", muted: "rgba(255,255,255,.6)",
      primary, secondary, accent: primary, btn, btnInk, link, linkHover: toHex(mix(link, W, 0.3)),
    };
  }
  const bg = hsl(h, clamp(tint * 0.5, 0.15, 0.4), 0.97);
  const ink = hsl(h, clamp(tint * 0.5, 0.2, 0.45), 0.12);
  const primary = readable(hsl(h, clamp(s, 0.5, 0.9), 0.46), bg, 4.5);
  const secondary = readable(hsl(secH, clamp(sSat, 0.4, 0.85), 0.36), bg, 4.5);
  const [btn, btnInk] = buttonPair(primary, h);
  return {
    bg, surface: hsl(h, clamp(tint * 0.45, 0.12, 0.35), 0.93), surfaceRaised: "#FFFFFF", line: hsl(h, clamp(tint * 0.4, 0.1, 0.3), 0.86),
    ink, mid: readable(hsl(h, 0.15, 0.36), bg, 4.5), muted: readable(hsl(h, 0.1, 0.46), bg, 3),
    primary, secondary, accent: primary, btn, btnInk, link: secondary, linkHover: toHex(mix(secondary, "#000000", 0.25)),
  };
}

/* { dark:{…}, light:{…} } à partir d'une couleur (#hex) ; `secondary` (#hex) optionnel : sinon déduite de l'harmonie */
export function fromBase(base, harmony = "analogue", secondary = null) {
  const p = parse(base);
  if (!p) return null;
  const { h, s } = rgbToHsl(p);
  let secH = h + (SHIFT[harmony] != null ? SHIFT[harmony] : 35), sSat = clamp(s, 0.45, 0.85);
  if (secondary && parse(secondary)) { const q = rgbToHsl(parse(secondary)); secH = q.h; sSat = clamp(q.s, 0.35, 0.9); }
  else if (harmony === "mono") sSat = clamp(s * 0.55, 0.15, 0.6);
  const b = { h, s };
  return { dark: scheme(true, b, secH, sSat), light: scheme(false, b, secH, sSat) };
}

/* Couleurs dominantes d'une image (RGBA aplati, ex. ImageData.data réduite à ~64 px).
   Histogramme de teintes pondéré par la saturation : les gris, blancs et noirs comptent à peine.
   → { primary, secondary|null } en #hex ; si l'image est quasi grise, primary = gris moyen et secondary = null. */
export function dominantColors(data) {
  const BINS = 36, w = new Array(BINS).fill(0), sum = Array.from({ length: BINS }, () => [0, 0, 0, 0]);
  let n = 0, ar = 0, ag = 0, ab = 0;
  for (let i = 0; i + 3 < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    n++; ar += r; ag += g; ab += b;
    const { h, s, l } = rgbToHsl({ r, g, b });
    const weight = s * (1 - Math.abs(2 * l - 1)) ** 0.6; /* ignore les tons trop clairs ou trop sombres */
    if (weight < 0.04) continue;
    const k = Math.floor(h / (360 / BINS)) % BINS;
    w[k] += weight; const a = sum[k]; a[0] += r * weight; a[1] += g * weight; a[2] += b * weight; a[3] += weight;
  }
  if (!n) return { primary: "#808080", secondary: null };
  const total = w.reduce((x, y) => x + y, 0);
  if (total < 0.5) { const c = toHex({ r: ar / n, g: ag / n, b: ab / n }); return { primary: c, secondary: null }; }
  /* lisse sur 3 cases voisines pour qu'une même teinte coupée entre deux cases reste unie */
  const sm = w.map((_, i) => w[(i + BINS - 1) % BINS] + w[i] * 2 + w[(i + 1) % BINS]);
  const top = sm.indexOf(Math.max(...sm));
  const colorAround = (c) => {
    let r = 0, g = 0, b = 0, t = 0;
    for (const d of [-1, 0, 1]) { const a = sum[(c + d + BINS) % BINS]; r += a[0]; g += a[1]; b += a[2]; t += a[3]; }
    return t ? toHex({ r: r / t, g: g / t, b: b / t }) : null;
  };
  const primary = colorAround(top);
  let best = -1, bestV = 0;
  for (let i = 0; i < BINS; i++) {
    const dist = Math.min((i - top + BINS) % BINS, (top - i + BINS) % BINS);
    if (dist >= 4 && sm[i] > bestV) { bestV = sm[i]; best = i; } /* ≥ 40° d'écart avec la dominante */
  }
  const secondary = best >= 0 && bestV >= sm[top] * 0.25 ? colorAround(best) : null;
  return { primary, secondary };
}

/* ---------- aléatoire ---------- */
const pick = (rng, a) => a[Math.floor(rng() * a.length)];
const FONT_PAIRS = [
  ["Bricolage Grotesque", "Figtree"], ["Space Grotesk", "DM Sans"], ["Space Grotesk", "Inter"], ["Playfair Display", "Inter"],
  ["Playfair Display", "DM Sans"], ["Inter", "Inter"], ["DM Sans", "DM Sans"], ["Bricolage Grotesque", "Inter"],
];
const R = (pill, xl, card, md, img, field) => ({ pill, xl, card, md, img, field });
const SHAPES = [R(0, 0, 0, 0, 0, 0), R(6, 12, 10, 8, 6, 6), R(12, 20, 16, 14, 12, 10), R(16, 28, 24, 20, 18, 14), R(999, 40, 28, 24, 24, 18), R(999, 56, 40, 32, 32, 24)];

/* Retourne des modifications { chemin: valeur } à appliquer au thème. kind : colors | fonts | shapes | all.
   `current` = thème en cours (pour conserver le mode quand on ne change que les couleurs). */
export function randomPatch(kind, rng = Math.random, current = {}) {
  const out = {};
  if (kind === "colors" || kind === "all") {
    const dark = kind === "all" ? rng() < 0.55 : current.mode !== "light";
    if (kind === "all") out["mode"] = dark ? "dark" : "light";
    const base = hsl(rng() * 360, 0.55 + rng() * 0.35, 0.5 + rng() * 0.1);
    const harmony = pick(rng, Object.keys(HARMONIES));
    const p = fromBase(base, harmony);
    for (const sc of ["dark", "light"]) for (const [k, v] of Object.entries(p[sc])) out["colors." + sc + "." + k] = v;
    out["background.mesh"] = "auto";
    if (kind === "all") out["background.style"] = rng() < 0.6 ? "mesh" : "flat";
  }
  if (kind === "fonts" || kind === "all") {
    const [h, b] = pick(rng, FONT_PAIRS);
    out["typography.fontHeading"] = h; out["typography.fontBody"] = b;
  }
  if (kind === "shapes" || kind === "all") {
    const s = pick(rng, SHAPES);
    for (const k of Object.keys(s)) out["shape.radius." + k] = s[k];
    out["components.button.style"] = pick(rng, ["solid", "solid", "outline", "ghost"]);
    out["components.card.hover"] = pick(rng, ["zoom", "lift", "none"]);
    out["components.field.style"] = pick(rng, ["boxed", "underlined", "filled"]);
  }
  return out;
}

/* applique { chemin: valeur } à un thème (sur place) via la fonction fournie (setPath) */
export function applyPatch(theme, patch, setPath) { for (const [p, v] of Object.entries(patch)) setPath(theme, p, v); return theme; }
/* patch des couleurs d'une palette { dark, light } → chemins du thème */
export function paletteToPatch(p) {
  const out = {};
  for (const sc of ["dark", "light"]) for (const [k, v] of Object.entries(p[sc])) out["colors." + sc + "." + k] = v;
  out["background.mesh"] = "auto";
  return out;
}
