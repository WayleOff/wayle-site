/* Catalogue de polices proposées. `google` = paramètre `family=` de Google Fonts (poids exacts de chaque famille).
   Les polices « système » n'ont rien à charger. `verified:false` = poids à contrôler visuellement dans le panneau (étape 2). */
export const FONTS = [
  { name: "Bricolage Grotesque", kind: "display", fallback: '"Figtree",system-ui,sans-serif', google: "Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800", preloaded: true },
  { name: "Figtree", kind: "sans", fallback: "system-ui,sans-serif", google: "Figtree:wght@400;500;600", preloaded: true },
  { name: "Inter", kind: "sans", fallback: "system-ui,sans-serif", google: "Inter:wght@400..800", verified: false },
  { name: "DM Sans", kind: "sans", fallback: "system-ui,sans-serif", google: "DM+Sans:wght@400..800", verified: false },
  { name: "Space Grotesk", kind: "display", fallback: "system-ui,sans-serif", google: "Space+Grotesk:wght@400..700", verified: false },
  { name: "Playfair Display", kind: "serif", fallback: "Georgia,serif", google: "Playfair+Display:wght@400..800", verified: false },
  { name: "JetBrains Mono", kind: "mono", fallback: "ui-monospace,monospace", google: "JetBrains+Mono:wght@400..800", verified: false },
  /* polices envoyées par l'administrateur (.woff2) : le fichier se règle dans typography.customN.file */
  { name: "Police importée 1", kind: "custom", slot: 1, fallback: "system-ui,sans-serif", google: null },
  { name: "Police importée 2", kind: "custom", slot: 2, fallback: "system-ui,sans-serif", google: null },
  { name: "Système", kind: "sans", fallback: "", stack: 'system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif', google: null },
  { name: "Georgia", kind: "serif", fallback: "", stack: "Georgia,'Times New Roman',serif", google: null },
  { name: "Monospace système", kind: "mono", fallback: "", stack: 'ui-monospace,SFMono-Regular,Menlo,Consolas,monospace', google: null },
];
/* @import Google Fonts pour les polices du catalogue qui ne sont pas déjà chargées par les pages */
export function fontImports(names) {
  const out = [];
  for (const n of new Set(names)) { const f = fontByName(n); if (f && f.google && !f.preloaded) out.push(`@import url("https://fonts.googleapis.com/css2?family=${f.google}&display=swap");`); }
  return out;
}
export function fontByName(n) { return FONTS.find((f) => f.name === n) || null; }
export function fontStack(name) {
  const f = fontByName(name);
  if (!f) return null;
  if (f.stack) return f.stack;
  return '"' + f.name + '"' + (f.fallback ? "," + f.fallback : "");
}
