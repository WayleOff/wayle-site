/* Rapport de contraste WCAG (informatif, jamais bloquant). */
import { contrast, grade, parse, over } from "./color.js";
const PAIRS = [
  ["ink", "bg", "Texte principal / fond", false],
  ["mid", "bg", "Texte secondaire / fond", false],
  ["btnInk", "btn", "Texte du bouton / bouton", false],
  ["primary", "bg", "Primaire / fond (texte large)", true],
  ["secondary", "bg", "Secondaire / fond (texte large)", true],
  ["error", "bg", "Erreur / fond", false],
  ["success", "bg", "Succès / fond", false],
];
export function contrastReport(theme) {
  const out = [];
  for (const mode of ["light", "dark"]) {
    const c = theme.colors[mode];
    const base = over(parse(c.bg), { r: 255, g: 255, b: 255, a: 1 });
    for (const [fg, bg, label, large] of PAIRS) {
      const b = bg === "bg" ? base : over(parse(c[bg]), base);
      const ratio = contrast(c[fg], b);
      out.push({ mode, label, fg, bg, ratio: +ratio.toFixed(2), grade: grade(ratio, large), ok: ratio >= (large ? 3 : 4.5) });
    }
  }
  return out;
}
