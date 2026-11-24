/* Utilitaires couleur : lecture, mélange, nuances, contraste WCAG. Sans dépendance. */
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
const HEX = /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const FN = /^(rgba?|hsla?)\(\s*([^()]+?)\s*\)$/i;

/* → {r,g,b,a} (0-255, a 0-1) ou null */
export function parse(str) {
  if (typeof str !== "string") return null;
  const s = str.trim();
  let m = HEX.exec(s);
  if (m) {
    let h = m[1];
    if (h.length <= 4) h = [...h].map((c) => c + c).join("");
    const n = (i) => parseInt(h.slice(i, i + 2), 16);
    return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? +(n(6) / 255).toFixed(3) : 1 };
  }
  m = FN.exec(s);
  if (!m) return null;
  const parts = m[2].split(/[\s,\/]+/).filter(Boolean);
  if (parts.length < 3 || parts.length > 4) return null;
  const num = (x, max) => (x.endsWith("%") ? (parseFloat(x) / 100) * max : parseFloat(x));
  if (!parts.every((x) => /^-?\d*\.?\d+%?$/.test(x))) return null;
  const a = parts[3] != null ? clamp(num(parts[3], 1), 0, 1) : 1;
  if (m[1].toLowerCase().startsWith("rgb")) {
    return { r: clamp(Math.round(num(parts[0], 255)), 0, 255), g: clamp(Math.round(num(parts[1], 255)), 0, 255), b: clamp(Math.round(num(parts[2], 255)), 0, 255), a };
  }
  const [r, g, b] = hslToRgb(((parseFloat(parts[0]) % 360) + 360) % 360, clamp(parseFloat(parts[1]), 0, 100) / 100, clamp(parseFloat(parts[2]), 0, 100) / 100);
  return { r, g, b, a };
}
export function isColor(str) { return parse(str) !== null; }

export function hslToRgb(h, s, l) {
  const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}
export function rgbToHsl({ r, g, b }) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  let h = 0, s = 0;
  if (d) {
    s = d / (1 - Math.abs(2 * l - 1));
    h = mx === r ? ((g - b) / d + (g < b ? 6 : 0)) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
  }
  return { h, s, l };
}
const h2 = (n) => ("0" + clamp(Math.round(n), 0, 255).toString(16)).slice(-2);
export function toHex({ r, g, b, a = 1 }) { return "#" + h2(r) + h2(g) + h2(b) + (a < 1 ? h2(a * 255) : ""); }
export function toCss({ r, g, b, a = 1 }, keep) {
  return a < 1 ? `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${+a.toFixed(3)})` : toHex({ r, g, b });
}

/* mélange c1 → c2 de t (0-1) */
export function mix(c1, c2, t) {
  const a = typeof c1 === "string" ? parse(c1) : c1, b = typeof c2 === "string" ? parse(c2) : c2;
  return { r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t, b: a.b + (b.b - a.b) * t, a: a.a + (b.a - a.a) * t };
}
export function withAlpha(c, alpha) { const p = typeof c === "string" ? parse(c) : c; return { ...p, a: alpha }; }

/* composition d'une couleur translucide sur un fond opaque */
export function over(fg, bg) {
  const f = typeof fg === "string" ? parse(fg) : fg, b = typeof bg === "string" ? parse(bg) : bg;
  const a = f.a;
  return { r: f.r * a + b.r * (1 - a), g: f.g * a + b.g * (1 - a), b: f.b * a + b.b * (1 - a), a: 1 };
}

/* WCAG 2.x */
export function luminance(c) {
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
}
export function contrast(fg, bg) {
  const b = typeof bg === "string" ? parse(bg) : bg;
  const f = over(typeof fg === "string" ? parse(fg) : fg, b);
  const l1 = luminance(f), l2 = luminance(over(b, { r: 255, g: 255, b: 255, a: 1 }));
  const hi = Math.max(l1, l2), lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}
export const grade = (ratio, large = false) => (ratio >= (large ? 4.5 : 7) ? "AAA" : ratio >= (large ? 3 : 4.5) ? "AA" : ratio >= 3 ? "AA large" : "échec");

/* nuances 50 → 900 autour d'une couleur de base (la base est placée en 500) */
export const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
export function scale(base) {
  const p = parse(base);
  if (!p) return null;
  const { h, s, l } = rgbToHsl(p);
  const out = {};
  const L = { 50: 0.96, 100: 0.92, 200: 0.84, 300: 0.74, 400: 0.62, 500: l, 600: l * 0.82, 700: l * 0.66, 800: l * 0.5, 900: l * 0.36 };
  for (const k of STEPS) {
    const sat = k < 500 ? s * (0.55 + 0.45 * (k / 500)) : s;
    out[k] = toHex({ r: 0, g: 0, b: 0, ...(() => { const [r, g, b] = hslToRgb(h, clamp(sat, 0, 1), clamp(L[k], 0, 1)); return { r, g, b }; })() });
  }
  return out;
}

/* ajuste la luminosité d'un texte jusqu'à atteindre le ratio voulu sur un fond (suggestion non bloquante) */
export function suggestText(fg, bg, target = 4.5) {
  const p = parse(fg); if (!p) return fg;
  const { h, s, l } = rgbToHsl(p), bgL = luminance(over(parse(bg), { r: 255, g: 255, b: 255, a: 1 }));
  const dir = bgL > 0.4 ? -1 : 1;
  for (let i = 0; i <= 100; i++) {
    const L = clamp(l + dir * i * 0.01, 0, 1), [r, g, b] = hslToRgb(h, s, L), c = { r, g, b, a: 1 };
    if (contrast(c, bg) >= target) return toHex(c);
  }
  return dir < 0 ? "#000000" : "#ffffff";
}
